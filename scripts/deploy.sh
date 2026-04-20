#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# deploy.sh — Script de déploiement AWS pour SmartRecruit
# ═══════════════════════════════════════════════════════════════════════════════
#
# Ce script automatise :
#   1. La création du secret dans AWS Secrets Manager
#   2. La création et la configuration du bucket S3 (privé + chiffré)
#   3. La création du rôle IAM pour l'EC2
#   4. Le build et le push des images Docker vers ECR (optionnel)
#   5. Le déploiement via docker-compose sur l'EC2
#
# Pré-requis :
#   - AWS CLI installé et configuré (aws configure)
#   - Docker et docker-compose installés sur la machine locale
#   - Droits IAM suffisants (AdministratorAccess ou policy sur mesure)
#
# Usage :
#   chmod +x deploy.sh
#   ./deploy.sh
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ─── Couleurs ────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}[INFO]${NC}  $1"; }
log_success() { echo -e "${GREEN}[OK]${NC}    $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ─── Variables — À PERSONNALISER ─────────────────────────────────────────────
AWS_REGION="${AWS_REGION:-eu-west-1}"
PROJECT_NAME="smartrecruit"
ENV="prod"

# S3
BUCKET_NAME="${PROJECT_NAME}-cvs-${ENV}"

# Secrets Manager
SECRET_NAME="${PROJECT_NAME}/${ENV}/secrets"

# IAM
ROLE_NAME="${PROJECT_NAME}-ec2-role-${ENV}"
POLICY_NAME="${PROJECT_NAME}-ec2-policy-${ENV}"
INSTANCE_PROFILE_NAME="${PROJECT_NAME}-ec2-profile-${ENV}"

# RDS — À remplir avec vos vraies valeurs
RDS_ENDPOINT=""       # ex: mydb.xxxx.eu-west-1.rds.amazonaws.com
RDS_DB_NAME="Smart_recruite"
RDS_USERNAME="admin"
RDS_PASSWORD=""       # Sera stocké dans Secrets Manager

# JWT — Générer une clé sécurisée de 64+ caractères
JWT_SECRET=""         # ex: openssl rand -base64 64

# EC2
EC2_HOST=""           # IP publique ou DNS de votre EC2
EC2_USER="ec2-user"  # Amazon Linux: ec2-user | Ubuntu: ubuntu
EC2_KEY_PATH="~/.ssh/smartrecruit.pem"

# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         SmartRecruit — Déploiement AWS                      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# ─── Vérification des pré-requis ─────────────────────────────────────────────
check_prerequisites() {
    log_info "Vérification des pré-requis..."

    command -v aws     >/dev/null 2>&1 || log_error "AWS CLI non installé"
    command -v docker  >/dev/null 2>&1 || log_error "Docker non installé"
    command -v ssh     >/dev/null 2>&1 || log_error "SSH non installé"

    aws sts get-caller-identity >/dev/null 2>&1 || log_error "AWS CLI non configuré (lancez: aws configure)"

    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    log_success "Compte AWS : ${AWS_ACCOUNT_ID} | Région : ${AWS_REGION}"

    [[ -z "$RDS_PASSWORD" ]] && log_error "RDS_PASSWORD non défini dans le script"
    [[ -z "$JWT_SECRET"   ]] && log_error "JWT_SECRET non défini (générez avec: openssl rand -base64 64)"
    [[ -z "$EC2_HOST"     ]] && log_error "EC2_HOST non défini dans le script"
}

# ─── 1. AWS Secrets Manager ───────────────────────────────────────────────────
setup_secrets_manager() {
    log_info "Configuration du secret AWS Secrets Manager..."

    SECRET_JSON=$(cat <<EOF
{
  "db_password": "${RDS_PASSWORD}",
  "jwt_secret":  "${JWT_SECRET}"
}
EOF
)

    # Vérifier si le secret existe déjà
    if aws secretsmanager describe-secret --secret-id "${SECRET_NAME}" --region "${AWS_REGION}" >/dev/null 2>&1; then
        log_warn "Secret '${SECRET_NAME}' déjà existant — mise à jour..."
        aws secretsmanager update-secret \
            --secret-id "${SECRET_NAME}" \
            --secret-string "${SECRET_JSON}" \
            --region "${AWS_REGION}" >/dev/null
    else
        log_info "Création du secret '${SECRET_NAME}'..."
        aws secretsmanager create-secret \
            --name "${SECRET_NAME}" \
            --description "Secrets de production pour SmartRecruit" \
            --secret-string "${SECRET_JSON}" \
            --region "${AWS_REGION}" >/dev/null
    fi

    log_success "Secret Secrets Manager configuré : ${SECRET_NAME}"
}

# ─── 2. S3 Bucket ────────────────────────────────────────────────────────────
setup_s3_bucket() {
    log_info "Configuration du bucket S3 : ${BUCKET_NAME}..."

    # Créer le bucket (gestion région différente de us-east-1)
    if aws s3api head-bucket --bucket "${BUCKET_NAME}" --region "${AWS_REGION}" 2>/dev/null; then
        log_warn "Bucket '${BUCKET_NAME}' déjà existant"
    else
        if [ "${AWS_REGION}" = "us-east-1" ]; then
            aws s3api create-bucket \
                --bucket "${BUCKET_NAME}" \
                --region "${AWS_REGION}" >/dev/null
        else
            aws s3api create-bucket \
                --bucket "${BUCKET_NAME}" \
                --region "${AWS_REGION}" \
                --create-bucket-configuration LocationConstraint="${AWS_REGION}" >/dev/null
        fi
        log_success "Bucket créé : ${BUCKET_NAME}"
    fi

    # Bloquer tout accès public (CRITIQUE — CVs privés !)
    log_info "Blocage de l'accès public au bucket..."
    aws s3api put-public-access-block \
        --bucket "${BUCKET_NAME}" \
        --public-access-block-configuration \
            "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" >/dev/null

    # Chiffrement AES-256 par défaut
    log_info "Activation du chiffrement AES-256..."
    aws s3api put-bucket-encryption \
        --bucket "${BUCKET_NAME}" \
        --server-side-encryption-configuration '{
            "Rules": [{
                "ApplyServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "AES256"
                },
                "BucketKeyEnabled": true
            }]
        }' >/dev/null

    # Versioning (permet la récupération en cas d'erreur)
    log_info "Activation du versioning..."
    aws s3api put-bucket-versioning \
        --bucket "${BUCKET_NAME}" \
        --versioning-configuration Status=Enabled >/dev/null

    # Politique de cycle de vie : supprimer les anciennes versions après 90 jours
    aws s3api put-bucket-lifecycle-configuration \
        --bucket "${BUCKET_NAME}" \
        --lifecycle-configuration '{
            "Rules": [{
                "ID": "cleanup-old-versions",
                "Status": "Enabled",
                "Filter": {"Prefix": "cvs/"},
                "NoncurrentVersionExpiration": {"NoncurrentDays": 90}
            }]
        }' >/dev/null

    log_success "Bucket S3 configuré : ${BUCKET_NAME} (privé + chiffré + versioning)"
}

# ─── 3. IAM Rôle pour EC2 ────────────────────────────────────────────────────
setup_iam_role() {
    log_info "Configuration du rôle IAM pour EC2..."
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

    # Trust policy : permet à EC2 d'assumer ce rôle
    TRUST_POLICY='{
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "ec2.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }]
    }'

    # Créer le rôle si inexistant
    if ! aws iam get-role --role-name "${ROLE_NAME}" >/dev/null 2>&1; then
        aws iam create-role \
            --role-name "${ROLE_NAME}" \
            --assume-role-policy-document "${TRUST_POLICY}" \
            --description "Rôle IAM pour EC2 SmartRecruit — accès S3 et Secrets Manager" >/dev/null
        log_success "Rôle IAM créé : ${ROLE_NAME}"
    else
        log_warn "Rôle '${ROLE_NAME}' déjà existant"
    fi

    # Politique d'accès (least privilege)
    POLICY_DOCUMENT=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3CvAccess",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::${BUCKET_NAME}/cvs/*"
    },
    {
      "Sid": "S3ListBucket",
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::${BUCKET_NAME}"
    },
    {
      "Sid": "SecretsManagerRead",
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"],
      "Resource": "arn:aws:secretsmanager:${AWS_REGION}:${AWS_ACCOUNT_ID}:secret:${SECRET_NAME}-*"
    }
  ]
}
EOF
)

    # Créer ou mettre à jour la policy inline
    aws iam put-role-policy \
        --role-name "${ROLE_NAME}" \
        --policy-name "${POLICY_NAME}" \
        --policy-document "${POLICY_DOCUMENT}" >/dev/null

    # Créer l'instance profile pour attacher le rôle à l'EC2
    if ! aws iam get-instance-profile --instance-profile-name "${INSTANCE_PROFILE_NAME}" >/dev/null 2>&1; then
        aws iam create-instance-profile \
            --instance-profile-name "${INSTANCE_PROFILE_NAME}" >/dev/null
        aws iam add-role-to-instance-profile \
            --instance-profile-name "${INSTANCE_PROFILE_NAME}" \
            --role-name "${ROLE_NAME}" >/dev/null
        log_success "Instance profile créé : ${INSTANCE_PROFILE_NAME}"
    else
        log_warn "Instance profile '${INSTANCE_PROFILE_NAME}' déjà existant"
    fi

    log_success "Rôle IAM configuré : ${ROLE_NAME}"
    echo ""
    log_warn "⚠️  N'oubliez pas d'attacher le rôle à votre EC2 :"
    log_warn "   aws ec2 associate-iam-instance-profile \\"
    log_warn "     --instance-id VOTRE_INSTANCE_ID \\"
    log_warn "     --iam-instance-profile Name=${INSTANCE_PROFILE_NAME}"
}

# ─── 4. Génération du .env de production ─────────────────────────────────────
generate_env_file() {
    log_info "Génération du fichier .env de production..."

    cat > .env.prod <<EOF
# ── Généré automatiquement par deploy.sh le $(date) ──
# !! Ne pas committer ce fichier !!

# RDS MySQL
DB_HOST=${RDS_ENDPOINT}
DB_NAME=${RDS_DB_NAME}
DB_USERNAME=${RDS_USERNAME}

# AWS
AWS_REGION=${AWS_REGION}
AWS_BUCKET_NAME=${BUCKET_NAME}
SECRET_NAME=${SECRET_NAME}

# JWT (géré via Secrets Manager — laisser vide ou mettre la valeur de secours)
JWT_SECRET=

# Frontend
VITE_API_URL=http://${EC2_HOST}:8090

# LLM (à renseigner manuellement)
GROQ_API_KEY=REMPLACEZ_PAR_VOTRE_CLE_GROQ
EOF

    log_success "Fichier .env.prod généré"
}

# ─── 5. Déploiement sur EC2 ───────────────────────────────────────────────────
deploy_to_ec2() {
    log_info "Déploiement sur EC2 : ${EC2_HOST}..."

    SSH_CMD="ssh -i ${EC2_KEY_PATH} -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST}"

    # Installer Docker + docker-compose sur EC2 si nécessaire
    log_info "Vérification de Docker sur l'EC2..."
    $SSH_CMD "command -v docker >/dev/null 2>&1 || (sudo yum update -y && sudo yum install -y docker && sudo systemctl start docker && sudo usermod -aG docker \$USER)"
    $SSH_CMD "command -v docker-compose >/dev/null 2>&1 || sudo curl -L 'https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)' -o /usr/local/bin/docker-compose && sudo chmod +x /usr/local/bin/docker-compose"

    # Créer le répertoire de déploiement
    $SSH_CMD "mkdir -p ~/smartrecruit"

    # Copier les fichiers nécessaires
    log_info "Copie des fichiers vers EC2..."
    scp -i "${EC2_KEY_PATH}" -r \
        docker-compose.prod.yml \
        .env.prod \
        Client Server "TextExtraction&LLm" \
        "${EC2_USER}@${EC2_HOST}:~/smartrecruit/"

    # Renommer le .env.prod en .env sur l'EC2
    $SSH_CMD "mv ~/smartrecruit/.env.prod ~/smartrecruit/.env"

    # Build et démarrage
    log_info "Build et démarrage des conteneurs..."
    $SSH_CMD "cd ~/smartrecruit && docker-compose -f docker-compose.prod.yml pull 2>/dev/null || true"
    $SSH_CMD "cd ~/smartrecruit && docker-compose -f docker-compose.prod.yml up -d --build --remove-orphans"

    # Vérification
    sleep 15
    log_info "Vérification de l'état des conteneurs..."
    $SSH_CMD "cd ~/smartrecruit && docker-compose -f docker-compose.prod.yml ps"

    log_success "Déploiement terminé !"
    echo ""
    echo "  📱 Frontend  : http://${EC2_HOST}"
    echo "  🔧 Backend   : http://${EC2_HOST}:8090"
    echo "  🤖 LLM       : http://${EC2_HOST}:5001"
}

# ─── Menu principal ───────────────────────────────────────────────────────────
main() {
    check_prerequisites

    echo ""
    echo "Que voulez-vous faire ?"
    echo "  1) Tout déployer (Secrets Manager + S3 + IAM + EC2)"
    echo "  2) Setup AWS uniquement (Secrets Manager + S3 + IAM)"
    echo "  3) Déployer sur EC2 uniquement"
    echo "  4) Générer le .env uniquement"
    echo ""
    read -rp "Votre choix [1-4] : " CHOICE

    case $CHOICE in
        1)
            setup_secrets_manager
            setup_s3_bucket
            setup_iam_role
            generate_env_file
            deploy_to_ec2
            ;;
        2)
            setup_secrets_manager
            setup_s3_bucket
            setup_iam_role
            generate_env_file
            ;;
        3)
            generate_env_file
            deploy_to_ec2
            ;;
        4)
            generate_env_file
            ;;
        *)
            log_error "Choix invalide"
            ;;
    esac

    echo ""
    log_success "Script terminé avec succès 🚀"
}

main "$@"

package ma.xproce.login_test.Services;

import ma.xproce.login_test.Exeptions.InvalidFileException;
import ma.xproce.login_test.Exeptions.ResourceNotFoundException;
import ma.xproce.login_test.Mappers.CandidatureMapper;
import ma.xproce.login_test.dao.entities.Candidature;
import ma.xproce.login_test.dao.entities.CandidatureStatus;
import ma.xproce.login_test.dao.entities.CvFile;
import ma.xproce.login_test.dao.entities.Offre;
import ma.xproce.login_test.dao.entities.user_entity;
import ma.xproce.login_test.dao.reposetories.CandidatureRepository;
import ma.xproce.login_test.dao.reposetories.CvFileRepository;
import ma.xproce.login_test.dao.reposetories.OffreRepository;
import ma.xproce.login_test.dao.reposetories.UserReposetory;
import ma.xproce.login_test.dto.CandidatureDtos.CandidatureHrResponse;
import ma.xproce.login_test.dto.CandidatureDtos.CandidatureResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CandidatureOffreService implements ICandidatureOffre_Service {

    private final OffreRepository offreRepository;
    private final CandidatureRepository candidatureRepository;
    private final UserReposetory userRepository;
    private final CvFileRepository cvFileRepository;
    private final CandidatureMapper candidatureMapper;
    private final ICvFileStorageService cvFileStorageService;
    private final AuthorizationUtils authorizationUtils;
    private final CandidatureStatusValidator statusValidator;

    // Constantes de validation
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    private static final String ALLOWED_FILE_TYPE = "application/pdf";

    @Autowired
    public CandidatureOffreService(
            OffreRepository offreRepository,
            CandidatureRepository candidatureRepository,
            UserReposetory userRepository,
            CvFileRepository cvFileRepository,
            CandidatureMapper candidatureMapper,
            ICvFileStorageService cvFileStorageService,
            AuthorizationUtils authorizationUtils,
            CandidatureStatusValidator statusValidator
    ) {
        this.offreRepository = offreRepository;
        this.candidatureRepository = candidatureRepository;
        this.userRepository = userRepository;
        this.cvFileRepository = cvFileRepository;
        this.candidatureMapper = candidatureMapper;
        this.cvFileStorageService = cvFileStorageService;
        this.authorizationUtils = authorizationUtils;
        this.statusValidator = statusValidator;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CandidatureHrResponse> listCandidaturesForOffre(Long offreId, String emailConnecte) {
        user_entity connecte = userRepository.findByEmail(emailConnecte)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouve"));

        Offre offre = offreRepository.findById(offreId)
                .orElseThrow(() -> new ResourceNotFoundException("Offre non trouvee"));

        if (!authorizationUtils.isOffreOwnerOrAdmin(offre, connecte)) {
            throw new AccessDeniedException("Vous ne pouvez pas consulter les candidatures de cette offre");
        }

        List<Candidature> list = candidatureRepository.findByOffreId(offreId);
        return list.stream().map(candidatureMapper::toHrResponse).toList();
    }

    @Override
    @Transactional
    public CandidatureResponse createCandidature(Long offreId, MultipartFile cvFile, String emailCandidat) {
        // 1. Valider le fichier
        validerFichierCv(cvFile);

        // 2. Récupérer l'utilisateur
        user_entity candidat = userRepository.findByEmail(emailCandidat)
                .orElseThrow(() -> new ResourceNotFoundException("Candidat non trouve"));

        // 3. Récupérer l'offre
        Offre offre = offreRepository.findById(offreId)
                .orElseThrow(() -> new ResourceNotFoundException("Offre non trouvee"));

        // 4. Vérifier que le candidat n'a pas déjà postulé à cette offre
        if (candidatureRepository.findByOffreIdAndCandidatId(offreId, candidat.getId()).isPresent()) {
            throw new InvalidFileException("Vous avez déjà postulé à cette offre");
        }

        // 5. Créer et sauvegarder le fichier CV
        CvFile savedCvFile = sauvegarderCvFile(cvFile);

        // 6. Créer la candidature
        Candidature candidature = new Candidature();
        candidature.setOffre(offre);
        candidature.setCandidat(candidat);
        candidature.setCvFile(savedCvFile);
        candidature.setDateSoumission(LocalDateTime.now());

        // Calculer le score de compatibilité (temporairement, sera remplacé par l'IA)
        Double scoreCompatibilite = calculerScoreCompatibilite(offre, savedCvFile);
        candidature.setScoreCompatibilite(scoreCompatibilite);

        // 7. Sauvegarder
        Candidature saved = candidatureRepository.save(candidature);

        return candidatureMapper.toCandidateResponse(saved);
    }

    /**
     * Valide le fichier CV selon les critères de sécurité
     */
    private void validerFichierCv(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidFileException("Le fichier CV est obligatoire");
        }

        // Vérifier la taille
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new InvalidFileException("Le fichier CV dépasse la taille maximale de 5 MB");
        }

        // Vérifier le type
        if (!ALLOWED_FILE_TYPE.equals(file.getContentType())) {
            throw new InvalidFileException("Seuls les fichiers PDF sont acceptés");
        }

        // Vérifier le nom de fichier
        if (file.getOriginalFilename() == null || file.getOriginalFilename().isBlank()) {
            throw new InvalidFileException("Le nom du fichier est invalide");
        }
    }

    /**
     * Sauvegarde le fichier CV avec une clé de stockage sécurisée
     */
    private CvFile sauvegarderCvFile(MultipartFile file) {
        // 1. Sauvegarder le fichier physique via le service déié
        String storageKey = cvFileStorageService.saveFile(file);

        // 2. Créer et sauvegarder les métadonnées
        CvFile cvFile = new CvFile();
        cvFile.setStorageKey(storageKey);
        cvFile.setOriginalFileName(file.getOriginalFilename());
        cvFile.setContentType(file.getContentType());
        cvFile.setSizeBytes(file.getSize());
        cvFile.setUploadedAt(LocalDateTime.now());

        return cvFileRepository.save(cvFile);
    }

    /**
     * Calcule le score de compatibilité (TEMPORAIRE - sera remplacé par l'IA)
     */
    private Double calculerScoreCompatibilite(Offre offre, CvFile cvFile) {
        // Score aléatoire temporaire entre 0 et 100 (à remplacer par l'IA)
        return Math.random() * 100;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CandidatureResponse> listMyCandidatures(String emailCandidat) {
        user_entity candidat = userRepository.findByEmail(emailCandidat)
                .orElseThrow(() -> new ResourceNotFoundException("Candidat non trouve"));

        List<Candidature> candidatures = candidatureRepository.findByCandidatId(candidat.getId());
        return candidatures.stream().map(candidatureMapper::toCandidateResponse).toList();
    }

    @Override
    @Transactional
    public CandidatureResponse updateCandidatureStatus(Long candidatureId, CandidatureStatus newStatus, String emailHr) {
        // 1. Récupérer l'utilisateur HR
        user_entity hr = userRepository.findByEmail(emailHr)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur HR non trouve"));

        // 2. Récupérer la candidature
        Candidature candidature = candidatureRepository.findById(candidatureId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidature non trouvee"));

        // 3. Vérifier que l'HR est propriétaire de l'offre
        if (!authorizationUtils.isOffreOwnerOrAdmin(candidature.getOffre(), hr)) {
            throw new AccessDeniedException("Vous ne pouvez pas modifier cette candidature");
        }

        // 4. Valider la transition d'état
        statusValidator.validateTransition(candidature.getStatus(), newStatus);

        // 5. Mettre à jour le statut
        candidature.setStatus(newStatus);

        // 6. Sauvegarder et retourner
        Candidature updated = candidatureRepository.save(candidature);
        return candidatureMapper.toCandidateResponse(updated);
    }
}




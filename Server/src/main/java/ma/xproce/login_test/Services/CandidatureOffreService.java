package ma.xproce.login_test.Services;

import ma.xproce.login_test.Exeptions.InvalidFileException;
import ma.xproce.login_test.Exeptions.ResourceNotFoundException;
import ma.xproce.login_test.Mappers.CandidatureMapper;
import ma.xproce.login_test.dao.entities.Candidature;
import ma.xproce.login_test.dao.entities.CandidatureStatus;
import ma.xproce.login_test.dao.entities.CvFile;
import ma.xproce.login_test.dao.entities.DemandeAccesCvStatus;
import ma.xproce.login_test.dao.entities.Offre;
import ma.xproce.login_test.dao.entities.user_entity;
import ma.xproce.login_test.dao.reposetories.CandidatureRepository;
import ma.xproce.login_test.dao.reposetories.CvFileRepository;
import ma.xproce.login_test.dao.reposetories.DemandeAccesCvRepository;
import ma.xproce.login_test.dao.reposetories.OffreRepository;
import ma.xproce.login_test.dao.reposetories.UserReposetory;
import ma.xproce.login_test.dto.AiAnalysisResponse;
import ma.xproce.login_test.dto.CandidatureDtos.CandidatureHrResponse;
import ma.xproce.login_test.dto.CandidatureDtos.CandidatureResponse;
import ma.xproce.login_test.dto.CvDownloadResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Base64;
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
    private final DemandeAccesCvRepository demandeAccesCvRepository;
    private final AiService aiService;
    private final CvFileValidationService cvFileValidator;

    @Autowired
    public CandidatureOffreService(
            OffreRepository offreRepository,
            CandidatureRepository candidatureRepository,
            UserReposetory userRepository,
            CvFileRepository cvFileRepository,
            CandidatureMapper candidatureMapper,
            ICvFileStorageService cvFileStorageService,
            AuthorizationUtils authorizationUtils,
            CandidatureStatusValidator statusValidator,
            DemandeAccesCvRepository demandeAccesCvRepository,
            AiService aiService,
            CvFileValidationService cvFileValidator
    ) {
        this.offreRepository = offreRepository;
        this.candidatureRepository = candidatureRepository;
        this.userRepository = userRepository;
        this.cvFileRepository = cvFileRepository;
        this.candidatureMapper = candidatureMapper;
        this.cvFileStorageService = cvFileStorageService;
        this.authorizationUtils = authorizationUtils;
        this.statusValidator = statusValidator;
        this.demandeAccesCvRepository = demandeAccesCvRepository;
        this.aiService = aiService;
        this.cvFileValidator = cvFileValidator;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CandidatureHrResponse> listCandidaturesForOffre(Long offreId, String emailConnecte) {
        user_entity hr = userRepository.findByEmail(emailConnecte)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouve"));

        offreRepository.findById(offreId)
                .orElseThrow(() -> new ResourceNotFoundException("Offre non trouvee"));

        List<Candidature> list = candidatureRepository.findByOffreId(offreId);
        return list.stream().map(c -> {
            CandidatureHrResponse dto = candidatureMapper.toHrResponse(c);
            
            // Check if HR has approved access to original CV
            demandeAccesCvRepository.findByCandidatureIdAndHrId(c.getId(), hr.getId())
                .ifPresent(demande -> {
                    if (demande.getStatus() == DemandeAccesCvStatus.APPROUVEE) {
                        dto.setHasAccessToOriginalCv(true);
                        dto.setDemandeAccesId(demande.getId());
                    }
                });
            return dto;
        }).toList();
    }

    @Override
    @Transactional
    public CandidatureResponse createCandidature(Long offreId, MultipartFile cvFile, String emailCandidat) {
        // 1. Valider le fichier (service centralisé, réutilisé partout)
        cvFileValidator.validate(cvFile);

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

        // 5. Construire un contexte textuel enrichi de l'offre pour l'IA
        String offerContext = buildOfferContext(offre);

        // 6. Appeler le service IA Flask (stateless) avec le FICHIER brut + contexte de l'offre
        // L'IA va extraire le texte, analyser, et générer le PDF anonymisé en une seule passe.
        AiAnalysisResponse aiResult = aiService.analyzeCv(cvFile, offerContext);

        // 7. Sauvegarder le fichier CV original (local en dev, S3 en prod)
        CvFile savedCvFile = sauvegarderCvFile(cvFile);

        // 8. Créer la candidature avec toutes les données IA
        Candidature candidature = new Candidature();
        candidature.setOffre(offre);
        candidature.setCandidat(candidat);
        candidature.setCvFile(savedCvFile);
        candidature.setDateSoumission(LocalDateTime.now());

        // Score et analyse textuelle
        candidature.setScoreCompatibilite(aiResult.getScore());
        candidature.setScoreAnalysis(aiResult.getScoreAnalysis());

        // Compétences et diplômes
        if (aiResult.getCompetences() != null && !aiResult.getCompetences().isEmpty()) {
            candidature.setCompetences(String.join(" | ", aiResult.getCompetences()));
        }
        if (aiResult.getDiplomes() != null && !aiResult.getDiplomes().isEmpty()) {
            candidature.setDiplomes(String.join(" | ", aiResult.getDiplomes()));
        }

        // 9. Gérer le PDF anonymisé retourné par l'IA (en Base64)
        String base64Pdf = aiResult.getAnonymizedPdfBase64();
        if (base64Pdf != null && !base64Pdf.isBlank()) {
            try {
                byte[] anonymizedBytes = Base64.getDecoder().decode(base64Pdf);
                // Sauvegarder le fichier anonymisé via le service de stockage existant
                String anonymizedKey = cvFileStorageService.saveFile(
                        anonymizedBytes, 
                        "anon_" + savedCvFile.getOriginalFileName(), 
                        "application/pdf"
                );
                savedCvFile.setAnonymizedStorageKey(anonymizedKey);
                cvFileRepository.save(savedCvFile);
            } catch (Exception e) {
                System.err.println("⚠️  Échec du stockage du PDF anonymisé envoyé par l'IA : " + e.getMessage());
            }
        }

        Candidature saved = candidatureRepository.save(candidature);

        return candidatureMapper.toCandidateResponse(saved);
    }

    /**
     * Construit un contexte textuel enrichi de l'offre pour l'IA.
     * Combine le titre, la description et les compétences requises
     * afin de donner au LLM le meilleur contexte possible pour le matching.
     *
     * Exemple de sortie :
     * "Poste : Développeur Android Senior
     *  Description : Nous recherchons...
     *  Compétences requises : Kotlin, Android Studio, Firebase"
     */
    private String buildOfferContext(Offre offre) {
        StringBuilder sb = new StringBuilder();

        if (offre.getTitre() != null && !offre.getTitre().isBlank()) {
            sb.append("Poste : ").append(offre.getTitre()).append("\n\n");
        }
        if (offre.getDescription() != null && !offre.getDescription().isBlank()) {
            sb.append("Description : ").append(offre.getDescription()).append("\n\n");
        }
        if (offre.getCompetencesRequises() != null && !offre.getCompetencesRequises().isBlank()) {
            sb.append("Compétences requises : ").append(offre.getCompetencesRequises());
        }

        return sb.toString().trim();
    }

    private CvFile sauvegarderCvFile(MultipartFile file) {
        String storageKey = cvFileStorageService.saveFile(file);
        CvFile cvFile = new CvFile();
        cvFile.setStorageKey(storageKey);
        cvFile.setOriginalFileName(file.getOriginalFilename());
        cvFile.setContentType(file.getContentType());
        cvFile.setSizeBytes(file.getSize());
        cvFile.setUploadedAt(LocalDateTime.now());
        return cvFileRepository.save(cvFile);
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
    public CandidatureHrResponse updateCandidatureStatus(Long candidatureId, CandidatureStatus newStatus, String emailHr) {
        user_entity hr = userRepository.findByEmail(emailHr)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur HR non trouve"));

        Candidature candidature = candidatureRepository.findById(candidatureId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidature non trouvee"));

        boolean hasApprovedAccess = demandeAccesCvRepository
                .findByCandidatureIdAndHrId(candidatureId, hr.getId())
                .filter(demande -> demande.getStatus() == DemandeAccesCvStatus.APPROUVEE)
                .isPresent();

        if (!hasApprovedAccess) {
            throw new AccessDeniedException("Vous devez avoir une demande d'accès approuvée pour valider cette candidature");
        }

        statusValidator.validateTransition(candidature.getStatus(), newStatus);
        candidature.setStatus(newStatus);

        Candidature updated = candidatureRepository.save(candidature);
        
        CandidatureHrResponse dto = candidatureMapper.toHrResponse(updated);
        dto.setHasAccessToOriginalCv(true); // Since they are updating status, they must have approved access already
        
        demandeAccesCvRepository.findByCandidatureIdAndHrId(candidatureId, hr.getId())
                .ifPresent(demande -> dto.setDemandeAccesId(demande.getId()));
                
        // Retourner la vue RH (avec scoreAnalysis, compétences)
        return dto;
    }

    /**
     * Candidat — visualiser/télécharger son propre CV (original).
     * Sécurité : on vérifie que la candidature appartient bien au candidat connecté.
     */
    @Override
    @Transactional(readOnly = true)
    public CvDownloadResponse getMyCv(Long candidatureId, String emailCandidat) {
        // Récupérer la candidature
        Candidature candidature = candidatureRepository.findById(candidatureId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidature introuvable : " + candidatureId));

        // Vérifier que c'est bien le candidat propriétaire
        if (!candidature.getCandidat().getEmail().equals(emailCandidat)) {
            throw new AccessDeniedException("Vous n'êtes pas autorisé à accéder à ce CV.");
        }

        // Récupérer le fichier CV
        CvFile cvFile = candidature.getCvFile();
        if (cvFile == null) {
            throw new ResourceNotFoundException("Aucun fichier CV associé à cette candidature.");
        }

        byte[] content = cvFileStorageService.getFile(cvFile.getStorageKey());
        String fileName = cvFile.getOriginalFileName() != null ? cvFile.getOriginalFileName() : "mon-cv.pdf";

        return new CvDownloadResponse(content, fileName);
    }
}

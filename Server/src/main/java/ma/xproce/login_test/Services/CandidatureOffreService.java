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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

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

    @Value("${app.storage.type:local}")
    private String storageType;

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
            demandeAccesCvRepository.findByCandidatureIdAndHrId(c.getId(), hr.getId())
                    .ifPresent(demande -> {
                        if (demande.getStatus() == DemandeAccesCvStatus.APPROUVEE) {
                            dto.setHasAccessToOriginalCv(true);
                            dto.setDemandeAccesId(demande.getId());
                        }
                        dto.setAccessRequestStatus(demande.getStatus().name());
                    });
            return dto;
        }).toList();
    }

    @Override
    @Transactional
    public CandidatureResponse createCandidature(Long offreId, MultipartFile cvFile, String emailCandidat) {
        cvFileValidator.validate(cvFile);

        user_entity candidat = userRepository.findByEmail(emailCandidat)
                .orElseThrow(() -> new ResourceNotFoundException("Candidat non trouve"));

        Offre offre = offreRepository.findById(offreId)
                .orElseThrow(() -> new ResourceNotFoundException("Offre non trouvee"));

        if (candidatureRepository.findByOffreIdAndCandidatId(offreId, candidat.getId()).isPresent()) {
            throw new InvalidFileException("Vous avez déjà postulé à cette offre");
        }

        String offerContext = buildOfferContext(offre);
        AiAnalysisResponse aiResult = aiService.analyzeCv(cvFile, offerContext);
        CvFile savedCvFile = sauvegarderCvFile(cvFile);

        Candidature candidature = new Candidature();
        candidature.setOffre(offre);
        candidature.setCandidat(candidat);
        candidature.setCvFile(savedCvFile);
        candidature.setDateSoumission(LocalDateTime.now());
        candidature.setScoreCompatibilite(aiResult.getScore());
        candidature.setScoreAnalysis(aiResult.getScoreAnalysis());

        if (aiResult.getCompetences() != null && !aiResult.getCompetences().isEmpty()) {
            candidature.setCompetences(String.join(" | ", aiResult.getCompetences()));
        }
        if (aiResult.getDiplomes() != null && !aiResult.getDiplomes().isEmpty()) {
            candidature.setDiplomes(String.join(" | ", aiResult.getDiplomes()));
        }

        String base64Pdf = aiResult.getAnonymizedPdfBase64();
        if (base64Pdf != null && !base64Pdf.isBlank()) {
            try {
                byte[] anonymizedBytes = Base64.getDecoder().decode(base64Pdf);
                String anonymizedKey = cvFileStorageService.saveFile(
                        anonymizedBytes,
                        "anon_" + savedCvFile.getOriginalFileName(),
                        "application/pdf"
                );
                savedCvFile.setAnonymizedStorageKey(anonymizedKey);
                cvFileRepository.save(savedCvFile);
            } catch (Exception e) {
                System.err.println("⚠️  Échec du stockage du PDF anonymisé : " + e.getMessage());
            }
        }

        Candidature saved = candidatureRepository.save(candidature);
        return candidatureMapper.toCandidateResponse(saved);
    }

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

        // Règle métier : ACCEPTEE/REFUSEE nécessite un accès approuvé au CV original
        if (newStatus == CandidatureStatus.ACCEPTEE || newStatus == CandidatureStatus.REFUSEE) {
            boolean hasApprovedAccess = demandeAccesCvRepository
                    .findByCandidatureIdAndHrId(candidatureId, hr.getId())
                    .map(demande -> demande.getStatus() == DemandeAccesCvStatus.APPROUVEE)
                    .orElse(false);

            if (!hasApprovedAccess) {
                throw new AccessDeniedException(
                        "Accès refusé : Vous devez obtenir l'approbation de l'administrateur pour accéder " +
                                "au CV original avant de pouvoir accepter ou refuser ce candidat."
                );
            }
        }

        statusValidator.validateTransition(candidature.getStatus(), newStatus);
        candidature.setStatus(newStatus);

        if (newStatus == CandidatureStatus.ACCEPTEE || newStatus == CandidatureStatus.REFUSEE) {
            candidature.setDateDecision(LocalDateTime.now());
            candidature.setDecisionMaker(hr);
        }

        Candidature saved = candidatureRepository.save(candidature);

        CandidatureHrResponse dto = candidatureMapper.toHrResponse(saved);
        demandeAccesCvRepository.findByCandidatureIdAndHrId(candidatureId, hr.getId())
                .ifPresent(demande -> {
                    if (demande.getStatus() == DemandeAccesCvStatus.APPROUVEE) {
                        dto.setHasAccessToOriginalCv(true);
                        dto.setDemandeAccesId(demande.getId());
                    }
                    dto.setAccessRequestStatus(demande.getStatus().name());
                });

        return dto;
    }

    /**
     * Candidat — visualiser son propre CV.
     * Mode S3 (prod) : retourne storageKey → le contrôleur génère un lien pré-signé S3
     * Mode local (dev) : retourne les bytes directement
     */
    @Override
    @Transactional(readOnly = true)
    public CvDownloadResponse getMyCv(Long candidatureId, String emailCandidat) {
        Candidature candidature = candidatureRepository.findById(candidatureId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidature introuvable : " + candidatureId));

        if (!candidature.getCandidat().getEmail().equals(emailCandidat)) {
            throw new AccessDeniedException("Vous n'êtes pas autorisé à accéder à ce CV.");
        }

        CvFile cvFile = candidature.getCvFile();
        if (cvFile == null) {
            throw new ResourceNotFoundException("Aucun fichier CV associé à cette candidature.");
        }

        String storageKey = cvFile.getStorageKey();
        String fileName = cvFile.getOriginalFileName() != null
                ? cvFile.getOriginalFileName()
                : "mon-cv.pdf";

        boolean isS3 = "s3".equals(storageType);
        return CvDownloadResponse.builder()
                .content(isS3 ? null : cvFileStorageService.getFile(storageKey))
                .fileName(fileName)
                .storageKey(isS3 ? storageKey : null)
                .build();
    }

    /**
     * Historique des décisions RH pour une offre.
     * Retourne uniquement les candidatures ACCEPTÉES ou REFUSÉES, triées par date de décision desc.
     */
    @Override
    @Transactional(readOnly = true)
    public List<CandidatureHrResponse> getHistoriqueDecisionsForOffre(Long offreId, String emailHr) {
        user_entity hr = userRepository.findByEmail(emailHr)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur HR non trouve"));

        offreRepository.findById(offreId)
                .orElseThrow(() -> new ResourceNotFoundException("Offre non trouvee"));

        List<Candidature> candidatures = candidatureRepository.findByOffreId(offreId).stream()
                .filter(c -> c.getStatus() == CandidatureStatus.ACCEPTEE
                        || c.getStatus() == CandidatureStatus.REFUSEE)
                .sorted((c1, c2) -> {
                    if (c1.getDateDecision() == null && c2.getDateDecision() == null) return 0;
                    if (c1.getDateDecision() == null) return 1;
                    if (c2.getDateDecision() == null) return -1;
                    return c2.getDateDecision().compareTo(c1.getDateDecision());
                })
                .toList();

        return candidatures.stream().map(c -> {
            CandidatureHrResponse dto = candidatureMapper.toHrResponse(c);
            demandeAccesCvRepository.findByCandidatureIdAndHrId(c.getId(), hr.getId())
                    .ifPresent(demande -> {
                        if (demande.getStatus() == DemandeAccesCvStatus.APPROUVEE) {
                            dto.setHasAccessToOriginalCv(true);
                            dto.setDemandeAccesId(demande.getId());
                        }
                        dto.setAccessRequestStatus(demande.getStatus().name());
                    });
            return dto;
        }).toList();
    }
}
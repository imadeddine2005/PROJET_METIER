package ma.xproce.login_test.Services;

import ma.xproce.login_test.Exeptions.InvalidFileException;
import ma.xproce.login_test.Exeptions.ResourceNotFoundException;
import ma.xproce.login_test.Mappers.DemandeAccesCvMapper;
import ma.xproce.login_test.dao.entities.Candidature;
import ma.xproce.login_test.dao.entities.DemandeAccesCv;
import ma.xproce.login_test.dao.entities.DemandeAccesCvStatus;
import ma.xproce.login_test.dao.entities.user_entity;
import ma.xproce.login_test.dao.reposetories.CandidatureRepository;
import ma.xproce.login_test.dao.reposetories.DemandeAccesCvRepository;
import ma.xproce.login_test.dao.reposetories.UserReposetory;
import ma.xproce.login_test.dto.CvDownloadResponse;
import ma.xproce.login_test.dto.DemandeAccesCvDtos.DemandeAccesCvAdminResponse;
import ma.xproce.login_test.dto.DemandeAccesCvDtos.DemandeAccesCvResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class DemandeAccesCvService implements IDemandeAccesCvService {

    private final DemandeAccesCvRepository demandeRepository;
    private final CandidatureRepository candidatureRepository;
    private final UserReposetory userRepository;
    private final DemandeAccesCvMapper mapper;
    private final AuthorizationUtils authorizationUtils;
    private final ICvFileStorageService cvFileStorageService;

    @Autowired
    public DemandeAccesCvService(
            DemandeAccesCvRepository demandeRepository,
            CandidatureRepository candidatureRepository,
            UserReposetory userRepository,
            DemandeAccesCvMapper mapper,
            AuthorizationUtils authorizationUtils,
            ICvFileStorageService cvFileStorageService
    ) {
        this.demandeRepository = demandeRepository;
        this.candidatureRepository = candidatureRepository;
        this.userRepository = userRepository;
        this.mapper = mapper;
        this.authorizationUtils = authorizationUtils;
        this.cvFileStorageService = cvFileStorageService;
    }

    @Override
    @Transactional
    public DemandeAccesCvResponse creerDemande(Long candidatureId, String motif, String emailHr) {
        // 1. Vérifier HR existe
        user_entity hr = userRepository.findByEmail(emailHr)
                .orElseThrow(() -> new ResourceNotFoundException("HR non trouvé"));

        // 2. Vérifier candidature existe
        Candidature candidature = candidatureRepository.findById(candidatureId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidature non trouvée"));

        // 3. Prévenir doublons (un HR ne peut créer qu'une seule demande par candidature)
        if (demandeRepository.findByCandidatureIdAndHrId(candidatureId, hr.getId()).isPresent()) {
            throw new InvalidFileException("Vous avez déjà demandé l'accès à cette candidature");
        }

        // 4. Créer la demande
        DemandeAccesCv demande = new DemandeAccesCv();
        demande.setHr(hr);
        demande.setCandidature(candidature);
        demande.setMotif(motif);
        demande.setStatus(DemandeAccesCvStatus.EN_ATTENTE);
        demande.setCreatedAt(LocalDateTime.now());

        DemandeAccesCv saved = demandeRepository.save(demande);
        return mapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DemandeAccesCvResponse> mesDemandes(String emailHr) {
        user_entity hr = userRepository.findByEmail(emailHr)
                .orElseThrow(() -> new ResourceNotFoundException("HR non trouvé"));

        List<DemandeAccesCv> demandes = demandeRepository.findByHrId(hr.getId());
        return demandes.stream().map(mapper::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DemandeAccesCvAdminResponse> demandesEnAttente() {
        List<DemandeAccesCv> demandes = demandeRepository.findByStatus(DemandeAccesCvStatus.EN_ATTENTE);
        return demandes.stream().map(mapper::toAdminResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DemandeAccesCvAdminResponse> historiqueDemandes() {
        List<DemandeAccesCv> demandes = demandeRepository.findByStatusNot(DemandeAccesCvStatus.EN_ATTENTE);
        return demandes.stream().map(mapper::toAdminResponse).toList();
    }

    @Override
    @Transactional
    public DemandeAccesCvAdminResponse approveDemande(Long demandeId, String emailAdmin, String decisionNote) {
        // 1. Vérifier admin
        user_entity admin = userRepository.findByEmail(emailAdmin)
                .orElseThrow(() -> new ResourceNotFoundException("Admin non trouvé"));

        // 2. Récupérer demande
        DemandeAccesCv demande = demandeRepository.findById(demandeId)
                .orElseThrow(() -> new ResourceNotFoundException("Demande non trouvée"));

        // 3. Vérifier EN_ATTENTE
        if (demande.getStatus() != DemandeAccesCvStatus.EN_ATTENTE) {
            throw new InvalidFileException("Cette demande a déjà été traitée");
        }

        // 4. Approuver
        demande.setStatus(DemandeAccesCvStatus.APPROUVEE);
        demande.setAdmin(admin);
        demande.setDecidedAt(LocalDateTime.now());
        demande.setDecisionNote(decisionNote);

        DemandeAccesCv updated = demandeRepository.save(demande);
        return mapper.toAdminResponse(updated);
    }

    @Override
    @Transactional
    public DemandeAccesCvAdminResponse rejectDemande(Long demandeId, String emailAdmin, String decisionNote) {
        // 1. Vérifier admin
        user_entity admin = userRepository.findByEmail(emailAdmin)
                .orElseThrow(() -> new ResourceNotFoundException("Admin non trouvé"));

        // 2. Récupérer demande
        DemandeAccesCv demande = demandeRepository.findById(demandeId)
                .orElseThrow(() -> new ResourceNotFoundException("Demande non trouvée"));

        // 3. Vérifier EN_ATTENTE
        if (demande.getStatus() != DemandeAccesCvStatus.EN_ATTENTE) {
            throw new InvalidFileException("Cette demande a déjà été traitée");
        }

        // 4. Rejeter
        demande.setStatus(DemandeAccesCvStatus.REFUSEE);
        demande.setAdmin(admin);
        demande.setDecidedAt(LocalDateTime.now());
        demande.setDecisionNote(decisionNote);

        DemandeAccesCv updated = demandeRepository.save(demande);
        return mapper.toAdminResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public CvDownloadResponse downloadCv(Long demandeId) {
        // 1. Récupérer la demande
        DemandeAccesCv demande = demandeRepository.findById(demandeId)
                .orElseThrow(() -> new ResourceNotFoundException("Demande non trouvée"));

        // 2. Récupérer le fichier CV
        String storageKey = demande.getCandidature().getCvFile().getStorageKey();
        String originalFileName = demande.getCandidature().getCvFile().getOriginalFileName();
        
        if (storageKey == null || storageKey.isEmpty()) {
            throw new InvalidFileException("Le fichier CV n'est pas disponible");
        }

        // 3. Télécharger via le service de stockage
        byte[] cvContent = cvFileStorageService.getFile(storageKey);
        
        // 4. Retourner le contenu + nom original
        return new CvDownloadResponse(cvContent, originalFileName);
    }

    @Override
    @Transactional(readOnly = true)
    public CvDownloadResponse downloadCvForHr(Long demandeId, String emailHr) {
        // 1. Récupérer la demande
        DemandeAccesCv demande = demandeRepository.findById(demandeId)
                .orElseThrow(() -> new ResourceNotFoundException("Demande non trouvée"));

        // 2. Vérifier que le statut est APPROUVEE (admin a validé)
        if (demande.getStatus() != DemandeAccesCvStatus.APPROUVEE) {
            throw new AccessDeniedException("Seules les demandes approuvées permettent d'accéder au CV original");
        }

        // 3. Vérifier que ce HR est propriétaire de la demande
        if (!demande.getHr().getEmail().equals(emailHr)) {
            throw new AccessDeniedException("Vous n'avez pas accès à cette demande");
        }

        // 4. ✅ DEMANDE APPROUVÉE → on sert le CV ORIGINAL (nom réel, contacts visibles)
        String storageKey = demande.getCandidature().getCvFile().getStorageKey();
        String originalFileName = demande.getCandidature().getCvFile().getOriginalFileName();

        if (storageKey == null || storageKey.isEmpty()) {
            throw new InvalidFileException("Le fichier CV original n'est pas disponible");
        }

        byte[] cvContent = cvFileStorageService.getFile(storageKey);
        return new CvDownloadResponse(cvContent, originalFileName);
    }

    @Override
    @Transactional(readOnly = true)
    public CvDownloadResponse downloadAnonymizedCv(Long candidatureId, String emailHr) {
        // Cette méthode est accessible à TOUT HR, même sans demande approuvée.
        // Elle sert TOUJOURS le CV anonymisé (données personnelles caviardées).

        // 1. Vérifier que le HR existe
        userRepository.findByEmail(emailHr)
                .orElseThrow(() -> new ResourceNotFoundException("HR non trouvé"));

        // 2. Récupérer la candidature
        Candidature candidature = candidatureRepository.findById(candidatureId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidature non trouvée"));

        // 3. Récupérer la clé du PDF anonymisé
        String anonymizedKey = candidature.getCvFile().getAnonymizedStorageKey();

        if (anonymizedKey == null || anonymizedKey.isEmpty()) {
            throw new InvalidFileException("Le CV anonymisé n'est pas encore disponible");
        }

        // 4. ✅ Servir le CV ANONYMISÉ (nom générique, sans données personnelles)
        byte[] cvContent = cvFileStorageService.getFile(anonymizedKey);
        return new CvDownloadResponse(cvContent, "cv_anonymise.pdf");
    }
}

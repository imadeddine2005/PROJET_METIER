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

        // 3. Vérifier HR propriétaire de l'offre
        if (!authorizationUtils.isOffreOwnerOrAdmin(candidature.getOffre(), hr)) {
            throw new AccessDeniedException("Vous ne pouvez pas demander l'accès à ce CV");
        }

        // 4. Prévenir doublons
        if (demandeRepository.findByCandidatureIdAndHrId(candidatureId, hr.getId()).isPresent()) {
            throw new InvalidFileException("Vous avez déjà demandé l'accès à cette candidature");
        }

        // 5. Créer la demande
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

        // 2. Vérifier que le statut est APPROUVEE
        if (demande.getStatus() != DemandeAccesCvStatus.APPROUVEE) {
            throw new AccessDeniedException("Seules les demandes approuvées peuvent accéder au CV");
        }

        // 3. Vérifier que le HR est propriétaire de la demande
        if (!demande.getHr().getEmail().equals(emailHr)) {
            throw new AccessDeniedException("Vous n'avez pas accès à cette demande");
        }

        // 4. Récupérer le fichier CV
        String storageKey = demande.getCandidature().getCvFile().getStorageKey();
        String originalFileName = demande.getCandidature().getCvFile().getOriginalFileName();
        
        if (storageKey == null || storageKey.isEmpty()) {
            throw new InvalidFileException("Le fichier CV n'est pas disponible");
        }

        // 5. Télécharger via le service de stockage
        byte[] cvContent = cvFileStorageService.getFile(storageKey);
        
        // 6. Retourner le contenu + nom original
        return new CvDownloadResponse(cvContent, originalFileName);
    }
}

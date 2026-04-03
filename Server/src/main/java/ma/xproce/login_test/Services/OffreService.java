package ma.xproce.login_test.Services;

import ma.xproce.login_test.Exeptions.ResourceNotFoundException;
import ma.xproce.login_test.Mappers.OffreMapper;
import ma.xproce.login_test.dao.entities.Offre;
import ma.xproce.login_test.dao.entities.user_entity;
import ma.xproce.login_test.dao.reposetories.OffreRepository;
import ma.xproce.login_test.dao.reposetories.UserReposetory;
import ma.xproce.login_test.dto.OffreDtos.OffreRequest;
import ma.xproce.login_test.dto.OffreDtos.OffreResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class OffreService implements Ioffre_Service {

    private final OffreRepository offreRepository;
    private final UserReposetory userRepository;
    private final OffreMapper offreMapper;
    private final AuthorizationUtils authorizationUtils;

    public OffreService(OffreRepository offreRepository, UserReposetory userRepository, OffreMapper offreMapper, AuthorizationUtils authorizationUtils) {
        this.offreRepository = offreRepository;
        this.userRepository = userRepository;
        this.offreMapper = offreMapper;
        this.authorizationUtils = authorizationUtils;
    }

    // ── CREATE ────────────────────────────────────────────────
    @Override
    public OffreResponse createOffre(OffreRequest request, String emailHR) {

        user_entity hr = userRepository.findByEmail(emailHR)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouve"));

        // 2. OffreRequest + hr → Entité Offre
        Offre offre = offreMapper.toEntity(request, hr);

        // 3. Sauvegarder en base
        Offre saved = offreRepository.save(offre);

        // 4. Entité → OffreResponse
        return offreMapper.toResponse(saved);
    }

    @Override
    public OffreResponse updateOffre(Long id, OffreRequest request, String emailConnecte) {
        user_entity connecte = userRepository.findByEmail(emailConnecte)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouve"));

        Offre offre = offreRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Offre non trouvee"));

        if (!authorizationUtils.isOffreOwnerOrAdmin(offre, connecte)) {
            throw new AccessDeniedException("Vous ne pouvez pas modifier cette offre");
        }

        offreMapper.applyUpdate(offre, request);
        Offre saved = offreRepository.save(offre);
        return offreMapper.toResponse(saved);
    }

    @Override
    public OffreResponse deleteOffre(Long id, String emailConnecte) {
        user_entity connecte = userRepository.findByEmail(emailConnecte)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouve"));

        Offre offre = offreRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Offre non trouvee"));

        if (!authorizationUtils.isOffreOwnerOrAdmin(offre, connecte)) {
            throw new AccessDeniedException("Vous ne pouvez pas supprimer cette offre");
        }

        // On prépare la réponse avant suppression
        OffreResponse response = offreMapper.toResponse(offre);
        offreRepository.delete(offre);
        return response;
    }

    @Override
    public List<OffreResponse> mesOffres(String emailConnecte) {
        user_entity connecte = userRepository.findByEmail(emailConnecte)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouve"));

        List<Offre> offres = offreRepository.findByHrId(connecte.getId());
        return offreMapper.toResponseList(offres);
    }

    @Override
    public OffreResponse getOffreById(Long id, String emailConnecte) {
        user_entity connecte = userRepository.findByEmail(emailConnecte)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouve"));

        Offre offre = offreRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Offre non trouvee"));

        if (!authorizationUtils.isOffreOwnerOrAdmin(offre, connecte)) {
            throw new AccessDeniedException("Vous ne pouvez pas consulter cette offre");
        }

        return offreMapper.toResponse(offre);
    }

    // ── PUBLIC (CANDIDAT) ────────────────────────────────────
    @Override
    public List<OffreResponse> getAllOffres() {
        List<Offre> offres = offreRepository.findAll();
        return offreMapper.toResponseList(offres);
    }

    @Override
    public OffreResponse getOffreByIdPublic(Long id) {
        Offre offre = offreRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Offre non trouvee"));
        return offreMapper.toResponse(offre);
    }
}


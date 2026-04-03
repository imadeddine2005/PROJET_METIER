package ma.xproce.login_test.Mappers;

import ma.xproce.login_test.dao.entities.Offre;
import ma.xproce.login_test.dao.entities.user_entity;
import ma.xproce.login_test.dto.OffreDtos.OffreRequest;
import ma.xproce.login_test.dto.OffreDtos.OffreResponse;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class OffreMapper {

    private final ModelMapper modelMapper;

    public OffreMapper(ModelMapper modelMapper) {
        this.modelMapper = modelMapper;
    }

    public Offre toEntity(OffreRequest request, user_entity hr) {
        Offre offre = modelMapper.map(request, Offre.class);
        offre.setHr(hr);
        offre.setDateCreation(LocalDateTime.now());
        return offre;
    }

    /** Met à jour titre / description / compétences sans toucher id, hr, dateCreation. */
    public void applyUpdate(Offre offre, OffreRequest request) {
        modelMapper.map(request, offre);
    }

    /** Manuel : évite que ModelMapper parcourt hr → user_entity.offres (erreur / boucle). */
    public OffreResponse toResponse(Offre offre) {
        OffreResponse response = new OffreResponse();
        response.setId(offre.getId());
        response.setTitre(offre.getTitre());
        response.setDescription(offre.getDescription());
        response.setCompetencesRequises(offre.getCompetencesRequises());
        response.setDateCreation(offre.getDateCreation());
        response.setNomHR(offre.getHr() != null ? offre.getHr().getName() : null);
        return response;
    }

    public List<OffreResponse> toResponseList(List<Offre> offres) {
        return offres.stream().map(this::toResponse).toList();
    }
}

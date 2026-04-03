package ma.xproce.login_test.dao.reposetories;

import ma.xproce.login_test.dao.entities.Candidature;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CandidatureRepository extends JpaRepository<Candidature, Long> {
    List<Candidature> findByCandidatId(Long candidatId);
    List<Candidature> findByOffreId(Long offreId);
    Optional<Candidature> findByOffreIdAndCandidatId(Long offreId, Long candidatId);
}


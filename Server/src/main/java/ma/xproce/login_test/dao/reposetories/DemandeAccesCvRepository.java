package ma.xproce.login_test.dao.reposetories;

import ma.xproce.login_test.dao.entities.DemandeAccesCv;
import ma.xproce.login_test.dao.entities.DemandeAccesCvStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DemandeAccesCvRepository extends JpaRepository<DemandeAccesCv, Long> {
    List<DemandeAccesCv> findByHrId(Long hrId);
    List<DemandeAccesCv> findByStatus(DemandeAccesCvStatus status);
    Optional<DemandeAccesCv> findByCandidatureIdAndHrId(Long candidatureId, Long hrId);
}


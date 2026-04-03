package ma.xproce.login_test.dao.reposetories;

import ma.xproce.login_test.dao.entities.Offre;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OffreRepository extends JpaRepository<Offre, Long> {

    // Toutes les offres d'un HR spécifique
    List<Offre> findByHrId(Long hrId);

    // Vérifier si une offre existe par titre et HR
    Optional<Offre> findByTitreAndHrId(String titre, Long hrId);
}

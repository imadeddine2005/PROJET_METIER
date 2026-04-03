package ma.xproce.login_test.dao.reposetories;

import ma.xproce.login_test.dao.entities.CvFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CvFileRepository extends JpaRepository<CvFile, Long> {
}


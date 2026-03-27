package ma.xproce.login_test.dao.reposetories;

import ma.xproce.login_test.dao.entities.user_entity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserReposetory extends JpaRepository<user_entity, Integer> {
    Optional<user_entity> findByEmail(String email);
    Boolean existsByEmail(String email);
}

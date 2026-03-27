package ma.xproce.login_test.dao.reposetories;

import ma.xproce.login_test.dao.entities.roles;
import ma.xproce.login_test.dao.entities.user_entity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoleReposetory extends JpaRepository<roles, Long> {
    Optional<roles> findByName(String name);
}

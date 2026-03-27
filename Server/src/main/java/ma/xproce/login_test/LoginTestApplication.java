package ma.xproce.login_test;

import ma.xproce.login_test.dao.entities.roles;
import ma.xproce.login_test.dao.reposetories.RoleReposetory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import javax.management.relation.Role;

@SpringBootApplication
public class LoginTestApplication implements CommandLineRunner {
    @Autowired
    private RoleReposetory roleReposetory;

    public static void main(String[] args) {
        SpringApplication.run(LoginTestApplication.class, args);
    }

    @Override
    public void run(String... args) throws Exception {
        roles role = new roles();
        role.setName("ROLE_USER");
        roleReposetory.save(role);
        roles role1 = new roles();
        role1.setName("ROLE_ADMIN");
        roleReposetory.save(role1);
    }
}

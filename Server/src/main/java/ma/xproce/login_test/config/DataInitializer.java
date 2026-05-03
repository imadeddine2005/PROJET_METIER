package ma.xproce.login_test.config;

import ma.xproce.login_test.dao.entities.roles;
import ma.xproce.login_test.dao.reposetories.RoleReposetory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * DataInitializer — Initialisation des données au démarrage
 * Si les rôles n'existent pas en base → EXCEPTION au register.
 * Cette classe les crée automatiquement au premier démarrage.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private final RoleReposetory roleRepository;

    public DataInitializer(RoleReposetory roleRepository) {
        this.roleRepository = roleRepository;
    }
    @Override
    public void run(String... args) {
        createRoleIfNotExists("ROLE_CANDIDAT");
        createRoleIfNotExists("ROLE_HR");
        createRoleIfNotExists("ROLE_ADMIN");


        System.out.println(" Rôles SmartRecruit initialisés.");
    }

    /**
     * Insère un rôle en base UNIQUEMENT s'il n'existe pas déjà.
     */
    private void createRoleIfNotExists(String roleName) {
        if (roleRepository.findByName(roleName).isEmpty()) {
            roles role = new roles();
            role.setName(roleName);
            roleRepository.save(role);
            System.out.println("Rôle créé en base : " + roleName);
        }
    }
}
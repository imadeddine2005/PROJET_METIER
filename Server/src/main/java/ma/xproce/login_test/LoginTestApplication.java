package ma.xproce.login_test;

import ma.xproce.login_test.dao.entities.Offre;
import ma.xproce.login_test.dao.entities.roles;
import ma.xproce.login_test.dao.entities.user_entity;
import ma.xproce.login_test.dao.reposetories.OffreRepository;
import ma.xproce.login_test.dao.reposetories.RoleReposetory;
import ma.xproce.login_test.dao.reposetories.UserReposetory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Collections;

@SpringBootApplication
public class LoginTestApplication implements CommandLineRunner {
    @Autowired
    private RoleReposetory roleReposetory;

    @Autowired
    private UserReposetory userReposetory;

    @Autowired
    private OffreRepository offreRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public static void main(String[] args) {
        SpringApplication.run(LoginTestApplication.class, args);
    }

    @Override
    public void run(String... args) throws Exception {
        // Créer les rôles
        createRoleIfNotExists("ROLE_ADMIN");
        createRoleIfNotExists("ROLE_HR");
        createRoleIfNotExists("ROLE_CANDIDAT");

        // Créer les utilisateurs
        createUserIfNotExists("admin@gmail.com", "Admin User", "admin123", "ROLE_ADMIN");
        createUserIfNotExists("hr@gmail.com", "HR Manager", "hrhr1234", "ROLE_HR");
        createUserIfNotExists("hr2@gmail.com", "HR2 Manager", "hrhr1234", "ROLE_HR");
        createUserIfNotExists("candidat@gmail.com", "Candidat User", "candidat123", "ROLE_CANDIDAT");
        createUserIfNotExists("candidat2@gmail.com", "Candidat User", "candidat123", "ROLE_CANDIDAT");
        createUserIfNotExists("okratiimad9@gmail.com", "imad eddine", "imadimad", "ROLE_CANDIDAT");
        // Créer les offres (exemple)
        user_entity hr1 = userReposetory.findByEmail("hr@gmail.com").orElse(null);
        user_entity hr2 = userReposetory.findByEmail("hr2@gmail.com").orElse(null);
        
        if (hr1 != null) {
            createOffreIfNotExists("Développeur Java", "Nous recherchons un développeur Java expérimenté ", "Java, Spring Boot, SQL", hr1);
            createOffreIfNotExists("Développeur React", "Besoin d'un expert React pour rejoindre notre équipe", "React, JavaScript, CSS", hr1);
        }
        
        if (hr2 != null) {
            createOffreIfNotExists("Business Analyst", "Analyste métier pour nos projets clients", "Analyse, SQL, Communication", hr2);
        }
    }

    private void createRoleIfNotExists(String roleName) {
        if (roleReposetory.findByName(roleName).isEmpty()) {
            roles role = new roles();
            role.setName(roleName);
            roleReposetory.save(role);
        }
    }

    private void createUserIfNotExists(String email, String name, String password, String roleName) {
        if (userReposetory.findByEmail(email).isEmpty()) {
            // Re-chercher le rôle pour le rattacher à la session Hibernate
            roles role = roleReposetory.findByName(roleName)
                    .orElseThrow(() -> new RuntimeException("Role " + roleName + " not found"));

            user_entity user = new user_entity();
            user.setEmail(email);
            user.setName(name);
            user.setPassword(passwordEncoder.encode(password));
            user.setRoles(Collections.singletonList(role));

            userReposetory.save(user);
            System.out.println("✓ User created: " + email + " with role " + roleName);
        }
    }

    private void createOffreIfNotExists(String titre, String description, String competences, user_entity hr) {
        if (offreRepository.findByTitreAndHrId(titre, hr.getId()).isEmpty()) {
            Offre offre = new Offre();
            offre.setTitre(titre);
            offre.setDescription(description);
            offre.setCompetencesRequises(competences);
            offre.setHr(hr);
            offre.setDateCreation(LocalDateTime.now());

            offreRepository.save(offre);
            System.out.println("✓ Job offer created: " + titre + " by " + hr.getEmail());
        }
    }
}

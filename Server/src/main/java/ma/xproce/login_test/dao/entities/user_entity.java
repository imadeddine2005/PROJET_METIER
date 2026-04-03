package ma.xproce.login_test.dao.entities;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class user_entity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    @Column(unique = true)
    private String email;
    private String password;
    @ManyToMany(fetch = FetchType.EAGER, cascade = CascadeType.MERGE)
    @JoinTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id", referencedColumnName = "id"),
            inverseJoinColumns = @JoinColumn(name = "role_id", referencedColumnName = "id"))
    private List<roles> roles;
    @OneToMany(mappedBy = "hr" , fetch =FetchType.LAZY)
    private List<Offre> offres;

    @OneToMany(mappedBy = "candidat", fetch = FetchType.LAZY)
    private List<Candidature> candidatures;

    @OneToMany(mappedBy = "hr", fetch = FetchType.LAZY)
    private List<DemandeAccesCv> demandesAccesCv;

    @OneToMany(mappedBy = "admin", fetch = FetchType.LAZY)
    private List<DemandeAccesCv> demandesAccesCvTraitees;
}

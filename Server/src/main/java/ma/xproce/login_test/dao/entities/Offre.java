package ma.xproce.login_test.dao.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "offres")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Offre {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String competencesRequises;

    private LocalDateTime dateCreation;

    @ManyToOne
    @JoinColumn(name = "hr_id", nullable = false)
    private user_entity hr;

    @OneToMany(mappedBy = "offre", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Candidature> candidatures;
}

package ma.xproce.login_test.dao.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "cv_files")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class CvFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Chemin local ou clé S3 (ex: "cvs/uuid.pdf").
     */
    @Column(nullable = false)
    private String storageKey;

    private String originalFileName;
    private String contentType;
    private Long sizeBytes;

    /**
     * Version anonymisée (si dispo).
     */
    private String anonymizedStorageKey;

    private LocalDateTime uploadedAt;
}


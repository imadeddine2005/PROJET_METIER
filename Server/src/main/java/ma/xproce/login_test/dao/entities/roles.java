package ma.xproce.login_test.dao.entities;

import jakarta.persistence.*;
import lombok.Data;
import org.springframework.security.core.GrantedAuthority;

@Entity
@Table(name ="roles")
@Data
public class roles  {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    String name;

}

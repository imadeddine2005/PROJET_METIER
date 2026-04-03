package ma.xproce.login_test.web;

import ma.xproce.login_test.Exeptions.ResourceNotFoundException;
import ma.xproce.login_test.Exeptions.UsernameAlreadyExistsException;
import ma.xproce.login_test.config.JwtGenerator;
import ma.xproce.login_test.dao.entities.roles;
import ma.xproce.login_test.dao.entities.user_entity;
import ma.xproce.login_test.dao.reposetories.RoleReposetory;
import ma.xproce.login_test.dao.reposetories.UserReposetory;
import ma.xproce.login_test.dto.ApiResponse;
import ma.xproce.login_test.dto.AthDtos.AuthResponseDto;
import ma.xproce.login_test.dto.AthDtos.LoginDto;
import ma.xproce.login_test.dto.AthDtos.RegisterDto;
import ma.xproce.login_test.dto.AthDtos.RegisterResponseDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final PasswordEncoder passwordEncoder;
    private final UserReposetory userReposetory;
    private final AuthenticationManager authenticationManager;
    private final RoleReposetory roleReposetory;
    private final JwtGenerator jwtGenerator;

    public AuthController(PasswordEncoder passwordEncoder, UserReposetory userReposetory,
                          AuthenticationManager authenticationManager, RoleReposetory roleReposetory,
                          JwtGenerator jwtGenerator) {
        this.passwordEncoder = passwordEncoder;
        this.userReposetory = userReposetory;
        this.authenticationManager = authenticationManager;
        this.roleReposetory = roleReposetory;
        this.jwtGenerator = jwtGenerator;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponseDto>> login(@Valid @RequestBody LoginDto logindto) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(logindto.getEmail(), logindto.getPassword()));
        SecurityContextHolder.getContext().setAuthentication(authentication);
        
        // Récupérer l'utilisateur depuis la BD (on a l'email de l'authentification)
        user_entity user = userReposetory.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        // Récupérer les rôles directement de l'authentification
        java.util.List<String> roleNames = authentication.getAuthorities().stream()
                .map(auth -> auth.getAuthority())
                .toList();
        
        // Générer le token simple (juste email)
        String token = jwtGenerator.generateToken(authentication);
        
        // Créer la réponse avec toutes les infos utilisateur
        AuthResponseDto response = new AuthResponseDto(token);
        response.setUserId(user.getId());
        response.setEmail(user.getEmail());
        response.setName(user.getName());
        response.setRoles(roleNames);
        
        return ResponseEntity.ok(ApiResponse.success("Login success", response));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<RegisterResponseDto>> register(@Valid @RequestBody RegisterDto register) {
        if (userReposetory.existsByEmail(register.getEmail())) {
            throw new UsernameAlreadyExistsException("Email already exists");
        }
        roles role = roleReposetory.findByName("ROLE_CANDIDAT")
                .orElseThrow(() -> new ResourceNotFoundException("Role ROLE_CANDIDAT not found. Run application to seed roles."));

        user_entity user = new user_entity();
        user.setName(register.getName());
        user.setEmail(register.getEmail());
        user.setPassword(passwordEncoder.encode(register.getPassword()));
        user.setRoles(Collections.singletonList(role));

        userReposetory.save(user);
        return new ResponseEntity<>(ApiResponse.success("Registration success", RegisterResponseDto.of(register.getEmail())), HttpStatus.CREATED);
    }
}

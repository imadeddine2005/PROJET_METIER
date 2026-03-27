package ma.xproce.login_test.web;

import ma.xproce.login_test.Exeptions.ResourceNotFoundException;
import ma.xproce.login_test.Exeptions.UsernameAlreadyExistsException;
import ma.xproce.login_test.config.JwtGenerator;
import ma.xproce.login_test.dao.entities.roles;
import ma.xproce.login_test.dao.entities.user_entity;
import ma.xproce.login_test.dao.reposetories.RoleReposetory;
import ma.xproce.login_test.dao.reposetories.UserReposetory;
import ma.xproce.login_test.dto.ApiResponse;
import ma.xproce.login_test.dto.AuthResponseDto;
import ma.xproce.login_test.dto.LoginDto;
import ma.xproce.login_test.dto.RegisterDto;
import ma.xproce.login_test.dto.RegisterResponseDto;
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
        String token = jwtGenerator.generateToken(authentication);
        return ResponseEntity.ok(ApiResponse.success("Login success", new AuthResponseDto(token)));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<RegisterResponseDto>> register(@Valid @RequestBody RegisterDto register) {
        if (userReposetory.existsByEmail(register.getEmail())) {
            throw new UsernameAlreadyExistsException("Email already exists");
        }
        roles role = roleReposetory.findByName("ROLE_USER")
                .orElseThrow(() -> new ResourceNotFoundException("Role ROLE_USER not found. Run application to seed roles."));

        user_entity user = new user_entity();
        user.setName(register.getName());
        user.setEmail(register.getEmail());
        user.setPassword(passwordEncoder.encode(register.getPassword()));
        user.setRoles(Collections.singletonList(role));

        userReposetory.save(user);
        return new ResponseEntity<>(ApiResponse.success("Registration success", RegisterResponseDto.of(register.getEmail())), HttpStatus.CREATED);
    }
}

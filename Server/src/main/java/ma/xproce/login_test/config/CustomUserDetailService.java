package ma.xproce.login_test.config;

import ma.xproce.login_test.dao.entities.roles;
import ma.xproce.login_test.dao.entities.user_entity;
import ma.xproce.login_test.dao.reposetories.UserReposetory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CustomUserDetailService implements UserDetailsService {
    private UserReposetory userReposetory;

    @Autowired
    public CustomUserDetailService(UserReposetory userReposetory) {
        this.userReposetory = userReposetory;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        user_entity user = userReposetory.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
        return new User(user.getEmail(), user.getPassword(), mapRolesToAuthorities(user.getRoles()));
    }

    private Collection<GrantedAuthority> mapRolesToAuthorities(List<roles> roles) {
        return roles.stream().map(role->new SimpleGrantedAuthority(role.getName()))
                .collect(Collectors.toList());
    }
}

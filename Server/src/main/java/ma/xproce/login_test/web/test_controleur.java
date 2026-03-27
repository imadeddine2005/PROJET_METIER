package ma.xproce.login_test.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class test_controleur {

    @GetMapping("/hello")
    public String hello(){

        return "hello";
    }

    @GetMapping("/admin")
    public String admin(){
        return "admin";
    }

    @GetMapping("/user")
    public String user(){
        return "user";
    }

}

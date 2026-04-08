package pe.heliconias.controlinterno;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class ControlInternoApplication {

    public static void main(String[] args) {
        SpringApplication.run(ControlInternoApplication.class, args);
    }
}

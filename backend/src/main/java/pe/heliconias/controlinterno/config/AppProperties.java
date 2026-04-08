package pe.heliconias.controlinterno.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(Security security, Uploads uploads, Cors cors) {

    public record Security(String jwtSecret, long jwtExpirationMinutes) {
    }

    public record Uploads(String directory) {
    }

    public record Cors(String allowedOrigins) {
    }
}

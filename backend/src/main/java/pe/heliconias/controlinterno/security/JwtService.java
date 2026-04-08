package pe.heliconias.controlinterno.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;
import pe.heliconias.controlinterno.config.AppProperties;

@Service
public class JwtService {

    private final AppProperties appProperties;

    public JwtService(AppProperties appProperties) {
        this.appProperties = appProperties;
    }

    public String generateToken(AuthenticatedUser user) {
        Instant now = Instant.now();
        Instant expiration = now.plus(appProperties.security().jwtExpirationMinutes(), ChronoUnit.MINUTES);

        return Jwts.builder()
                .subject(user.username())
                .claim("userId", user.id())
                .claim("role", user.role())
                .claim("fullName", user.fullName())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiration))
                .signWith(getSigningKey())
                .compact();
    }

    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(appProperties.security().jwtSecret());
        } catch (IllegalArgumentException exception) {
            keyBytes = appProperties.security().jwtSecret().getBytes(StandardCharsets.UTF_8);
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }
}

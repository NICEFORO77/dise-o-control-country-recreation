package pe.heliconias.controlinterno.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import pe.heliconias.controlinterno.config.AppProperties;

@Service
public class BootstrapService {

    private final AppProperties appProperties;

    public BootstrapService(AppProperties appProperties) {
        this.appProperties = appProperties;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void initialize() throws IOException {
        Files.createDirectories(Path.of(appProperties.uploads().directory()));
    }
}

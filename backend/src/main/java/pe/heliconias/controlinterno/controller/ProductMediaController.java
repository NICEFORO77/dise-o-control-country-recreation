package pe.heliconias.controlinterno.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import pe.heliconias.controlinterno.config.AppProperties;
import pe.heliconias.controlinterno.security.AuthenticatedUser;
import pe.heliconias.controlinterno.service.CrudService;
import static org.springframework.http.HttpStatus.BAD_REQUEST;

@RestController
@RequestMapping("/api/productos")
public class ProductMediaController {

    private final AppProperties appProperties;
    private final CrudService crudService;

    public ProductMediaController(AppProperties appProperties, CrudService crudService) {
        this.appProperties = appProperties;
        this.crudService = crudService;
    }

    @PostMapping(path = "/{id}/foto", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> uploadPhoto(
            @PathVariable Integer id,
            @RequestPart("file") MultipartFile file,
            @AuthenticationPrincipal AuthenticatedUser user
    ) throws IOException {
        if (file.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "Debe seleccionar una imagen");
        }

        String originalName = StringUtils.cleanPath(file.getOriginalFilename() == null ? "producto.jpg" : file.getOriginalFilename());
        String extension = originalName.contains(".") ? originalName.substring(originalName.lastIndexOf('.')) : ".jpg";
        String fileName = "producto-" + id + "-" + UUID.randomUUID() + extension;
        Path target = Path.of(appProperties.uploads().directory()).resolve(fileName);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        return crudService.patchProductPhoto(id, "/uploads/" + fileName, user);
    }
}

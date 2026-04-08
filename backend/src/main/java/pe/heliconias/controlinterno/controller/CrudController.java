package pe.heliconias.controlinterno.controller;

import java.util.List;
import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.heliconias.controlinterno.security.AuthenticatedUser;
import pe.heliconias.controlinterno.service.CrudService;

@RestController
@RequestMapping("/api/crud")
public class CrudController {

    private final CrudService crudService;

    public CrudController(CrudService crudService) {
        this.crudService = crudService;
    }

    @GetMapping("/{resource}")
    public List<Map<String, Object>> list(
            @PathVariable String resource,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        return crudService.list(resource, user);
    }

    @GetMapping("/{resource}/{id}")
    public Map<String, Object> get(
            @PathVariable String resource,
            @PathVariable Integer id,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        return crudService.get(resource, id, user);
    }

    @PostMapping("/{resource}")
    public Map<String, Object> create(
            @PathVariable String resource,
            @RequestBody Map<String, Object> payload,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        return crudService.create(resource, payload, user);
    }

    @PutMapping("/{resource}/{id}")
    public Map<String, Object> update(
            @PathVariable String resource,
            @PathVariable Integer id,
            @RequestBody Map<String, Object> payload,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        return crudService.update(resource, id, payload, user);
    }

    @DeleteMapping("/{resource}/{id}")
    public void delete(
            @PathVariable String resource,
            @PathVariable Integer id,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        crudService.delete(resource, id, user);
    }
}

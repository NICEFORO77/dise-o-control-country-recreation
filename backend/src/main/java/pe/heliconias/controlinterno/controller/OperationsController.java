package pe.heliconias.controlinterno.controller;

import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.heliconias.controlinterno.dto.PaymentSimulationRequest;
import pe.heliconias.controlinterno.service.OperationsService;

@RestController
@RequestMapping("/api/operaciones")
public class OperationsController {

    private final OperationsService operationsService;

    public OperationsController(OperationsService operationsService) {
        this.operationsService = operationsService;
    }

    @GetMapping("/codigos")
    public Map<String, String> nextCodes() {
        return operationsService.nextCodes();
    }

    @PostMapping("/simular-pago")
    public Map<String, Object> simulatePayment(@Valid @RequestBody PaymentSimulationRequest request) {
        return operationsService.simulatePayment(request);
    }
}

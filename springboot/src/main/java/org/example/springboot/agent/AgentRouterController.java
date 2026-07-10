package org.example.springboot.agent;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.springboot.agent.dto.AgentRouteCommandDTO;
import org.example.springboot.agent.dto.AgentRouteResponseDTO;
import org.example.springboot.common.Result;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/agent", "/api/agent"})
@RequiredArgsConstructor
public class AgentRouterController {

    private final AgentRouterService routerService;

    @PostMapping("/route")
    public Result<AgentRouteResponseDTO> route(@Valid @RequestBody AgentRouteCommandDTO command) {
        return Result.success(routerService.route(command));
    }
}

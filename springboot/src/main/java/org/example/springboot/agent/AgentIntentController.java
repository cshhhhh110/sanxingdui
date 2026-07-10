package org.example.springboot.agent;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.springboot.agent.dto.AgentIntentCommandDTO;
import org.example.springboot.agent.dto.AgentIntentResponseDTO;
import org.example.springboot.common.Result;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/agent", "/api/agent"})
@RequiredArgsConstructor
public class AgentIntentController {

    private final AgentIntentService intentService;

    @PostMapping("/intent")
    public Result<AgentIntentResponseDTO> classify(@Valid @RequestBody AgentIntentCommandDTO command) {
        return Result.success(intentService.classify(command.getUserMessage()));
    }
}

package org.example.springboot.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.springboot.common.Result;
import org.example.springboot.dto.command.ConfirmVisualAidProposalDTO;
import org.example.springboot.dto.command.CreateVisualAidProposalDTO;
import org.example.springboot.dto.response.MediaGenerationTaskVO;
import org.example.springboot.dto.response.VisualAidProposalResponseDTO;
import org.example.springboot.exception.BusinessException;
import org.example.springboot.service.VisualAidProposalService;
import org.example.springboot.util.JwtTokenUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/visual-aid")
@RequiredArgsConstructor
public class VisualAidController {
    private final VisualAidProposalService service;

    @PostMapping("/proposals")
    public Result<VisualAidProposalResponseDTO> create(@Valid @RequestBody CreateVisualAidProposalDTO command) {
        return execute(() -> service.create(command, currentUserId()));
    }

    @GetMapping("/proposals/{proposalId}")
    public Result<VisualAidProposalResponseDTO> get(@PathVariable String proposalId) {
        return execute(() -> service.get(proposalId, currentUserId()));
    }

    @PostMapping("/proposals/{proposalId}/confirm")
    public Result<MediaGenerationTaskVO> confirm(
            @PathVariable String proposalId,
            @Valid @RequestBody ConfirmVisualAidProposalDTO command
    ) {
        return execute(() -> service.confirm(proposalId, command, currentUserId()));
    }

    @DeleteMapping("/proposals/{proposalId}")
    public Result<VisualAidProposalResponseDTO> dismiss(@PathVariable String proposalId) {
        return execute(() -> service.dismiss(proposalId, currentUserId()));
    }

    private Long currentUserId() {
        Long userId = JwtTokenUtils.getCurrentUserId();
        if (userId == null) throw new BusinessException("请先登录后使用视觉辅助");
        return userId;
    }

    private <T> Result<T> execute(Action<T> action) {
        try {
            return Result.success(action.run());
        } catch (BusinessException error) {
            return Result.error("400", error.getMessage());
        }
    }

    @FunctionalInterface
    private interface Action<T> {
        T run();
    }
}

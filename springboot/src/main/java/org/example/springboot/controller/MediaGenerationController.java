package org.example.springboot.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.springboot.common.Result;
import org.example.springboot.dto.command.CreateImageGenerationDTO;
import org.example.springboot.dto.command.CreateVideoGenerationDTO;
import org.example.springboot.dto.response.MediaGenerationHistoryVO;
import org.example.springboot.dto.response.MediaGenerationTaskVO;
import org.example.springboot.dto.response.MediaGenerationStatsVO;
import org.example.springboot.dto.response.MediaGenerationTemplateVO;
import org.example.springboot.exception.BusinessException;
import org.example.springboot.service.MediaGenerationService;
import org.example.springboot.service.GenerationTemplateService;
import org.example.springboot.util.JwtTokenUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/media-generation")
@RequiredArgsConstructor
public class MediaGenerationController {
    private final MediaGenerationService service;
    private final GenerationTemplateService templateService;

    @PostMapping("/image")
    public Result<MediaGenerationTaskVO> createImage(@Valid @RequestBody CreateImageGenerationDTO command) {
        return execute(() -> service.createImageTask(command, JwtTokenUtils.getCurrentUserId()));
    }

    @PostMapping("/video")
    public Result<MediaGenerationTaskVO> createVideo(@Valid @RequestBody CreateVideoGenerationDTO command) {
        return execute(() -> service.createVideoTask(command, JwtTokenUtils.getCurrentUserId()));
    }

    @GetMapping("/tasks/{taskId}")
    public Result<MediaGenerationTaskVO> getTask(@PathVariable String taskId) {
        return execute(() -> service.getTask(taskId, JwtTokenUtils.getCurrentUserId()));
    }

    @GetMapping("/history")
    public Result<MediaGenerationHistoryVO> history(
            @RequestParam(defaultValue = "1") long pageNum,
            @RequestParam(defaultValue = "12") long pageSize,
            @RequestParam(required = false) String mediaType,
            @RequestParam(required = false) String status) {
        return execute(() -> service.history(JwtTokenUtils.getCurrentUserId(), pageNum, pageSize, mediaType, status));
    }

    @PostMapping("/tasks/{taskId}/retry")
    public Result<MediaGenerationTaskVO> retry(@PathVariable String taskId) {
        return execute(() -> service.retry(taskId, JwtTokenUtils.getCurrentUserId()));
    }

    @PostMapping("/tasks/{taskId}/cancel")
    public Result<MediaGenerationTaskVO> cancel(@PathVariable String taskId) {
        return execute(() -> service.cancel(taskId, JwtTokenUtils.getCurrentUserId()));
    }

    @PutMapping("/tasks/{taskId}/favorite")
    public Result<MediaGenerationTaskVO> favorite(
            @PathVariable String taskId,
            @RequestParam(defaultValue = "true") boolean favorite) {
        return execute(() -> service.setFavorite(taskId, JwtTokenUtils.getCurrentUserId(), favorite));
    }

    @PostMapping("/tasks/{taskId}/share")
    public Result<MediaGenerationTaskVO> enableShare(@PathVariable String taskId) {
        return execute(() -> service.enableShare(taskId, JwtTokenUtils.getCurrentUserId()));
    }

    @DeleteMapping("/tasks/{taskId}/share")
    public Result<MediaGenerationTaskVO> disableShare(@PathVariable String taskId) {
        return execute(() -> service.disableShare(taskId, JwtTokenUtils.getCurrentUserId()));
    }

    @GetMapping("/shared/{shareToken}")
    public Result<MediaGenerationTaskVO> shared(@PathVariable String shareToken) {
        return execute(() -> service.getShared(shareToken));
    }

    @GetMapping("/templates")
    public Result<List<MediaGenerationTemplateVO>> templates() {
        return Result.success(templateService.list());
    }

    @GetMapping("/admin/stats")
    public Result<MediaGenerationStatsVO> stats() {
        if (!JwtTokenUtils.isAdmin()) return Result.error("403", "仅管理员可查看生成统计");
        return Result.success(service.stats());
    }

    private <T> Result<T> execute(Action<T> action) {
        try {
            return Result.success(action.run());
        } catch (BusinessException e) {
            return Result.error("400", e.getMessage());
        }
    }

    @FunctionalInterface
    private interface Action<T> { T run(); }
}

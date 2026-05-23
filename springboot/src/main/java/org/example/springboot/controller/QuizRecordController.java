package org.example.springboot.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.example.springboot.common.Result;
import org.example.springboot.dto.command.QuizRecordSubmitDTO;
import org.example.springboot.dto.response.QuizRecordResponseDTO;
import org.example.springboot.service.QuizRecordService;
import org.example.springboot.util.JwtTokenUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "答题管理", description = "答题记录提交、排行榜、个人历史")
@RequestMapping("/quiz")
@RestController
@Slf4j
public class QuizRecordController {

    @Resource
    private QuizRecordService quizRecordService;

    @Operation(summary = "提交答题成绩")
    @PostMapping("/submit")
    public Result<Void> submit(@Valid @RequestBody QuizRecordSubmitDTO dto) {
        Long userId = JwtTokenUtils.getCurrentUserId();
        log.info("提交答题成绩: userId={}, score={}, mode={}", userId, dto.getScore(), dto.getMode());
        quizRecordService.submitRecord(userId, dto);
        return Result.success();
    }

    @Operation(summary = "获取排行榜")
    @GetMapping("/ranking")
    public Result<List<QuizRecordResponseDTO>> getRanking(
            @RequestParam(defaultValue = "challenge") String mode,
            @RequestParam(defaultValue = "50") int limit) {
        log.info("获取答题排行榜: mode={}, limit={}", mode, limit);
        List<QuizRecordResponseDTO> ranking = quizRecordService.getRanking(mode, limit);
        return Result.success(ranking);
    }

    @Operation(summary = "获取个人答题历史")
    @GetMapping("/history")
    public Result<List<QuizRecordResponseDTO>> getHistory() {
        Long userId = JwtTokenUtils.getCurrentUserId();
        log.info("获取答题历史: userId={}", userId);
        List<QuizRecordResponseDTO> history = quizRecordService.getUserHistory(userId);
        return Result.success(history);
    }
}

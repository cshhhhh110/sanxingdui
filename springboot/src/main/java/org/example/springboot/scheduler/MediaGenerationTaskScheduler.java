package org.example.springboot.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.springboot.service.MediaGenerationService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class MediaGenerationTaskScheduler {
    private final MediaGenerationService mediaGenerationService;

    @Scheduled(fixedDelayString = "${media-generation.video.poll-interval-ms:8000}")
    public void pollVideoTasks() {
        try {
            mediaGenerationService.pollVideoTasks();
        } catch (Exception e) {
            log.warn("轮询视频生成任务失败: {}", e.getMessage());
        }
    }
}

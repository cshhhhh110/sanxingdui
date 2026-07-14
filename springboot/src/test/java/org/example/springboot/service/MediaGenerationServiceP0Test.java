package org.example.springboot.service;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.springboot.config.ImageGenerationProfileProperties;
import org.example.springboot.dto.command.CreateImageGenerationDTO;
import org.example.springboot.dto.command.GenerationExperienceContextDTO;
import org.example.springboot.dto.response.MediaGenerationTaskVO;
import org.example.springboot.entity.AiMediaGenerationTask;
import org.example.springboot.mapper.AiMediaGenerationTaskMapper;
import org.example.springboot.mapper.SysFileInfoMapper;
import org.example.springboot.service.provider.ImageGenerationProvider;
import org.example.springboot.service.provider.VideoGenerationProvider;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Executor;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class MediaGenerationServiceP0Test {

    @Test
    void imageProcessingStartsOnlyAfterOuterTransactionCommits() {
        AiMediaGenerationTaskMapper taskMapper = mock(AiMediaGenerationTaskMapper.class);
        AtomicReference<Runnable> submittedTask = new AtomicReference<>();
        when(taskMapper.insert(any(AiMediaGenerationTask.class))).thenAnswer(invocation -> {
            AiMediaGenerationTask task = invocation.getArgument(0);
            task.setId(1L);
            task.setCreateTime(LocalDateTime.now());
            return 1;
        });

        GenerationPromptService promptService = mock(GenerationPromptService.class);
        when(promptService.enhance(anyString(), anyString(), anyString())).thenReturn("增强后的视觉辅助图");
        ImageGenerationProvider imageProvider = mock(ImageGenerationProvider.class);
        when(imageProvider.getProviderName()).thenReturn("siliconflow");
        ImageGenerationProfileProperties profiles = new ImageGenerationProfileProperties();
        profiles.setDefaultProfile("FAST");
        MediaGenerationService service = new MediaGenerationService(
                taskMapper,
                mock(SysFileInfoMapper.class),
                promptService,
                mock(GenerationContentSafetyService.class),
                mock(GeneratedMediaService.class),
                imageProvider,
                mock(VideoGenerationProvider.class),
                mock(AiChatSessionService.class),
                new ObjectMapper(),
                profiles);
        ReflectionTestUtils.setField(service, "executor", (Executor) submittedTask::set);
        ReflectionTestUtils.setField(service, "enabled", true);

        CreateImageGenerationDTO command = new CreateImageGenerationDTO();
        command.setPrompt("青铜神树祭祀场景示意图");
        command.setStyle("MUSEUM_POSTER");
        command.setAspectRatio("1:1");
        command.setClientRequestId("transactional-visual-aid");

        TransactionSynchronizationManager.initSynchronization();
        try {
            MediaGenerationTaskVO task = service.createImageTask(command, 7L);
            assertThat(task.getStatus()).isEqualTo("PENDING");
            assertThat(submittedTask.get()).isNull();

            for (TransactionSynchronization synchronization :
                    TransactionSynchronizationManager.getSynchronizations()) {
                synchronization.afterCommit();
            }
            assertThat(submittedTask.get()).isNotNull();
        } finally {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void sameClientRequestCreatesOneTaskAndPreservesProductMetadata() {
        AiMediaGenerationTaskMapper taskMapper = mock(AiMediaGenerationTaskMapper.class);
        SysFileInfoMapper fileInfoMapper = mock(SysFileInfoMapper.class);
        GenerationPromptService promptService = mock(GenerationPromptService.class);
        GenerationContentSafetyService safetyService = mock(GenerationContentSafetyService.class);
        GeneratedMediaService generatedMediaService = mock(GeneratedMediaService.class);
        ImageGenerationProvider imageProvider = mock(ImageGenerationProvider.class);
        VideoGenerationProvider videoProvider = mock(VideoGenerationProvider.class);
        AiChatSessionService chatSessionService = mock(AiChatSessionService.class);
        ImageGenerationProfileProperties profiles = new ImageGenerationProfileProperties();
        profiles.setDefaultProfile("FAST");
        ObjectMapper objectMapper = new ObjectMapper();

        AtomicReference<AiMediaGenerationTask> stored = new AtomicReference<>();
        List<String> stages = new ArrayList<>();
        when(taskMapper.selectOne(any(Wrapper.class))).thenAnswer(invocation -> stored.get());
        when(taskMapper.insert(any(AiMediaGenerationTask.class))).thenAnswer(invocation -> {
            AiMediaGenerationTask task = invocation.getArgument(0);
            task.setId(1L);
            task.setCreateTime(LocalDateTime.now());
            stored.set(task);
            return 1;
        });
        when(taskMapper.updateById(any(AiMediaGenerationTask.class))).thenAnswer(invocation -> {
            AiMediaGenerationTask task = invocation.getArgument(0);
            stages.add(task.getStage());
            stored.set(task);
            return 1;
        });
        when(promptService.enhance(anyString(), anyString(), anyString())).thenReturn("增强后的青铜神树场景");
        when(imageProvider.getProviderName()).thenReturn("siliconflow");
        when(imageProvider.generate(any())).thenReturn(new ImageGenerationProvider.ImageGenerationResult(
                "https://provider.example/result.png", "Tongyi-MAI/Z-Image-Turbo", "{}"));
        when(generatedMediaService.saveImage(anyString(), anyLong(), anyString(), any(Runnable.class)))
                .thenAnswer(invocation -> {
                    invocation.<Runnable>getArgument(3).run();
                    return new GeneratedMediaService.SavedMedia(99L, "/files/generated/result.png");
                });

        MediaGenerationService service = new MediaGenerationService(
                taskMapper, fileInfoMapper, promptService, safetyService, generatedMediaService,
                imageProvider, videoProvider, chatSessionService, objectMapper, profiles);
        Executor directExecutor = Runnable::run;
        ReflectionTestUtils.setField(service, "executor", directExecutor);
        ReflectionTestUtils.setField(service, "enabled", true);

        CreateImageGenerationDTO command = new CreateImageGenerationDTO();
        command.setPrompt("复原青铜神树祭祀场景");
        command.setStyle("ARTIFACT_RESTORE");
        command.setAspectRatio("1:1");
        command.setClientRequestId("request-once");
        GenerationExperienceContextDTO context = new GenerationExperienceContextDTO();
        context.setSurface("AI_CHAT");
        context.setScene("HERITAGE_CHAT");
        context.setPurpose("CULTURAL_RECONSTRUCTION");
        command.setExperienceContext(context);

        MediaGenerationTaskVO result = null;
        for (int i = 0; i < 5; i++) result = service.createImageTask(command, 7L);

        verify(taskMapper, times(1)).insert(any(AiMediaGenerationTask.class));
        verify(imageProvider, times(1)).generate(any());
        assertThat(stages).containsSubsequence(
                "PREPARING", "GENERATING", "DOWNLOADING", "SAVING", "SUCCEEDED");
        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo("SUCCEEDED");
        assertThat(result.getStage()).isEqualTo("SUCCEEDED");
        assertThat(result.getProgress()).isNull();
        assertThat(result.getModelProfile()).isEqualTo("FAST");
        assertThat(result.getContentLabel()).isEqualTo("AI_RECONSTRUCTION");
        assertThat(result.getExperienceContext().getSurface()).isEqualTo("AI_CHAT");
        assertThat(result.getExperienceEvent().getEventType()).isEqualTo("MEDIA_GENERATION_COMPLETED");
        assertThat(result.getExperienceEvent().getResult().getUrl()).isEqualTo("/files/generated/result.png");
    }
}

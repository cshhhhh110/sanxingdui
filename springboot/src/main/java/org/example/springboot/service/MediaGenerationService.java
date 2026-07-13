package org.example.springboot.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.Resource;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.springboot.config.ImageGenerationProfileProperties;
import org.example.springboot.dto.command.CreateImageGenerationDTO;
import org.example.springboot.dto.command.CreateVideoGenerationDTO;
import org.example.springboot.dto.command.GenerationExperienceContextDTO;
import org.example.springboot.dto.response.MediaGenerationExperienceEvent;
import org.example.springboot.dto.response.MediaGenerationHistoryVO;
import org.example.springboot.dto.response.MediaGenerationTaskVO;
import org.example.springboot.dto.response.MediaGenerationStatsVO;
import org.example.springboot.entity.AiMediaGenerationTask;
import org.example.springboot.entity.SysFileInfo;
import org.example.springboot.enums.MediaContentLabel;
import org.example.springboot.enums.MediaGenerationProfile;
import org.example.springboot.enums.MediaGenerationStage;
import org.example.springboot.exception.BusinessException;
import org.example.springboot.mapper.AiMediaGenerationTaskMapper;
import org.example.springboot.mapper.SysFileInfoMapper;
import org.example.springboot.service.provider.ImageGenerationProvider;
import org.example.springboot.service.provider.VideoGenerationProvider;
import org.example.springboot.util.FileUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.Locale;
import java.util.concurrent.Executor;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MediaGenerationService {
    private static final Set<String> IMAGE_MODES = Set.of("TEXT_TO_IMAGE", "IMAGE_TO_IMAGE");
    private static final Set<String> VIDEO_MODES = Set.of("TEXT_TO_VIDEO", "IMAGE_TO_VIDEO");
    private static final Set<String> ASPECT_RATIOS = Set.of("1:1", "4:3", "3:4", "16:9", "9:16");
    private static final Set<String> VIDEO_ASPECT_RATIOS = Set.of("1:1", "16:9", "9:16");

    private final AiMediaGenerationTaskMapper taskMapper;
    private final SysFileInfoMapper fileInfoMapper;
    private final GenerationPromptService promptService;
    private final GenerationContentSafetyService contentSafetyService;
    private final GeneratedMediaService generatedMediaService;
    private final ImageGenerationProvider imageProvider;
    private final VideoGenerationProvider videoProvider;
    private final AiChatSessionService chatSessionService;
    private final ObjectMapper objectMapper;
    private final ImageGenerationProfileProperties imageProfileProperties;
    @Resource(name = "mediaGenerationExecutor")
    private Executor executor;

    @Value("${media-generation.enabled:true}")
    private boolean enabled;

    public MediaGenerationTaskVO createImageTask(CreateImageGenerationDTO command, Long userId) {
        requireEnabled();
        contentSafetyService.validate(command.getPrompt());
        String mode = normalize(command.getMode(), "TEXT_TO_IMAGE");
        validateCommon(mode, command.getAspectRatio(), IMAGE_MODES);
        int count = command.getCount() == null ? 1 : command.getCount();
        if (count != 1) {
            throw new BusinessException("当前图片服务每个任务仅支持生成1张图片");
        }
        validateReference(mode, command.getReferenceFileId(), userId);
        if ("IMAGE_TO_IMAGE".equals(mode)) {
            throw new BusinessException("当前图片供应商暂不支持图生图，请使用文生图");
        }

        String clientRequestId = blankToNull(command.getClientRequestId());
        if (clientRequestId != null && clientRequestId.length() > 64) {
            throw new BusinessException("clientRequestId 长度不能超过64个字符");
        }
        AiMediaGenerationTask existing = findByClientRequestId(userId, clientRequestId);
        if (existing != null) return toVO(existing);
        String modelProfile = MediaGenerationProfile.from(
                command.getModelProfile(), imageProfileProperties.getDefaultProfile()).name();
        GenerationExperienceContextDTO experienceContext = normalizeExperienceContext(command);
        String contentLabel = resolveContentLabel(command.getStyle(), experienceContext).name();
        validateSessionOwnership(command.getSessionId(), userId);

        String finalPrompt = promptService.enhance(command.getPrompt(), command.getStyle(), "IMAGE");
        AiMediaGenerationTask task = baseTask(userId, "IMAGE", mode, command.getPrompt(), finalPrompt,
                command.getNegativePrompt(), command.getReferenceFileId(), command.getArtifactId(),
                command.getSessionId(), command.getMessageId());
        task.setProvider(imageProvider.getProviderName());
        task.setModelProfile(modelProfile);
        task.setContentLabel(contentLabel);
        task.setExperienceContext(experienceContext == null ? null : writeJson(experienceContext));
        task.setClientRequestId(clientRequestId);
        task.setRequestParams(writeJson(Map.of(
                "style", value(command.getStyle()),
                "aspectRatio", value(command.getAspectRatio()),
                "count", count
        )));
        try {
            taskMapper.insert(task);
        } catch (DuplicateKeyException duplicate) {
            AiMediaGenerationTask duplicateTask = findByClientRequestId(userId, clientRequestId);
            if (duplicateTask != null) return toVO(duplicateTask);
            throw duplicate;
        }
        if (task.getSessionId() != null && !task.getSessionId().isBlank()) {
            task.setMessageId(chatSessionService.createGenerationMessages(
                    task.getSessionId(), task.getPromptRaw(), task.getTaskId()).getId());
            taskMapper.updateById(task);
        }
        executor.execute(() -> processImage(task.getTaskId()));
        return toVO(task);
    }

    public MediaGenerationTaskVO createVideoTask(CreateVideoGenerationDTO command, Long userId) {
        requireEnabled();
        contentSafetyService.validate(command.getPrompt());
        String mode = normalize(command.getMode(), "TEXT_TO_VIDEO");
        validateCommon(mode, command.getAspectRatio(), VIDEO_MODES);
        if (!VIDEO_ASPECT_RATIOS.contains(command.getAspectRatio())) {
            throw new BusinessException("视频比例仅支持1:1、16:9或9:16");
        }
        if (command.getDurationSeconds() == null || command.getDurationSeconds() != 5) {
            throw new BusinessException("当前视频模型仅支持约5秒视频");
        }
        validateReference(mode, command.getReferenceFileId(), userId);
        String finalPrompt = promptService.enhance(command.getPrompt(), null, "VIDEO")
                + cameraMotionPrompt(command.getCameraMotion()) + "目标时长约5秒。";
        AiMediaGenerationTask task = baseTask(userId, "VIDEO", mode, command.getPrompt(), finalPrompt,
                command.getNegativePrompt(), command.getReferenceFileId(), command.getArtifactId(),
                command.getSessionId(), command.getMessageId());
        task.setProvider(videoProvider.getProviderName());
        task.setRequestParams(writeJson(Map.of(
                "aspectRatio", value(command.getAspectRatio()),
                "durationSeconds", command.getDurationSeconds(),
                "cameraMotion", value(command.getCameraMotion())
        )));
        taskMapper.insert(task);
        executor.execute(() -> submitVideo(task.getTaskId()));
        return toVO(task);
    }

    public MediaGenerationTaskVO getTask(String taskId, Long userId) {
        return toVO(requireOwnedTask(taskId, userId));
    }

    @Transactional
    public MediaGenerationTaskVO setFavorite(String taskId, Long userId, boolean favorite) {
        AiMediaGenerationTask task = requireOwnedTask(taskId, userId);
        task.setFavorite(favorite ? 1 : 0);
        taskMapper.updateById(task);
        return toVO(task);
    }

    @Transactional
    public MediaGenerationTaskVO enableShare(String taskId, Long userId) {
        AiMediaGenerationTask task = requireOwnedTask(taskId, userId);
        if (!"SUCCEEDED".equals(task.getStatus())) throw new BusinessException("仅成功任务可以分享");
        if (task.getShareToken() == null || task.getShareToken().isBlank()) {
            task.setShareToken(UUID.randomUUID().toString().replace("-", ""));
        }
        task.setShareEnabled(1);
        taskMapper.updateById(task);
        return toVO(task);
    }

    @Transactional
    public MediaGenerationTaskVO disableShare(String taskId, Long userId) {
        AiMediaGenerationTask task = requireOwnedTask(taskId, userId);
        task.setShareEnabled(0);
        taskMapper.updateById(task);
        return toVO(task);
    }

    public MediaGenerationTaskVO getShared(String shareToken) {
        AiMediaGenerationTask task = taskMapper.selectOne(new LambdaQueryWrapper<AiMediaGenerationTask>()
                .eq(AiMediaGenerationTask::getShareToken, shareToken)
                .eq(AiMediaGenerationTask::getShareEnabled, 1)
                .eq(AiMediaGenerationTask::getStatus, "SUCCEEDED"));
        if (task == null) throw new BusinessException("分享内容不存在或已关闭");
        return toVO(task);
    }

    public MediaGenerationStatsVO stats() {
        List<AiMediaGenerationTask> tasks = taskMapper.selectList(null);
        long succeeded = tasks.stream().filter(task -> "SUCCEEDED".equals(task.getStatus())).count();
        long failed = tasks.stream().filter(task -> "FAILED".equals(task.getStatus())).count();
        long processing = tasks.stream().filter(task -> "PENDING".equals(task.getStatus()) || "PROCESSING".equals(task.getStatus())).count();
        long averageSeconds = Math.round(tasks.stream()
                .filter(task -> task.getStartedTime() != null && task.getFinishedTime() != null)
                .mapToLong(task -> Duration.between(task.getStartedTime(), task.getFinishedTime()).toSeconds())
                .average().orElse(0));
        return new MediaGenerationStatsVO(
                tasks.size(), succeeded, failed, processing,
                tasks.isEmpty() ? 0 : Math.round(succeeded * 10000.0 / tasks.size()) / 100.0,
                averageSeconds,
                countBy(tasks, AiMediaGenerationTask::getMediaType),
                countBy(tasks, AiMediaGenerationTask::getProvider),
                countBy(tasks.stream().filter(task -> task.getErrorCode() != null).toList(), AiMediaGenerationTask::getErrorCode));
    }

    public MediaGenerationHistoryVO history(Long userId, long pageNum, long pageSize, String mediaType, String status) {
        long safePage = Math.max(1, pageNum);
        long safeSize = Math.min(50, Math.max(1, pageSize));
        LambdaQueryWrapper<AiMediaGenerationTask> query = new LambdaQueryWrapper<AiMediaGenerationTask>()
                .eq(AiMediaGenerationTask::getUserId, userId)
                .eq(mediaType != null && !mediaType.isBlank(), AiMediaGenerationTask::getMediaType, mediaType)
                .eq(status != null && !status.isBlank(), AiMediaGenerationTask::getStatus, status)
                .orderByDesc(AiMediaGenerationTask::getCreateTime);
        Page<AiMediaGenerationTask> page = taskMapper.selectPage(new Page<>(safePage, safeSize), query);
        return new MediaGenerationHistoryVO(page.getTotal(), page.getCurrent(), page.getSize(),
                page.getRecords().stream().map(this::toVO).toList());
    }

    @Transactional
    public MediaGenerationTaskVO cancel(String taskId, Long userId) {
        AiMediaGenerationTask task = requireOwnedTask(taskId, userId);
        if (!("PENDING".equals(task.getStatus()) || "PROCESSING".equals(task.getStatus()))) {
            throw new BusinessException("当前任务状态不可取消");
        }
        task.setStatus("CANCELED");
        setStage(task, MediaGenerationStage.CANCELED);
        task.setFinishedTime(LocalDateTime.now());
        taskMapper.updateById(task);
        return toVO(task);
    }

    public MediaGenerationTaskVO retry(String taskId, Long userId) {
        AiMediaGenerationTask old = requireOwnedTask(taskId, userId);
        if (!"FAILED".equals(old.getStatus())) {
            throw new BusinessException("仅失败任务可以重试");
        }
        AiMediaGenerationTask task = baseTask(userId, old.getMediaType(), old.getMode(), old.getPromptRaw(),
                old.getPromptFinal(), old.getNegativePrompt(), old.getReferenceFileId(), old.getArtifactId(),
                old.getSessionId(), old.getMessageId());
        task.setProvider(old.getProvider());
        task.setModelProfile(old.getModelProfile());
        task.setContentLabel(old.getContentLabel());
        task.setExperienceContext(old.getExperienceContext());
        task.setRequestParams(old.getRequestParams());
        task.setRetryCount(old.getRetryCount() == null ? 1 : old.getRetryCount() + 1);
        taskMapper.insert(task);
        if ("VIDEO".equals(task.getMediaType())) executor.execute(() -> submitVideo(task.getTaskId()));
        else executor.execute(() -> processImage(task.getTaskId()));
        return toVO(task);
    }

    void processImage(String taskId) {
        AiMediaGenerationTask task = findTask(taskId);
        if (task == null || "CANCELED".equals(task.getStatus())) return;
        try {
            task.setStatus("PROCESSING");
            task.setStartedTime(LocalDateTime.now());
            task.setProgress(null);
            setStage(task, MediaGenerationStage.PREPARING);
            taskMapper.updateById(task);
            advanceStage(taskId, MediaGenerationStage.GENERATING);
            ImageGenerationProvider.ImageGenerationResult result = imageProvider.generate(
                    new ImageGenerationProvider.ImageGenerationRequest(
                            task.getPromptFinal(), task.getNegativePrompt(), aspectRatio(task.getRequestParams()),
                            task.getModelProfile()));
            AiMediaGenerationTask generated = findTask(taskId);
            if (generated == null || "CANCELED".equals(generated.getStatus())) return;
            generated.setModel(result.model());
            generated.setProviderResponse(result.sanitizedResponse());
            setStage(generated, MediaGenerationStage.DOWNLOADING);
            taskMapper.updateById(generated);
            GeneratedMediaService.SavedMedia saved = generatedMediaService.saveImage(
                    result.remoteUrl(), task.getUserId(), task.getTaskId(),
                    () -> advanceStage(taskId, MediaGenerationStage.SAVING));
            AiMediaGenerationTask latest = findTask(taskId);
            if (latest == null || "CANCELED".equals(latest.getStatus())) return;
            latest.setResultFileId(saved.fileId());
            latest.setResultUrl(saved.url());
            latest.setStatus("SUCCEEDED");
            latest.setProgress(null);
            setStage(latest, MediaGenerationStage.SUCCEEDED);
            latest.setFinishedTime(LocalDateTime.now());
            taskMapper.updateById(latest);
            chatSessionService.completeGenerationMessage(
                    latest.getMessageId(), saved.fileId(), saved.url(), fileSize(saved.fileId()), latest.getTaskId());
        } catch (Exception e) {
            markFailed(taskId, "PROVIDER_UNAVAILABLE", safeMessage(e));
        }
    }

    void submitVideo(String taskId) {
        AiMediaGenerationTask task = findTask(taskId);
        if (task == null || "CANCELED".equals(task.getStatus())) return;
        try {
            task.setStatus("PROCESSING");
            task.setProgress(5);
            task.setStartedTime(LocalDateTime.now());
            setStage(task, MediaGenerationStage.GENERATING);
            taskMapper.updateById(task);
            VideoGenerationProvider.VideoSubmitResult result = videoProvider.submit(
                    new VideoGenerationProvider.VideoGenerationRequest(
                            task.getPromptFinal(), task.getNegativePrompt(), aspectRatio(task.getRequestParams()),
                            task.getMode(), referenceImage(task)));
            task.setProviderTaskId(result.providerTaskId());
            task.setModel(result.model());
            task.setProviderResponse(result.sanitizedResponse());
            task.setProgress(10);
            taskMapper.updateById(task);
        } catch (Exception e) {
            markFailed(taskId, "VIDEO_SUBMIT_FAILED", safeMessage(e));
        }
    }

    public void pollVideoTasks() {
        taskMapper.selectList(new LambdaQueryWrapper<AiMediaGenerationTask>()
                        .eq(AiMediaGenerationTask::getMediaType, "VIDEO")
                        .eq(AiMediaGenerationTask::getStatus, "PROCESSING")
                        .isNotNull(AiMediaGenerationTask::getProviderTaskId)
                        .orderByAsc(AiMediaGenerationTask::getUpdateTime)
                        .last("LIMIT 20"))
                .forEach(this::pollVideoTask);
    }

    private void pollVideoTask(AiMediaGenerationTask task) {
        try {
            VideoGenerationProvider.VideoTaskResult result = videoProvider.query(task.getProviderTaskId());
            if ("Failed".equals(result.status())) {
                markFailed(task.getTaskId(), "VIDEO_PROVIDER_FAILED",
                        result.reason() == null || result.reason().isBlank() ? "视频模型生成失败" : result.reason());
                return;
            }
            if (!"Succeed".equals(result.status())) {
                task.setProgress(Math.max(task.getProgress(), result.progress()));
                task.setProviderResponse(result.sanitizedResponse());
                taskMapper.updateById(task);
                return;
            }
            if (result.remoteUrl() == null || result.remoteUrl().isBlank()) {
                markFailed(task.getTaskId(), "VIDEO_RESULT_EMPTY", "视频模型未返回结果地址");
                return;
            }
            setStage(task, MediaGenerationStage.DOWNLOADING);
            task.setProgress(92);
            taskMapper.updateById(task);
            GeneratedMediaService.SavedMedia saved = generatedMediaService.saveVideo(
                    result.remoteUrl(), task.getUserId(), task.getTaskId());
            AiMediaGenerationTask latest = findTask(task.getTaskId());
            if (latest == null || "CANCELED".equals(latest.getStatus())) return;
            latest.setResultFileId(saved.fileId());
            latest.setResultUrl(saved.url());
            latest.setProviderResponse(result.sanitizedResponse());
            latest.setStatus("SUCCEEDED");
            latest.setProgress(100);
            setStage(latest, MediaGenerationStage.SUCCEEDED);
            latest.setFinishedTime(LocalDateTime.now());
            taskMapper.updateById(latest);
        } catch (Exception e) {
            log.warn("视频任务状态查询暂时失败: taskId={}, message={}", task.getTaskId(), safeMessage(e));
        }
    }

    private void markFailed(String taskId, String code, String message) {
        AiMediaGenerationTask task = findTask(taskId);
        if (task == null || "CANCELED".equals(task.getStatus())) return;
        task.setStatus("FAILED");
        setStage(task, MediaGenerationStage.FAILED);
        task.setErrorCode(code);
        task.setErrorMessage(message);
        task.setFinishedTime(LocalDateTime.now());
        taskMapper.updateById(task);
        chatSessionService.failGenerationMessage(task.getMessageId(), task.getTaskId(), message);
        log.warn("媒体生成任务失败: taskId={}, code={}, message={}", taskId, code, message);
    }

    private AiMediaGenerationTask baseTask(Long userId, String mediaType, String mode, String rawPrompt,
                                           String finalPrompt, String negativePrompt, Long referenceFileId,
                                           Long artifactId, String sessionId, Long messageId) {
        AiMediaGenerationTask task = new AiMediaGenerationTask();
        task.setTaskId(UUID.randomUUID().toString());
        task.setUserId(userId);
        task.setSessionId(sessionId);
        task.setMessageId(messageId);
        task.setMediaType(mediaType);
        task.setMode(mode);
        task.setPromptRaw(rawPrompt.trim());
        task.setPromptFinal(finalPrompt);
        task.setNegativePrompt(negativePrompt);
        task.setArtifactId(artifactId);
        task.setReferenceFileId(referenceFileId);
        task.setStatus("PENDING");
        task.setProgress(null);
        setStage(task, MediaGenerationStage.QUEUED);
        task.setRetryCount(0);
        return task;
    }

    private void validateCommon(String mode, String aspectRatio, Set<String> allowedModes) {
        if (!allowedModes.contains(mode)) throw new BusinessException("不支持的生成模式");
        if (aspectRatio == null || !ASPECT_RATIOS.contains(aspectRatio)) throw new BusinessException("不支持的画面比例");
    }

    private void validateReference(String mode, Long referenceFileId, Long userId) {
        boolean required = mode.startsWith("IMAGE_TO_");
        if (required && referenceFileId == null) throw new BusinessException("该生成模式需要参考图片");
        if (referenceFileId == null) return;
        SysFileInfo file = fileInfoMapper.selectById(referenceFileId);
        if (file == null || file.getStatus() == null || file.getStatus() != 1
                || file.getUploadUserId() == null || !file.getUploadUserId().equals(userId)) {
            throw new BusinessException("参考图片不存在或无权访问");
        }
        if (!"IMG".equalsIgnoreCase(file.getFileType())) throw new BusinessException("参考文件必须是图片");
    }

    private AiMediaGenerationTask requireOwnedTask(String taskId, Long userId) {
        AiMediaGenerationTask task = taskMapper.selectOne(new LambdaQueryWrapper<AiMediaGenerationTask>()
                .eq(AiMediaGenerationTask::getTaskId, taskId)
                .eq(AiMediaGenerationTask::getUserId, userId));
        if (task == null) throw new BusinessException("生成任务不存在");
        return task;
    }

    private AiMediaGenerationTask findTask(String taskId) {
        return taskMapper.selectOne(new LambdaQueryWrapper<AiMediaGenerationTask>()
                .eq(AiMediaGenerationTask::getTaskId, taskId));
    }

    private MediaGenerationTaskVO toVO(AiMediaGenerationTask task) {
        MediaGenerationTaskVO vo = new MediaGenerationTaskVO();
        vo.setTaskId(task.getTaskId());
        vo.setMediaType(task.getMediaType());
        vo.setMode(task.getMode());
        vo.setStatus(task.getStatus());
        MediaGenerationStage stage = resolveStage(task);
        vo.setStage(stage.name());
        vo.setStageMessage(stage.getMessage());
        vo.setProgress("IMAGE".equals(task.getMediaType()) ? null : task.getProgress());
        vo.setElapsedSeconds(elapsedSeconds(task));
        vo.setModelProfile(task.getModelProfile());
        vo.setContentLabel(task.getContentLabel());
        vo.setExperienceContext(readExperienceContext(task.getExperienceContext()));
        vo.setPromptRaw(task.getPromptRaw());
        vo.setPromptFinal(task.getPromptFinal());
        vo.setReferenceFileId(task.getReferenceFileId());
        vo.setResultFileId(task.getResultFileId());
        vo.setResultUrl(task.getResultUrl());
        vo.setErrorCode(task.getErrorCode());
        vo.setErrorMessage(task.getErrorMessage());
        vo.setFavorite(Integer.valueOf(1).equals(task.getFavorite()));
        vo.setShareEnabled(Integer.valueOf(1).equals(task.getShareEnabled()));
        vo.setShareToken(task.getShareToken());
        vo.setCreateTime(task.getCreateTime());
        vo.setFinishedTime(task.getFinishedTime());
        vo.setStageUpdatedTime(task.getStageUpdatedTime());
        if ("SUCCEEDED".equals(task.getStatus()) && task.getResultUrl() != null) {
            vo.setExperienceEvent(new MediaGenerationExperienceEvent(
                    "MEDIA_GENERATION_COMPLETED",
                    task.getMediaType(),
                    task.getTaskId(),
                    "USER",
                    vo.getExperienceContext(),
                    new MediaGenerationExperienceEvent.Result(task.getResultUrl(), task.getContentLabel()),
                    task.getFinishedTime()));
        }
        return vo;
    }

    private void validateSessionOwnership(String sessionId, Long userId) {
        if (sessionId != null && !sessionId.isBlank()
                && !chatSessionService.isSessionOwnedByUser(sessionId, userId)) {
            throw new BusinessException("无权访问此聊天会话");
        }
    }

    private AiMediaGenerationTask findByClientRequestId(Long userId, String clientRequestId) {
        if (clientRequestId == null) return null;
        return taskMapper.selectOne(new LambdaQueryWrapper<AiMediaGenerationTask>()
                .eq(AiMediaGenerationTask::getUserId, userId)
                .eq(AiMediaGenerationTask::getClientRequestId, clientRequestId));
    }

    private GenerationExperienceContextDTO normalizeExperienceContext(CreateImageGenerationDTO command) {
        GenerationExperienceContextDTO context = command.getExperienceContext();
        if (context == null) return null;
        context.setSchemaVersion(1);
        if (blankToNull(context.getSessionId()) == null) context.setSessionId(command.getSessionId());
        if (context.getPurpose() == null || context.getPurpose().isBlank()) {
            context.setPurpose("CREATIVE_DESIGN");
        } else {
            context.setPurpose(context.getPurpose().trim().toUpperCase(Locale.ROOT));
        }
        Set<String> purposes = Set.of(
                "CULTURAL_RECONSTRUCTION", "CULTURAL_ILLUSTRATION", "CREATIVE_DESIGN", "GUIDE_SUPPORT");
        if (!purposes.contains(context.getPurpose())) throw new BusinessException("不支持的创作用途");
        return context;
    }

    private MediaContentLabel resolveContentLabel(String style, GenerationExperienceContextDTO context) {
        String purpose = context == null ? "" : value(context.getPurpose());
        if ("CULTURAL_RECONSTRUCTION".equals(purpose) || "ARTIFACT_RESTORE".equalsIgnoreCase(value(style))) {
            return MediaContentLabel.AI_RECONSTRUCTION;
        }
        if ("CULTURAL_ILLUSTRATION".equals(purpose) || "GUIDE_SUPPORT".equals(purpose)) {
            return MediaContentLabel.AI_ILLUSTRATION;
        }
        return MediaContentLabel.AI_CREATION;
    }

    private GenerationExperienceContextDTO readExperienceContext(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            return objectMapper.readValue(json, GenerationExperienceContextDTO.class);
        } catch (Exception ignored) {
            return null;
        }
    }

    private void advanceStage(String taskId, MediaGenerationStage stage) {
        AiMediaGenerationTask latest = findTask(taskId);
        if (latest == null || "CANCELED".equals(latest.getStatus())) return;
        setStage(latest, stage);
        taskMapper.updateById(latest);
    }

    private void setStage(AiMediaGenerationTask task, MediaGenerationStage stage) {
        task.setStage(stage.name());
        task.setStageUpdatedTime(LocalDateTime.now());
    }

    private MediaGenerationStage resolveStage(AiMediaGenerationTask task) {
        if (task.getStage() != null) {
            try {
                return MediaGenerationStage.valueOf(task.getStage());
            } catch (IllegalArgumentException ignored) {
                // Fall back to the legacy task status below.
            }
        }
        return switch (value(task.getStatus())) {
            case "SUCCEEDED" -> MediaGenerationStage.SUCCEEDED;
            case "FAILED" -> MediaGenerationStage.FAILED;
            case "CANCELED" -> MediaGenerationStage.CANCELED;
            case "PROCESSING" -> MediaGenerationStage.GENERATING;
            default -> MediaGenerationStage.QUEUED;
        };
    }

    private long elapsedSeconds(AiMediaGenerationTask task) {
        LocalDateTime start = task.getStartedTime() != null ? task.getStartedTime() : task.getCreateTime();
        if (start == null) return 0;
        LocalDateTime end = task.getFinishedTime() != null ? task.getFinishedTime() : LocalDateTime.now();
        return Math.max(0, Duration.between(start, end).toSeconds());
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private void requireEnabled() {
        if (!enabled) throw new BusinessException("媒体生成功能未启用");
    }

    private String normalize(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim().toUpperCase();
    }

    private String writeJson(Object value) {
        try { return objectMapper.writeValueAsString(value); }
        catch (Exception e) { throw new BusinessException("生成参数序列化失败"); }
    }

    private String aspectRatio(String params) {
        try { return objectMapper.readTree(params).path("aspectRatio").asText("1:1"); }
        catch (Exception ignored) { return "1:1"; }
    }

    private String value(String value) { return value == null ? "" : value; }

    private String cameraMotionPrompt(String cameraMotion) {
        return switch (value(cameraMotion).toUpperCase()) {
            case "SLOW_PUSH_IN" -> "镜头缓慢向前推进。";
            case "SLOW_PULL_OUT" -> "镜头缓慢向后拉远。";
            case "PAN_LEFT" -> "镜头平稳向左摇摄。";
            case "PAN_RIGHT" -> "镜头平稳向右摇摄。";
            default -> "保持固定镜头和稳定构图。";
        };
    }

    private String safeMessage(Exception exception) {
        String message = exception.getMessage();
        if (message == null || message.isBlank()) return "媒体生成失败";
        return message.length() > 300 ? message.substring(0, 300) : message;
    }

    private Long fileSize(Long fileId) {
        SysFileInfo file = fileInfoMapper.selectById(fileId);
        return file == null ? null : file.getFileSize();
    }

    private String referenceImage(AiMediaGenerationTask task) {
        if (!"IMAGE_TO_VIDEO".equals(task.getMode())) return null;
        SysFileInfo file = fileInfoMapper.selectById(task.getReferenceFileId());
        if (file == null) throw new BusinessException("参考图片不存在");
        try {
            String relative = FileUtil.convertToRelativePath(file.getFilePath());
            Path root = Path.of(FileUtil.FILE_BASE_PATH).toAbsolutePath().normalize();
            Path path = root.resolve(relative).normalize();
            if (!path.startsWith(root) || !Files.exists(path)) throw new BusinessException("参考图片文件不存在");
            byte[] bytes = Files.readAllBytes(path);
            if (bytes.length > 20 * 1024 * 1024) throw new BusinessException("参考图片不能超过20MB");
            String lower = file.getOriginalName() == null ? "" : file.getOriginalName().toLowerCase();
            String mime = lower.endsWith(".webp") ? "image/webp"
                    : lower.endsWith(".jpg") || lower.endsWith(".jpeg") ? "image/jpeg" : "image/png";
            return "data:" + mime + ";base64," + Base64.getEncoder().encodeToString(bytes);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException("读取参考图片失败");
        }
    }

    private Map<String, Long> countBy(List<AiMediaGenerationTask> tasks, java.util.function.Function<AiMediaGenerationTask, String> classifier) {
        Map<String, Long> counts = new HashMap<>();
        tasks.forEach(task -> {
            String key = classifier.apply(task);
            if (key != null && !key.isBlank()) counts.merge(key, 1L, Long::sum);
        });
        return counts;
    }
}

package org.example.springboot.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.springboot.ai.HeritageAssistantService;
import org.example.springboot.common.Result;
import org.example.springboot.common.ResultCode;
import org.example.springboot.dto.FileInfoDTO;
import org.example.springboot.dto.command.AiChatAttachmentDTO;
import org.example.springboot.dto.command.AiChatCommandDTO;
import org.example.springboot.dto.response.AiChatMessageAttachmentResponseDTO;
import org.example.springboot.dto.response.AiChatMessageResponseDTO;
import org.example.springboot.dto.response.AiChatSessionResponseDTO;
import org.example.springboot.entity.AiChatMessage;
import org.example.springboot.entity.AiChatMessageAttachment;
import org.example.springboot.entity.AiChatSession;
import org.example.springboot.exception.BusinessException;
import org.example.springboot.service.AiChatSessionService;
import org.example.springboot.service.AudioTranscriptionService;
import org.example.springboot.service.FileService;
import org.example.springboot.util.JwtTokenUtils;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Flux;

import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * AI chat controller.
 */
@Slf4j
@RestController
@RequestMapping("/ai-chat")
@RequiredArgsConstructor
@Tag(name = "AI智能助手", description = "三星堆知识问答AI服务")
public class AiChatController {

    private final HeritageAssistantService aiService;
    private final AiChatSessionService sessionService;
    private final FileService fileService;
    private final AudioTranscriptionService audioTranscriptionService;

    private Long getCurrentUserId() {
        Long userId = JwtTokenUtils.getCurrentUserId();
        if (userId != null) {
            return userId;
        }
        return 1L;
    }

    private <T> Result<T> unauthorized() {
        return Result.error(ResultCode.UNAUTHORIZED.getCode(), "请先登录后使用AI助手");
    }

    @PostMapping("/session/start")
    @Operation(summary = "创建新会话")
    public Result<String> startSession(@RequestParam(required = false) String title) {
        Long userId = getCurrentUserId();
        if (userId == null) {
            return unauthorized();
        }
        return Result.success(sessionService.createSession(userId, title));
    }

    @GetMapping("/session/list")
    @Operation(summary = "获取会话列表")
    public Result<List<AiChatSessionResponseDTO>> getSessionList() {
        Long userId = getCurrentUserId();
        if (userId == null) {
            return unauthorized();
        }

        List<AiChatSessionResponseDTO> dtoList = sessionService.getUserSessions(userId).stream()
                .map(session -> AiChatSessionResponseDTO.builder()
                        .sessionId(session.getSessionId())
                        .title(session.getTitle())
                        .createTime(session.getCreateTime())
                        .updateTime(session.getUpdateTime())
                        .build())
                .toList();

        return Result.success(dtoList);
    }

    @GetMapping("/session/{sessionId}/messages")
    @Operation(summary = "获取会话消息历史")
    public Result<List<AiChatMessageResponseDTO>> getSessionMessages(@PathVariable String sessionId) {
        Long userId = getCurrentUserId();
        if (userId == null) {
            return unauthorized();
        }

        if (!sessionService.isSessionOwnedByUser(sessionId, userId)) {
            return Result.error("无权访问此会话");
        }

        List<AiChatMessageResponseDTO> dtoList = sessionService.getSessionMessages(sessionId).stream()
                .map(this::toMessageResponse)
                .toList();

        return Result.success(dtoList);
    }

    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "流式对话")
    public Flux<String> chatStream(@RequestBody AiChatCommandDTO dto) {
        Long userId = getCurrentUserId();
        if (userId == null) {
            return Flux.just("[ERROR]请先登录后使用AI助手");
        }

        try {
            validateChatCommand(dto);
        } catch (BusinessException e) {
            return Flux.just("[ERROR]" + e.getMessage());
        }

        if (!sessionService.isSessionOwnedByUser(dto.getSessionId(), userId)) {
            return Flux.just("[ERROR]无权访问此会话");
        }

        log.info("Start AI chat stream, sessionId: {}, userId: {}, attachments: {}",
                dto.getSessionId(), userId, dto.getAttachments() == null ? 0 : dto.getAttachments().size());

        Flux<String> statusEvents = buildStreamStatusEvents(dto);

        return statusEvents.concatWith(aiService.chatStream(dto.getSessionId(), dto.getUserMessage(), dto.getAttachments()))
                .concatWith(Flux.just("[DONE]"))
                .doOnError(error -> log.error("AI chat stream failed", error))
                .onErrorResume(error -> Flux.just(
                        agentEvent("error", "failed", "当前智能生成服务暂时不可用，正在切换备用资料方案...", Map.of()),
                        "[ERROR]" + error.getMessage()
                ));
    }

    @PostMapping("/chat")
    @Operation(summary = "非流式对话")
    public Result<String> chat(@RequestBody AiChatCommandDTO dto) {
        Long userId = getCurrentUserId();
        if (userId == null) {
            return unauthorized();
        }

        validateChatCommand(dto);

        if (!sessionService.isSessionOwnedByUser(dto.getSessionId(), userId)) {
            return Result.error("无权访问此会话");
        }

        return Result.success(aiService.chat(dto.getSessionId(), dto.getUserMessage(), dto.getAttachments()));
    }

    @PostMapping(value = "/speech-input", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "语音输入转文字")
    public Result<String> transcribeSpeechInput(@RequestParam("file") MultipartFile file) {
        Long userId = getCurrentUserId();
        if (userId == null) {
            return unauthorized();
        }
        if (file == null || file.isEmpty()) {
            return Result.error("录音文件不能为空");
        }

        try {
            FileInfoDTO uploaded = fileService.uploadTempFile(file, userId);
            AiChatAttachmentDTO attachment = new AiChatAttachmentDTO();
            attachment.setFileId(uploaded.getId());
            attachment.setMediaType("AUDIO");
            attachment.setFileName(uploaded.getOriginalName());
            attachment.setFilePath(uploaded.getFilePath());
            attachment.setMimeType(file.getContentType());
            attachment.setFileSize(uploaded.getFileSize());

            String transcript = audioTranscriptionService.transcribe(attachment);
            return Result.success(transcript);
        } catch (Exception e) {
            log.error("Speech input transcription failed, filename={}", file.getOriginalFilename(), e);
            return Result.error("语音识别失败: " + e.getMessage());
        }
    }

    @PutMapping("/session/{sessionId}/title")
    @Operation(summary = "更新会话标题")
    public Result<Void> updateSessionTitle(@PathVariable String sessionId, @RequestParam String title) {
        Long userId = getCurrentUserId();
        if (userId == null) {
            return unauthorized();
        }

        if (!sessionService.isSessionOwnedByUser(sessionId, userId)) {
            return Result.error("无权访问此会话");
        }

        sessionService.updateSessionTitle(sessionId, title);
        return Result.success();
    }

    @DeleteMapping("/session/{sessionId}")
    @Operation(summary = "删除会话")
    public Result<Void> deleteSession(@PathVariable String sessionId) {
        Long userId = getCurrentUserId();
        if (userId == null) {
            return unauthorized();
        }

        if (!sessionService.isSessionOwnedByUser(sessionId, userId)) {
            return Result.error("无权访问此会话");
        }

        sessionService.deleteSession(sessionId);
        return Result.success();
    }

    private void validateChatCommand(AiChatCommandDTO dto) {
        if (dto == null || dto.getSessionId() == null || dto.getSessionId().trim().isEmpty()) {
            throw new BusinessException("会话ID不能为空");
        }

        boolean hasText = dto.getUserMessage() != null && !dto.getUserMessage().trim().isEmpty();
        boolean hasAttachments = dto.getAttachments() != null && !dto.getAttachments().isEmpty();
        if (!hasText && !hasAttachments) {
            throw new BusinessException("消息内容和附件不能同时为空");
        }
    }

    private Flux<String> buildStreamStatusEvents(AiChatCommandDTO dto) {
        String artifact = getContextText(dto.getContext(), "currentArtifact");
        boolean hasAttachments = dto.getAttachments() != null && !dto.getAttachments().isEmpty();

        String startMessage = artifact == null || artifact.isBlank()
                ? "玄喵正在理解你的问题..."
                : "正在结合你当前查看的" + artifact + "资料...";
        String prepareMessage = hasAttachments
                ? "正在读取你上传的材料..."
                : "正在整理相关线索...";

        return Flux.just(
                        agentEvent("thinking_status", "running", startMessage, Map.of("artifact", artifact == null ? "" : artifact)),
                        agentEvent("relation_discovery", "running", prepareMessage, Map.of("hasAttachments", hasAttachments)),
                        agentEvent("generating", "running", "正在生成讲解...", Map.of())
                )
                .delayElements(Duration.ofMillis(80));
    }

    private String getContextText(Map<String, Object> context, String key) {
        if (context == null || !context.containsKey(key) || context.get(key) == null) {
            return "";
        }
        return String.valueOf(context.get(key));
    }

    private String agentEvent(String type, String status, String message, Map<String, ?> metadata) {
        StringBuilder builder = new StringBuilder("[AGENT_EVENT]{");
        builder.append("\"id\":\"").append(jsonEscape(type)).append("-").append(System.currentTimeMillis()).append("\",");
        builder.append("\"type\":\"").append(jsonEscape(type)).append("\",");
        builder.append("\"status\":\"").append(jsonEscape(status)).append("\",");
        builder.append("\"message\":\"").append(jsonEscape(message)).append("\",");
        builder.append("\"timestamp\":\"").append(java.time.Instant.now()).append("\",");
        builder.append("\"metadata\":").append(toJsonObject(metadata));
        builder.append("}");
        return builder.toString();
    }

    private String toJsonObject(Map<String, ?> metadata) {
        if (metadata == null || metadata.isEmpty()) {
            return "{}";
        }
        StringBuilder builder = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, ?> entry : metadata.entrySet()) {
            if (!first) {
                builder.append(",");
            }
            first = false;
            builder.append("\"").append(jsonEscape(entry.getKey())).append("\":");
            Object value = entry.getValue();
            if (value instanceof Boolean || value instanceof Number) {
                builder.append(value);
            } else {
                builder.append("\"").append(jsonEscape(value == null ? "" : String.valueOf(value))).append("\"");
            }
        }
        builder.append("}");
        return builder.toString();
    }

    private String jsonEscape(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\r", "\\r")
                .replace("\n", "\\n");
    }

    private AiChatMessageResponseDTO toMessageResponse(AiChatMessage msg) {
        List<AiChatMessageAttachmentResponseDTO> attachments = sessionService.getMessageAttachments(msg.getId()).stream()
                .map(this::toAttachmentResponse)
                .toList();

        return AiChatMessageResponseDTO.builder()
                .id(msg.getId())
                .role(msg.getRole())
                .content(msg.getContent())
                .messageType(msg.getMessageType())
                .generationTaskId("MEDIA_GENERATION".equals(msg.getMessageType()) ? msg.getProcessedContent() : null)
                .attachments(attachments)
                .createTime(msg.getCreateTime())
                .build();
    }

    private AiChatMessageAttachmentResponseDTO toAttachmentResponse(AiChatMessageAttachment item) {
        return AiChatMessageAttachmentResponseDTO.builder()
                .id(item.getId())
                .messageId(item.getMessageId())
                .fileId(item.getFileId())
                .mediaType(item.getMediaType())
                .fileName(item.getFileName())
                .filePath(item.getFilePath())
                .mimeType(item.getMimeType())
                .fileSize(item.getFileSize())
                .analysisStatus(item.getAnalysisStatus())
                .extractedText(item.getExtractedText())
                .extractedMeta(item.getExtractedMeta())
                .build();
    }
}

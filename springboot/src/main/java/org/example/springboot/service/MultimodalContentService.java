package org.example.springboot.service;

import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.example.springboot.dto.command.AiChatAttachmentDTO;
import org.example.springboot.entity.AiChatMessageAttachment;
import org.example.springboot.entity.SysFileInfo;
import org.example.springboot.enums.FileTypeEnum;
import org.example.springboot.exception.BusinessException;
import org.example.springboot.mapper.AiChatMessageAttachmentMapper;
import org.example.springboot.mapper.SysFileInfoMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/**
 * Builds model-readable context from text and uploaded attachments.
 */
@Slf4j
@Service
public class MultimodalContentService {

    private static final int MAX_ATTACHMENTS = 5;

    private final SysFileInfoMapper fileInfoMapper;
    private final AiChatMessageAttachmentMapper attachmentMapper;
    private final ImageAnalysisService imageAnalysisService;
    private final AudioTranscriptionService audioTranscriptionService;
    private final VideoAnalysisService videoAnalysisService;
    private final DocumentTextExtractionService documentTextExtractionService;

    @Value("${image.analysis.timeout-seconds:25}")
    private long imageAnalysisTimeoutSeconds;

    public MultimodalContentService(SysFileInfoMapper fileInfoMapper,
                                    AiChatMessageAttachmentMapper attachmentMapper,
                                    ImageAnalysisService imageAnalysisService,
                                    AudioTranscriptionService audioTranscriptionService,
                                    VideoAnalysisService videoAnalysisService,
                                    DocumentTextExtractionService documentTextExtractionService) {
        this.fileInfoMapper = fileInfoMapper;
        this.attachmentMapper = attachmentMapper;
        this.imageAnalysisService = imageAnalysisService;
        this.audioTranscriptionService = audioTranscriptionService;
        this.videoAnalysisService = videoAnalysisService;
        this.documentTextExtractionService = documentTextExtractionService;
    }

    public MultimodalPrompt buildPrompt(String userMessage, List<AiChatAttachmentDTO> attachments) {
        List<AiChatAttachmentDTO> safeAttachments = normalizeAttachments(attachments, userMessage);
        String text = userMessage == null ? "" : userMessage.trim();

        if (StrUtil.isBlank(text) && safeAttachments.isEmpty()) {
            throw new BusinessException("消息内容和附件不能同时为空");
        }

        StringBuilder modelText = new StringBuilder();
        if (StrUtil.isNotBlank(text)) {
            modelText.append("用户原始问题：\n").append(text).append("\n");
        } else {
            modelText.append("用户未输入文字，只上传了附件。\n");
        }

        if (!safeAttachments.isEmpty()) {
            modelText.append("\n用户上传了以下附件。系统会优先使用已完成的解析结果；")
                    .append("未解析成功的附件只能基于文件元数据回答，并明确说明限制。\n");
            for (int i = 0; i < safeAttachments.size(); i++) {
                AiChatAttachmentDTO attachment = safeAttachments.get(i);
                modelText.append(i + 1)
                        .append(". 类型：").append(attachment.getMediaType())
                        .append("；文件名：").append(nullToEmpty(attachment.getFileName()))
                        .append("；路径：").append(nullToEmpty(attachment.getFilePath()))
                        .append("；MIME：").append(nullToEmpty(attachment.getMimeType()))
                        .append("；大小：").append(attachment.getFileSize() == null ? 0 : attachment.getFileSize())
                        .append(" bytes")
                        .append("；解析状态：").append(nullToEmpty(attachment.getAnalysisStatus()))
                        .append("\n");

                if (StrUtil.isNotBlank(attachment.getExtractedText())) {
                    modelText.append("   解析结果：").append(attachment.getExtractedText()).append("\n");
                }
            }
        }

        String displayContent = StrUtil.isNotBlank(text) ? text : "[附件消息]";
        String messageType = safeAttachments.isEmpty() ? "TEXT" : "MULTIMODAL";
        return new MultimodalPrompt(displayContent, text, modelText.toString(), messageType, safeAttachments);
    }

    private List<AiChatAttachmentDTO> normalizeAttachments(List<AiChatAttachmentDTO> attachments, String userMessage) {
        if (attachments == null || attachments.isEmpty()) {
            return List.of();
        }
        if (attachments.size() > MAX_ATTACHMENTS) {
            throw new BusinessException("单条消息最多支持" + MAX_ATTACHMENTS + "个附件");
        }

        List<AiChatAttachmentDTO> normalized = new ArrayList<>();
        for (AiChatAttachmentDTO attachment : attachments) {
            if (attachment == null || attachment.getFileId() == null) {
                throw new BusinessException("附件缺少fileId");
            }
            SysFileInfo fileInfo = fileInfoMapper.selectById(attachment.getFileId());
            if (fileInfo == null || !fileInfo.isNormalStatus()) {
                throw new BusinessException("附件文件不存在或不可用: " + attachment.getFileId());
            }

            AiChatAttachmentDTO next = new AiChatAttachmentDTO();
            next.setFileId(fileInfo.getId());
            next.setFileName(StrUtil.blankToDefault(attachment.getFileName(), fileInfo.getOriginalName()));
            next.setFilePath(StrUtil.blankToDefault(attachment.getFilePath(), fileInfo.getFilePath()));
            next.setFileSize(fileInfo.getFileSize());
            next.setMimeType(attachment.getMimeType());
            next.setMediaType(resolveMediaType(attachment, fileInfo));
            enrichAttachmentAnalysis(next, userMessage);
            normalized.add(next);
        }
        return normalized;
    }

    private void enrichAttachmentAnalysis(AiChatAttachmentDTO attachment, String userMessage) {
        if (reuseCachedAnalysis(attachment)) {
            return;
        }

        attachment.setAnalysisStatus("PENDING");
        if ("IMAGE".equals(attachment.getMediaType())) {
            analyzeImageAttachment(attachment, userMessage);
            return;
        }
        if ("AUDIO".equals(attachment.getMediaType())) {
            transcribeAudioAttachment(attachment);
            return;
        }
        if ("VIDEO".equals(attachment.getMediaType())) {
            analyzeVideoAttachment(attachment, userMessage);
            return;
        }
        if ("DOCUMENT".equals(attachment.getMediaType())) {
            extractDocumentAttachment(attachment);
            return;
        }

        attachment.setAnalysisStatus("SKIPPED");
    }

    private boolean reuseCachedAnalysis(AiChatAttachmentDTO attachment) {
        if (!"IMAGE".equals(attachment.getMediaType()) && !"AUDIO".equals(attachment.getMediaType())
                && !"VIDEO".equals(attachment.getMediaType()) && !"DOCUMENT".equals(attachment.getMediaType())) {
            return false;
        }

        LambdaQueryWrapper<AiChatMessageAttachment> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AiChatMessageAttachment::getFileId, attachment.getFileId())
                .eq(AiChatMessageAttachment::getMediaType, attachment.getMediaType())
                .eq(AiChatMessageAttachment::getAnalysisStatus, "DONE")
                .isNotNull(AiChatMessageAttachment::getExtractedText)
                .orderByDesc(AiChatMessageAttachment::getId)
                .last("LIMIT 1");

        AiChatMessageAttachment cached = attachmentMapper.selectOne(wrapper);
        if (cached == null || StrUtil.isBlank(cached.getExtractedText())) {
            return false;
        }

        attachment.setAnalysisStatus("DONE");
        attachment.setExtractedText(cached.getExtractedText());
        attachment.setExtractedMeta(cached.getExtractedMeta());
        return true;
    }

    private void analyzeImageAttachment(AiChatAttachmentDTO attachment, String userMessage) {
        try {
            String extractedText = CompletableFuture
                    .supplyAsync(() -> imageAnalysisService.analyze(attachment, userMessage))
                    .orTimeout(imageAnalysisTimeoutSeconds, TimeUnit.SECONDS)
                    .join();
            attachment.setExtractedText(StrUtil.blankToDefault(extractedText, "图片解析未返回文本结果"));
            attachment.setExtractedMeta("{\"provider\":\"spring-ai-chat-vision\"}");
            attachment.setAnalysisStatus("DONE");
        } catch (Exception e) {
            Throwable rootCause = unwrapCompletionException(e);
            log.warn("Image analysis failed, fileId: {}, filePath: {}, error: {}",
                    attachment.getFileId(), attachment.getFilePath(), rootCause.getMessage());
            attachment.setExtractedText("图片解析失败：" + safeErrorMessage(rootCause.getMessage()));
            attachment.setExtractedMeta("{\"provider\":\"spring-ai-chat-vision\"}");
            attachment.setAnalysisStatus("FAILED");
        }
    }

    private void extractDocumentAttachment(AiChatAttachmentDTO attachment) {
        try {
            String extractedText = documentTextExtractionService.extract(attachment);
            attachment.setExtractedText(StrUtil.blankToDefault(extractedText, "文档未返回可用文本"));
            attachment.setExtractedMeta("{\"provider\":\"pdfbox+apache-poi\"}");
            attachment.setAnalysisStatus("DONE");
        } catch (Exception e) {
            log.warn("Document extraction failed, fileId: {}, filePath: {}, error: {}",
                    attachment.getFileId(), attachment.getFilePath(), e.getMessage());
            attachment.setExtractedText("文档解析失败：" + safeErrorMessage(e.getMessage()));
            attachment.setExtractedMeta("{\"provider\":\"pdfbox+apache-poi\"}");
            attachment.setAnalysisStatus("FAILED");
        }
    }

    private void analyzeVideoAttachment(AiChatAttachmentDTO attachment, String userMessage) {
        try {
            VideoAnalysisService.VideoAnalysisResult result = videoAnalysisService.analyze(attachment, userMessage);
            attachment.setExtractedText(StrUtil.blankToDefault(result.getExtractedText(), "视频解析未返回文本结果"));
            attachment.setExtractedMeta(result.getExtractedMeta());
            attachment.setAnalysisStatus("DONE");
        } catch (Exception e) {
            log.warn("Video analysis failed, fileId: {}, filePath: {}, error: {}",
                    attachment.getFileId(), attachment.getFilePath(), e.getMessage());
            attachment.setExtractedText("视频解析失败：" + safeErrorMessage(e.getMessage()));
            attachment.setExtractedMeta("{\"provider\":\"ffmpeg+vision+asr\"}");
            attachment.setAnalysisStatus("FAILED");
        }
    }

    private void transcribeAudioAttachment(AiChatAttachmentDTO attachment) {
        try {
            String transcript = audioTranscriptionService.transcribe(attachment);
            attachment.setExtractedText(StrUtil.blankToDefault(transcript, "音频转写未返回文本结果"));
            attachment.setExtractedMeta("{\"provider\":\"openai-compatible-asr\"}");
            attachment.setAnalysisStatus("DONE");
        } catch (Exception e) {
            log.warn("Audio transcription failed, fileId: {}, filePath: {}, error: {}",
                    attachment.getFileId(), attachment.getFilePath(), e.getMessage());
            attachment.setExtractedText("音频转写失败：" + safeErrorMessage(e.getMessage()));
            attachment.setExtractedMeta("{\"provider\":\"openai-compatible-asr\"}");
            attachment.setAnalysisStatus("FAILED");
        }
    }

    private String normalizeMediaType(String type) {
        if (StrUtil.isBlank(type)) {
            return "FILE";
        }
        String upperType = type.toUpperCase();
        if ("IMG".equals(upperType) || "IMAGE".equals(upperType)) {
            return "IMAGE";
        }
        if ("AUDIO".equals(upperType)) {
            return "AUDIO";
        }
        if ("VIDEO".equals(upperType)) {
            return "VIDEO";
        }
        if ("PDF".equals(upperType) || "DOC".equals(upperType) || "XLS".equals(upperType)
                || "PPT".equals(upperType) || "TXT".equals(upperType)) {
            return "DOCUMENT";
        }
        if (FileTypeEnum.isAllowType(upperType)) {
            return "FILE";
        }
        return "FILE";
    }

    private String resolveMediaType(AiChatAttachmentDTO attachment, SysFileInfo fileInfo) {
        String requestedType = normalizeMediaType(attachment.getMediaType());
        if (!"FILE".equals(requestedType)) {
            return requestedType;
        }

        String storedType = normalizeMediaType(fileInfo.getFileType());
        if (!"FILE".equals(storedType)) {
            return storedType;
        }

        String name = StrUtil.blankToDefault(attachment.getFileName(), fileInfo.getOriginalName());
        if (StrUtil.isNotBlank(name)) {
            FileTypeEnum inferred = FileTypeEnum.getByFileName(name);
            String inferredType = normalizeMediaType(inferred.getCode());
            if (!"FILE".equals(inferredType)) {
                return inferredType;
            }
        }

        return "FILE";
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private String safeErrorMessage(String message) {
        if (StrUtil.isBlank(message)) {
            return "未知错误";
        }
        String normalized = message.replaceAll("[\\r\\n]+", " ").trim();
        String lowerMessage = normalized.toLowerCase();
        if (lowerMessage.contains("invalid token") || lowerMessage.contains("401")) {
            return "模型服务鉴权失败，请检查模型配置";
        }
        return normalized.length() > 120 ? normalized.substring(0, 120) + "..." : normalized;
    }

    private Throwable unwrapCompletionException(Throwable error) {
        Throwable current = error;
        while (current instanceof CompletionException && current.getCause() != null) {
            current = current.getCause();
        }
        if (current instanceof TimeoutException) {
            return new TimeoutException("图片视觉解析超过 " + imageAnalysisTimeoutSeconds + " 秒未返回，已降级为基于文本和附件元数据回答");
        }
        return current;
    }

    @Data
    @AllArgsConstructor
    public static class MultimodalPrompt {
        private String displayContent;
        private String rawContent;
        private String modelText;
        private String messageType;
        private List<AiChatAttachmentDTO> attachments;
    }
}

package org.example.springboot.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.springboot.dto.command.AiChatAttachmentDTO;
import org.example.springboot.dto.command.AiChatConversationStateDTO;
import org.example.springboot.dto.command.AiChatMessageSnapshotDTO;
import org.example.springboot.entity.AiChatMessage;
import org.example.springboot.entity.AiChatMessageAttachment;
import org.example.springboot.entity.AiChatSession;
import org.example.springboot.entity.VisualAidProposal;
import org.example.springboot.mapper.AiChatMessageAttachmentMapper;
import org.example.springboot.mapper.AiChatMessageMapper;
import org.example.springboot.mapper.AiChatSessionMapper;
import org.example.springboot.mapper.VisualAidProposalMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * AI chat session management service.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiChatSessionService {

    private final AiChatSessionMapper sessionMapper;
    private final AiChatMessageMapper messageMapper;
    private final AiChatMessageAttachmentMapper attachmentMapper;
    private final VisualAidProposalMapper visualAidProposalMapper;
    private final ObjectMapper objectMapper;

    @Transactional
    public String createSession(Long userId, String title) {
        String sessionId = UUID.randomUUID().toString();

        AiChatSession session = AiChatSession.builder()
                .sessionId(sessionId)
                .userId(userId)
                .title(title != null ? title : "新对话")
                .status("ACTIVE")
                .build();

        sessionMapper.insert(session);
        log.info("Created AI chat session, sessionId: {}, userId: {}", sessionId, userId);

        return sessionId;
    }

    public String getOrCreateSession(Long userId, String title) {
        List<AiChatSession> sessions = getUserSessions(userId);
        if (!sessions.isEmpty()) {
            return sessions.get(0).getSessionId();
        }
        return createSession(userId, title);
    }

    public List<AiChatSession> getUserSessions(Long userId) {
        LambdaQueryWrapper<AiChatSession> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AiChatSession::getUserId, userId);
        wrapper.orderByDesc(AiChatSession::getUpdateTime);
        return sessionMapper.selectList(wrapper);
    }

    public AiChatSession getSessionById(String sessionId) {
        LambdaQueryWrapper<AiChatSession> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AiChatSession::getSessionId, sessionId);
        return sessionMapper.selectOne(wrapper);
    }

    public List<AiChatMessage> getSessionMessages(String sessionId) {
        LambdaQueryWrapper<AiChatMessage> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AiChatMessage::getSessionId, sessionId);
        wrapper.orderByAsc(AiChatMessage::getCreateTime);
        return messageMapper.selectList(wrapper);
    }

    @Transactional
    public void saveMessage(String sessionId, String role, String content) {
        saveMessage(sessionId, role, content, null);
    }

    @Transactional
    public AiChatMessage saveMessage(String sessionId, String role, String content, String clientMessageId) {
        AiChatMessage message = AiChatMessage.builder()
                .sessionId(sessionId)
                .role(role)
                .content(content)
                .messageType("TEXT")
                .rawContent(content)
                .processedContent(content)
                .clientMessageId(clientMessageId)
                .build();

        messageMapper.insert(message);
        log.debug("Saved AI chat message, sessionId: {}, role: {}", sessionId, role);
        return message;
    }

    @Transactional
    public AiChatMessage createGenerationMessages(String sessionId, String prompt, String taskId) {
        AiChatMessage userMessage = AiChatMessage.builder()
                .sessionId(sessionId)
                .role("user")
                .content(prompt)
                .messageType("MEDIA_GENERATION_REQUEST")
                .rawContent(prompt)
                .processedContent(prompt)
                .build();
        messageMapper.insert(userMessage);

        AiChatMessage assistantMessage = AiChatMessage.builder()
                .sessionId(sessionId)
                .role("assistant")
                .content("正在生成图片…")
                .messageType("MEDIA_GENERATION")
                .rawContent(prompt)
                .processedContent(taskId)
                .build();
        messageMapper.insert(assistantMessage);
        return assistantMessage;
    }

    @Transactional
    public void completeGenerationMessage(Long messageId, Long fileId, String filePath, Long fileSize, String taskId) {
        if (messageId == null) return;
        AiChatMessage message = messageMapper.selectById(messageId);
        if (message == null) return;
        message.setContent("图片已生成");
        message.setProcessedContent(taskId);
        messageMapper.updateById(message);

        AiChatMessageAttachment attachment = AiChatMessageAttachment.builder()
                .messageId(messageId)
                .fileId(fileId)
                .mediaType("IMAGE")
                .fileName("AI生成图片.png")
                .filePath(filePath)
                .mimeType("image/png")
                .fileSize(fileSize)
                .analysisStatus("DONE")
                .extractedMeta("{\"generationTaskId\":\"" + taskId + "\"}")
                .build();
        attachmentMapper.insert(attachment);
    }

    @Transactional
    public void failGenerationMessage(Long messageId, String taskId, String errorMessage) {
        if (messageId == null) return;
        AiChatMessage message = messageMapper.selectById(messageId);
        if (message == null) return;
        message.setContent("图片生成失败：" + errorMessage);
        message.setProcessedContent(taskId);
        messageMapper.updateById(message);
    }

    @Transactional
    public AiChatMessage saveUserMessage(
            String sessionId,
            String displayContent,
            String rawContent,
            String processedContent,
            String messageType,
            List<AiChatAttachmentDTO> attachments
    ) {
        return saveUserMessage(sessionId, displayContent, rawContent, processedContent, messageType, attachments, null);
    }

    @Transactional
    public AiChatMessage saveUserMessage(
            String sessionId,
            String displayContent,
            String rawContent,
            String processedContent,
            String messageType,
            List<AiChatAttachmentDTO> attachments,
            String clientMessageId
    ) {
        AiChatMessage message = AiChatMessage.builder()
                .sessionId(sessionId)
                .role("user")
                .content(displayContent)
                .messageType(messageType)
                .rawContent(rawContent)
                .processedContent(processedContent)
                .clientMessageId(clientMessageId)
                .build();

        messageMapper.insert(message);

        if (attachments != null) {
            for (AiChatAttachmentDTO attachment : attachments) {
                AiChatMessageAttachment entity = AiChatMessageAttachment.builder()
                        .messageId(message.getId())
                        .fileId(attachment.getFileId())
                        .mediaType(attachment.getMediaType())
                        .fileName(attachment.getFileName())
                        .filePath(attachment.getFilePath())
                        .mimeType(attachment.getMimeType())
                        .fileSize(attachment.getFileSize())
                        .analysisStatus(attachment.getAnalysisStatus())
                        .extractedText(attachment.getExtractedText())
                        .extractedMeta(attachment.getExtractedMeta())
                        .build();
                attachmentMapper.insert(entity);
            }
        }

        log.debug("Saved multimodal user message, sessionId: {}, type: {}, attachments: {}",
                sessionId, messageType, attachments == null ? 0 : attachments.size());
        return message;
    }

    public List<AiChatMessageAttachment> getMessageAttachments(Long messageId) {
        LambdaQueryWrapper<AiChatMessageAttachment> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AiChatMessageAttachment::getMessageId, messageId);
        wrapper.orderByAsc(AiChatMessageAttachment::getId);
        return attachmentMapper.selectList(wrapper);
    }

    @Transactional
    public void updateSessionTitle(String sessionId, String title) {
        LambdaQueryWrapper<AiChatSession> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AiChatSession::getSessionId, sessionId);

        AiChatSession session = sessionMapper.selectOne(wrapper);
        if (session != null) {
            session.setTitle(title);
            sessionMapper.updateById(session);
            log.info("Updated AI chat session title, sessionId: {}, title: {}", sessionId, title);
        }
    }

    @Transactional
    public void syncConversationState(String sessionId, AiChatConversationStateDTO state) {
        AiChatSession session = getSessionById(sessionId);
        if (session == null) return;
        if (state.getTitle() != null && !state.getTitle().isBlank()) session.setTitle(state.getTitle().trim());
        session.setSummary(blankToNull(state.getSummary()));
        session.setStatus(blankToDefault(state.getStatus(), "ACTIVE"));
        session.setCurrentArtifact(blankToNull(state.getCurrentArtifact()));
        session.setCurrentTrailNode(blankToNull(state.getCurrentTrailNode()));
        session.setActiveGuideState(writeJson(state.getActiveGuideState()));
        session.setContextJson(writeJson(state.getContext()));
        session.setLastVisualAidTask(blankToNull(state.getLastVisualAidTask()));
        sessionMapper.updateById(session);

        if (state.getMessages() != null) {
            for (AiChatMessageSnapshotDTO snapshot : state.getMessages()) {
                upsertMessageSnapshot(sessionId, snapshot);
            }
        }
    }

    @Transactional
    public AiChatMessage upsertMessageSnapshot(String sessionId, AiChatMessageSnapshotDTO snapshot) {
        AiChatMessage message = findMessageByClientId(sessionId, snapshot.getClientMessageId());
        if (message == null && snapshot.getGenerationTaskId() != null && !snapshot.getGenerationTaskId().isBlank()) {
            message = messageMapper.selectOne(new LambdaQueryWrapper<AiChatMessage>()
                    .eq(AiChatMessage::getSessionId, sessionId)
                    .eq(AiChatMessage::getProcessedContent, snapshot.getGenerationTaskId())
                    .last("LIMIT 1"));
        }
        if (message == null && "MEDIA_GENERATION_REQUEST".equals(snapshot.getMessageType())) {
            message = messageMapper.selectOne(new LambdaQueryWrapper<AiChatMessage>()
                    .eq(AiChatMessage::getSessionId, sessionId)
                    .eq(AiChatMessage::getRole, "user")
                    .eq(AiChatMessage::getMessageType, "MEDIA_GENERATION_REQUEST")
                    .eq(AiChatMessage::getContent, snapshot.getContent())
                    .isNull(AiChatMessage::getClientMessageId)
                    .orderByDesc(AiChatMessage::getCreateTime)
                    .last("LIMIT 1"));
        }
        boolean insert = message == null;
        if (insert) {
            message = new AiChatMessage();
            message.setSessionId(sessionId);
        }
        message.setClientMessageId(snapshot.getClientMessageId());
        message.setRole(snapshot.getRole());
        message.setContent(snapshot.getContent());
        message.setMessageType(blankToDefault(snapshot.getMessageType(), "TEXT"));
        message.setRawContent(snapshot.getContent());
        message.setProcessedContent(snapshot.getGenerationTaskId() == null
                ? snapshot.getContent() : snapshot.getGenerationTaskId());
        message.setTraceJson(writeJson(snapshot.getTrace()));
        message.setReferencesJson(writeJson(snapshot.getReferences()));
        message.setUiPayload(writeJson(snapshot.getUiPayload()));
        if (insert) messageMapper.insert(message);
        else messageMapper.updateById(message);
        return message;
    }

    public AiChatMessage findMessageByClientId(String sessionId, String clientMessageId) {
        if (clientMessageId == null || clientMessageId.isBlank()) return null;
        return messageMapper.selectOne(new LambdaQueryWrapper<AiChatMessage>()
                .eq(AiChatMessage::getSessionId, sessionId)
                .eq(AiChatMessage::getClientMessageId, clientMessageId)
                .last("LIMIT 1"));
    }

    public Map<String, Object> readMap(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception ignored) {
            return null;
        }
    }

    public List<Map<String, Object>> readList(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception ignored) {
            return List.of();
        }
    }

    @Transactional
    public void deleteSession(String sessionId) {
        LambdaQueryWrapper<AiChatSession> sessionWrapper = new LambdaQueryWrapper<>();
        sessionWrapper.eq(AiChatSession::getSessionId, sessionId);
        sessionMapper.delete(sessionWrapper);

        LambdaQueryWrapper<AiChatMessage> messageWrapper = new LambdaQueryWrapper<>();
        messageWrapper.eq(AiChatMessage::getSessionId, sessionId);
        List<AiChatMessage> messages = messageMapper.selectList(messageWrapper);
        for (AiChatMessage message : messages) {
            LambdaQueryWrapper<AiChatMessageAttachment> attachmentWrapper = new LambdaQueryWrapper<>();
            attachmentWrapper.eq(AiChatMessageAttachment::getMessageId, message.getId());
            attachmentMapper.delete(attachmentWrapper);
        }
        messageMapper.delete(messageWrapper);

        visualAidProposalMapper.delete(new LambdaQueryWrapper<VisualAidProposal>()
                .eq(VisualAidProposal::getSessionId, sessionId));

        log.info("Deleted AI chat session, sessionId: {}", sessionId);
    }

    public boolean isSessionOwnedByUser(String sessionId, Long userId) {
        AiChatSession session = getSessionById(sessionId);
        return session != null && session.getUserId() != null && session.getUserId().equals(userId);
    }

    private String writeJson(Object value) {
        if (value == null) return null;
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception error) {
            throw new IllegalArgumentException("会话状态序列化失败", error);
        }
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String blankToDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim().toUpperCase();
    }
}

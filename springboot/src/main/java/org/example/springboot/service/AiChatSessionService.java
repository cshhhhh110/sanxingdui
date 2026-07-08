package org.example.springboot.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.springboot.dto.command.AiChatAttachmentDTO;
import org.example.springboot.entity.AiChatMessage;
import org.example.springboot.entity.AiChatMessageAttachment;
import org.example.springboot.entity.AiChatSession;
import org.example.springboot.mapper.AiChatMessageAttachmentMapper;
import org.example.springboot.mapper.AiChatMessageMapper;
import org.example.springboot.mapper.AiChatSessionMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
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

    @Transactional
    public String createSession(Long userId, String title) {
        String sessionId = UUID.randomUUID().toString();

        AiChatSession session = AiChatSession.builder()
                .sessionId(sessionId)
                .userId(userId)
                .title(title != null ? title : "新对话")
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
        AiChatMessage message = AiChatMessage.builder()
                .sessionId(sessionId)
                .role(role)
                .content(content)
                .messageType("TEXT")
                .rawContent(content)
                .processedContent(content)
                .build();

        messageMapper.insert(message);
        log.debug("Saved AI chat message, sessionId: {}, role: {}", sessionId, role);
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
        AiChatMessage message = AiChatMessage.builder()
                .sessionId(sessionId)
                .role("user")
                .content(displayContent)
                .messageType(messageType)
                .rawContent(rawContent)
                .processedContent(processedContent)
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

        log.info("Deleted AI chat session, sessionId: {}", sessionId);
    }

    public boolean isSessionOwnedByUser(String sessionId, Long userId) {
        AiChatSession session = getSessionById(sessionId);
        return session != null && session.getUserId().equals(userId);
    }
}

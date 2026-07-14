package org.example.springboot.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.example.springboot.dto.command.ConfirmVisualAidProposalDTO;
import org.example.springboot.dto.command.CreateImageGenerationDTO;
import org.example.springboot.dto.command.CreateVisualAidProposalDTO;
import org.example.springboot.dto.command.GenerationExperienceContextDTO;
import org.example.springboot.dto.response.MediaGenerationTaskVO;
import org.example.springboot.dto.response.VisualAidProposalResponseDTO;
import org.example.springboot.entity.VisualAidProposal;
import org.example.springboot.exception.BusinessException;
import org.example.springboot.mapper.VisualAidProposalMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VisualAidProposalService {
    private static final Set<String> PURPOSES = Set.of(
            "CULTURAL_RECONSTRUCTION", "CULTURAL_ILLUSTRATION", "GUIDE_SUPPORT");

    private final VisualAidProposalMapper mapper;
    private final AiChatSessionService chatSessionService;
    private final MediaGenerationService mediaGenerationService;
    private final ObjectMapper objectMapper;

    @Transactional
    public VisualAidProposalResponseDTO create(CreateVisualAidProposalDTO command, Long userId) {
        if (!chatSessionService.isSessionOwnedByUser(command.getSessionId(), userId)) {
            throw new BusinessException("无权访问此探索会话");
        }
        VisualAidProposal existing = mapper.selectOne(new LambdaQueryWrapper<VisualAidProposal>()
                .eq(VisualAidProposal::getSessionId, command.getSessionId())
                .eq(VisualAidProposal::getMessageId, command.getMessageId())
                .in(VisualAidProposal::getStatus, "PROPOSED", "CONFIRMED")
                .orderByDesc(VisualAidProposal::getCreateTime)
                .last("LIMIT 1"));
        if (existing != null) return toResponse(existing);

        String purpose = normalizePurpose(command.getPurpose());
        VisualAidProposal proposal = new VisualAidProposal();
        proposal.setProposalId(UUID.randomUUID().toString());
        proposal.setUserId(userId);
        proposal.setSessionId(command.getSessionId());
        proposal.setMessageId(command.getMessageId());
        proposal.setArtifactId(trim(command.getArtifactId()));
        proposal.setArtifactName(trim(command.getArtifactName()));
        proposal.setTitle(command.getTitle().trim());
        proposal.setReason(command.getReason().trim());
        proposal.setPrompt(command.getPrompt().trim());
        proposal.setPurpose(purpose);
        proposal.setContentLabel(command.getContentLabel() == null || command.getContentLabel().isBlank()
                ? "AI_ILLUSTRATION" : command.getContentLabel().trim().toUpperCase(Locale.ROOT));
        proposal.setKnowledgeFocus(writeJson(command.getKnowledgeFocus()));
        proposal.setSourceReferences(writeJson(command.getSourceReferences()));
        proposal.setStatus("PROPOSED");
        proposal.setExpiresAt(LocalDateTime.now().plusHours(24));
        mapper.insert(proposal);
        return toResponse(proposal);
    }

    @Transactional
    public VisualAidProposalResponseDTO dismiss(String proposalId, Long userId) {
        VisualAidProposal proposal = requireOwned(proposalId, userId);
        if ("PROPOSED".equals(proposal.getStatus())) {
            proposal.setStatus("DISMISSED");
            mapper.updateById(proposal);
        }
        return toResponse(proposal);
    }

    @Transactional
    public synchronized MediaGenerationTaskVO confirm(
            String proposalId,
            ConfirmVisualAidProposalDTO command,
            Long userId
    ) {
        VisualAidProposal proposal = requireOwned(proposalId, userId);
        expireIfNeeded(proposal);
        if ("CONFIRMED".equals(proposal.getStatus()) && proposal.getGenerationTaskId() != null) {
            return mediaGenerationService.getTask(proposal.getGenerationTaskId(), userId);
        }
        if (!"PROPOSED".equals(proposal.getStatus())) {
            throw new BusinessException("这条视觉辅助建议已失效，请重新提问后再生成");
        }

        CreateImageGenerationDTO generation = new CreateImageGenerationDTO();
        generation.setPrompt(proposal.getPrompt());
        generation.setMode("TEXT_TO_IMAGE");
        generation.setStyle("MUSEUM_POSTER");
        generation.setAspectRatio("1:1");
        generation.setCount(1);
        generation.setNegativePrompt("文字乱码，水印，低清晰度，主体变形，伪造考古证据");
        generation.setSessionId(proposal.getSessionId());
        generation.setModelProfile("FAST");
        generation.setClientRequestId("va-" + proposal.getProposalId());

        GenerationExperienceContextDTO context = new GenerationExperienceContextDTO();
        context.setSurface("AI_CHAT");
        context.setScene("GUIDE_EXPERIENCE");
        context.setSessionId(proposal.getSessionId());
        context.setMessageId(proposal.getMessageId());
        context.setProposalId(proposal.getProposalId());
        context.setArtifactId(proposal.getArtifactId());
        context.setPurpose("GUIDE_SUPPORT");
        generation.setExperienceContext(context);

        MediaGenerationTaskVO task = mediaGenerationService.createImageTask(generation, userId);
        proposal.setStatus("CONFIRMED");
        proposal.setClientRequestId(command.getClientRequestId());
        proposal.setGenerationTaskId(task.getTaskId());
        mapper.updateById(proposal);
        return task;
    }

    public VisualAidProposalResponseDTO get(String proposalId, Long userId) {
        VisualAidProposal proposal = requireOwned(proposalId, userId);
        expireIfNeeded(proposal);
        return toResponse(proposal);
    }

    private VisualAidProposal requireOwned(String proposalId, Long userId) {
        VisualAidProposal proposal = mapper.selectOne(new LambdaQueryWrapper<VisualAidProposal>()
                .eq(VisualAidProposal::getProposalId, proposalId)
                .eq(VisualAidProposal::getUserId, userId)
                .last("LIMIT 1"));
        if (proposal == null) throw new BusinessException("视觉辅助建议不存在或无权访问");
        return proposal;
    }

    private void expireIfNeeded(VisualAidProposal proposal) {
        if ("PROPOSED".equals(proposal.getStatus()) && proposal.getExpiresAt() != null
                && proposal.getExpiresAt().isBefore(LocalDateTime.now())) {
            proposal.setStatus("EXPIRED");
            mapper.updateById(proposal);
        }
    }

    private VisualAidProposalResponseDTO toResponse(VisualAidProposal proposal) {
        return VisualAidProposalResponseDTO.builder()
                .proposalId(proposal.getProposalId())
                .sessionId(proposal.getSessionId())
                .messageId(proposal.getMessageId())
                .artifactId(proposal.getArtifactId())
                .artifactName(proposal.getArtifactName())
                .title(proposal.getTitle())
                .reason(proposal.getReason())
                .prompt(proposal.getPrompt())
                .purpose(proposal.getPurpose())
                .contentLabel(proposal.getContentLabel())
                .knowledgeFocus(readList(proposal.getKnowledgeFocus(), new TypeReference<List<String>>() {}))
                .sourceReferences(readList(proposal.getSourceReferences(), new TypeReference<List<Map<String, Object>>>() {}))
                .status(proposal.getStatus())
                .generationTaskId(proposal.getGenerationTaskId())
                .expiresAt(proposal.getExpiresAt())
                .createdAt(proposal.getCreateTime())
                .build();
    }

    private String normalizePurpose(String purpose) {
        String value = purpose == null || purpose.isBlank() ? "GUIDE_SUPPORT" : purpose.trim().toUpperCase(Locale.ROOT);
        if (!PURPOSES.contains(value)) throw new BusinessException("不支持的视觉辅助用途");
        return value;
    }

    private String writeJson(Object value) {
        if (value == null) return null;
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception error) {
            throw new BusinessException("视觉辅助数据序列化失败");
        }
    }

    private <T> T readList(String json, TypeReference<T> type) {
        if (json == null || json.isBlank()) {
            try {
                return objectMapper.readValue("[]", type);
            } catch (Exception ignored) {
                return null;
            }
        }
        try {
            return objectMapper.readValue(json, type);
        } catch (Exception ignored) {
            return null;
        }
    }

    private String trim(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}

package org.example.springboot.service;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.springboot.dto.command.AiChatConversationStateDTO;
import org.example.springboot.dto.command.AiChatMessageSnapshotDTO;
import org.example.springboot.entity.AiChatMessage;
import org.example.springboot.entity.AiChatSession;
import org.example.springboot.mapper.AiChatMessageAttachmentMapper;
import org.example.springboot.mapper.AiChatMessageMapper;
import org.example.springboot.mapper.AiChatSessionMapper;
import org.example.springboot.mapper.VisualAidProposalMapper;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AiChatSessionStateServiceTest {

    @Test
    void deletingConversationAlsoRemovesVisualAidProposals() {
        AiChatSessionMapper sessionMapper = mock(AiChatSessionMapper.class);
        AiChatMessageMapper messageMapper = mock(AiChatMessageMapper.class);
        AiChatMessageAttachmentMapper attachmentMapper = mock(AiChatMessageAttachmentMapper.class);
        VisualAidProposalMapper visualAidProposalMapper = mock(VisualAidProposalMapper.class);
        when(messageMapper.selectList(any(Wrapper.class))).thenReturn(List.of());
        AiChatSessionService service = new AiChatSessionService(
                sessionMapper, messageMapper, attachmentMapper, visualAidProposalMapper, new ObjectMapper());

        service.deleteSession("session-delete");

        verify(visualAidProposalMapper).delete(any(Wrapper.class));
    }

    @Test
    void syncPersistsExplorationContextAndStructuredMessage() {
        AiChatSessionMapper sessionMapper = mock(AiChatSessionMapper.class);
        AiChatMessageMapper messageMapper = mock(AiChatMessageMapper.class);
        AiChatMessageAttachmentMapper attachmentMapper = mock(AiChatMessageAttachmentMapper.class);
        VisualAidProposalMapper visualAidProposalMapper = mock(VisualAidProposalMapper.class);
        AiChatSession session = new AiChatSession();
        session.setId(1L);
        session.setSessionId("session-1");
        session.setUserId(7L);
        when(sessionMapper.selectOne(any(Wrapper.class))).thenReturn(session);
        when(messageMapper.selectOne(any(Wrapper.class))).thenReturn(null);

        AiChatSessionService service = new AiChatSessionService(
                sessionMapper, messageMapper, attachmentMapper, visualAidProposalMapper, new ObjectMapper());
        AiChatConversationStateDTO state = new AiChatConversationStateDTO();
        state.setTitle("青铜神树探索");
        state.setSummary("理解古蜀宇宙观");
        state.setStatus("ACTIVE");
        state.setCurrentArtifact("青铜神树");
        state.setCurrentTrailNode("玄喵讲解");
        state.setActiveGuideState(Map.of("routeId", "guide-20", "currentNode", 1));
        state.setContext(Map.of(
                "currentArtifact", "青铜神树",
                "recentMessages", List.of(Map.of("role", "user", "content", "为什么重要"))));
        state.setLastVisualAidTask("task-1");

        AiChatMessageSnapshotDTO message = new AiChatMessageSnapshotDTO();
        message.setClientMessageId("assistant-1");
        message.setRole("assistant");
        message.setContent("青铜神树连接了天地想象。 ");
        message.setMessageType("TEXT");
        message.setTrace(Map.of("route", "RAG"));
        message.setReferences(List.of(Map.of("title", "青铜神树研究资料")));
        message.setUiPayload(Map.of("streamArchived", true));
        state.setMessages(List.of(message));

        service.syncConversationState("session-1", state);

        assertThat(session.getCurrentArtifact()).isEqualTo("青铜神树");
        assertThat(session.getLastVisualAidTask()).isEqualTo("task-1");
        assertThat(service.readMap(session.getContextJson()).get("currentArtifact")).isEqualTo("青铜神树");
        ArgumentCaptor<AiChatMessage> messageCaptor = ArgumentCaptor.forClass(AiChatMessage.class);
        verify(messageMapper).insert(messageCaptor.capture());
        AiChatMessage saved = messageCaptor.getValue();
        assertThat(saved.getClientMessageId()).isEqualTo("assistant-1");
        assertThat(saved.getTraceJson()).contains("RAG");
        assertThat(saved.getReferencesJson()).contains("青铜神树研究资料");
    }
}

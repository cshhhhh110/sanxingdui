package org.example.springboot.service;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.springboot.dto.command.ConfirmVisualAidProposalDTO;
import org.example.springboot.dto.command.CreateVisualAidProposalDTO;
import org.example.springboot.dto.response.MediaGenerationTaskVO;
import org.example.springboot.entity.VisualAidProposal;
import org.example.springboot.exception.BusinessException;
import org.example.springboot.mapper.VisualAidProposalMapper;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class VisualAidProposalServiceTest {

    @Test
    void proposalIsFreeAndConfirmationCreatesExactlyOneTask() {
        VisualAidProposalMapper mapper = mock(VisualAidProposalMapper.class);
        AiChatSessionService sessions = mock(AiChatSessionService.class);
        MediaGenerationService generation = mock(MediaGenerationService.class);
        AtomicReference<VisualAidProposal> stored = new AtomicReference<>();

        when(sessions.isSessionOwnedByUser("session-1", 7L)).thenReturn(true);
        when(mapper.selectOne(any(Wrapper.class))).thenAnswer(invocation -> stored.get());
        when(mapper.insert(any(VisualAidProposal.class))).thenAnswer(invocation -> {
            VisualAidProposal value = invocation.getArgument(0);
            value.setId(1L);
            value.setCreateTime(LocalDateTime.now());
            stored.set(value);
            return 1;
        });
        when(mapper.updateById(any(VisualAidProposal.class))).thenAnswer(invocation -> {
            stored.set(invocation.getArgument(0));
            return 1;
        });
        MediaGenerationTaskVO task = new MediaGenerationTaskVO();
        task.setTaskId("task-1");
        task.setStatus("PENDING");
        when(generation.createImageTask(any(), anyLong())).thenReturn(task);
        when(generation.getTask("task-1", 7L)).thenReturn(task);

        VisualAidProposalService service = new VisualAidProposalService(
                mapper, sessions, generation, new ObjectMapper());
        CreateVisualAidProposalDTO create = proposalCommand();

        var proposal = service.create(create, 7L);
        assertThat(proposal.getStatus()).isEqualTo("PROPOSED");
        verify(generation, never()).createImageTask(any(), anyLong());

        ConfirmVisualAidProposalDTO confirm = new ConfirmVisualAidProposalDTO();
        confirm.setClientRequestId("confirm-once");
        MediaGenerationTaskVO first = service.confirm(proposal.getProposalId(), confirm, 7L);
        MediaGenerationTaskVO second = service.confirm(proposal.getProposalId(), confirm, 7L);

        assertThat(first.getTaskId()).isEqualTo("task-1");
        assertThat(second.getTaskId()).isEqualTo("task-1");
        assertThat(stored.get().getStatus()).isEqualTo("CONFIRMED");
        verify(generation, times(1)).createImageTask(any(), anyLong());
    }

    @Test
    void foreignSessionCannotCreateProposal() {
        VisualAidProposalMapper mapper = mock(VisualAidProposalMapper.class);
        AiChatSessionService sessions = mock(AiChatSessionService.class);
        MediaGenerationService generation = mock(MediaGenerationService.class);
        when(sessions.isSessionOwnedByUser(anyString(), anyLong())).thenReturn(false);
        VisualAidProposalService service = new VisualAidProposalService(
                mapper, sessions, generation, new ObjectMapper());

        assertThatThrownBy(() -> service.create(proposalCommand(), 8L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("无权");
        verify(mapper, never()).insert(any(VisualAidProposal.class));
    }

    private CreateVisualAidProposalDTO proposalCommand() {
        CreateVisualAidProposalDTO command = new CreateVisualAidProposalDTO();
        command.setSessionId("session-1");
        command.setMessageId("message-1");
        command.setArtifactId("HI-2025-006");
        command.setArtifactName("青铜神树");
        command.setTitle("生成青铜神树视觉辅助示意图");
        command.setReason("帮助理解天地连接与祭祀体系");
        command.setPrompt("基于考古资料生成青铜神树祭祀场景辅助示意图");
        command.setPurpose("GUIDE_SUPPORT");
        command.setKnowledgeFocus(List.of("天地连接", "祭祀体系"));
        command.setSourceReferences(List.of(Map.of("title", "青铜神树研究资料")));
        return command;
    }
}

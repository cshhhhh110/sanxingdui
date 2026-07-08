package org.example.springboot.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.springboot.dto.command.AiChatAttachmentDTO;
import org.example.springboot.service.AiChatSessionService;
import org.example.springboot.service.MultimodalContentService;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.List;

/**
 * Sanxingdui heritage assistant AI service.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class HeritageAssistantService {

    @Qualifier("open-ai")
    private final ChatClient chatClient;

    @Autowired
    private ChatMemory chatMemory;

    @Autowired
    private AiChatSessionService sessionService;

    @Autowired
    private MultimodalContentService multimodalContentService;

    public Flux<String> chatStream(String sessionId, String userMessage) {
        return chatStream(sessionId, userMessage, null);
    }

    public Flux<String> chatStream(String sessionId, String userMessage, List<AiChatAttachmentDTO> attachments) {
        MultimodalContentService.MultimodalPrompt prompt =
                multimodalContentService.buildPrompt(userMessage, attachments);

        log.info("Start AI chat stream, sessionId: {}, messageType: {}", sessionId, prompt.getMessageType());

        sessionService.saveUserMessage(
                sessionId,
                prompt.getDisplayContent(),
                prompt.getRawContent(),
                prompt.getModelText(),
                prompt.getMessageType(),
                prompt.getAttachments()
        );

        Flux<String> responseFlux = chatClient.prompt()
                .system(PromptManage.HERITAGE_ASSISTANT_PROMPT)
                .user(prompt.getModelText())
                .advisors(advisorSpec -> advisorSpec
                        .param(ChatMemory.CONVERSATION_ID, sessionId))
                .stream()
                .content();

        StringBuilder fullResponse = new StringBuilder();
        return responseFlux
                .doOnNext(fullResponse::append)
                .doOnComplete(() -> {
                    String assistantMessage = fullResponse.toString();
                    sessionService.saveMessage(sessionId, "assistant", assistantMessage);
                    log.info("AI chat stream completed, sessionId: {}, responseLength: {}",
                            sessionId, assistantMessage.length());
                })
                .doOnError(error -> log.error("AI chat stream failed, sessionId: {}", sessionId, error));
    }

    public String chat(String sessionId, String userMessage) {
        return chat(sessionId, userMessage, null);
    }

    public String chat(String sessionId, String userMessage, List<AiChatAttachmentDTO> attachments) {
        MultimodalContentService.MultimodalPrompt prompt =
                multimodalContentService.buildPrompt(userMessage, attachments);

        log.info("Start AI chat, sessionId: {}, messageType: {}", sessionId, prompt.getMessageType());

        sessionService.saveUserMessage(
                sessionId,
                prompt.getDisplayContent(),
                prompt.getRawContent(),
                prompt.getModelText(),
                prompt.getMessageType(),
                prompt.getAttachments()
        );

        try {
            String assistantMessage = chatClient.prompt()
                    .system(PromptManage.HERITAGE_ASSISTANT_PROMPT)
                    .user(prompt.getModelText())
                    .advisors(advisorSpec -> advisorSpec
                            .param(ChatMemory.CONVERSATION_ID, sessionId))
                    .call()
                    .content();

            sessionService.saveMessage(sessionId, "assistant", assistantMessage);
            log.info("AI chat completed, sessionId: {}, responseLength: {}",
                    sessionId, assistantMessage.length());

            return assistantMessage;
        } catch (Exception e) {
            log.error("AI chat failed, sessionId: {}", sessionId, e);
            throw new RuntimeException("AI服务调用失败: " + e.getMessage(), e);
        }
    }
}

package org.example.springboot.websocket;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONObject;
import lombok.extern.slf4j.Slf4j;
import org.example.springboot.ai.HeritageAssistantService;
import org.example.springboot.service.AiChatSessionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import jakarta.websocket.*;
import jakarta.websocket.server.PathParam;
import jakarta.websocket.server.ServerEndpoint;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * AI聊天WebSocket端点
 * 前端连接路径: /websocket/{userId}
 * @author system
 */
@Slf4j
@Component
@ServerEndpoint("/websocket/{userId}")
public class AiChatWebSocket {

    /**
     * 存储所有在线用户的WebSocket连接
     * key: userId, value: Session
     */
    private static final Map<String, Session> SESSION_MAP = new ConcurrentHashMap<>();

    /**
     * 静态变量注入Spring Bean
     */
    private static HeritageAssistantService heritageAssistantService;
    private static AiChatSessionService aiChatSessionService;

    @Autowired
    public void setHeritageAssistantService(HeritageAssistantService heritageAssistantService) {
        AiChatWebSocket.heritageAssistantService = heritageAssistantService;
    }

    @Autowired
    public void setAiChatSessionService(AiChatSessionService aiChatSessionService) {
        AiChatWebSocket.aiChatSessionService = aiChatSessionService;
    }

    /**
     * 连接建立成功调用
     */
    @OnOpen
    public void onOpen(Session session, @PathParam("userId") String userId) {
        SESSION_MAP.put(userId, session);
        log.info("WebSocket连接建立成功，userId: {}", userId);
    }

    /**
     * 连接关闭调用
     */
    @OnClose
    public void onClose(Session session, @PathParam("userId") String userId) {
        SESSION_MAP.remove(userId);
        log.info("WebSocket连接关闭，userId: {}", userId);
    }

    /**
     * 收到客户端消息后调用
     */
    @OnMessage
    public void onMessage(String message, @PathParam("userId") String userId) {
        log.info("收到用户消息，userId: {}, message: {}", userId, message);

        try {
            JSONObject json = JSON.parseObject(message);
            String content = json.getString("content");
            String chatType = json.getString("chatType");

            if (content == null || content.trim().isEmpty()) {
                sendError(userId, "消息内容不能为空");
                return;
            }

            // 创建或使用现有会话
            String sessionId = aiChatSessionService.getOrCreateSession(Long.parseLong(userId), null);

            // 调用AI服务获取流式响应
            heritageAssistantService.chatStream(sessionId, content)
                    .doOnNext(chunk -> {
                        try {
                            sendText(userId, buildMessageJson(chunk, false));
                        } catch (Exception e) {
                            log.error("发送消息失败", e);
                        }
                    })
                    .doOnComplete(() -> {
                        try {
                            sendText(userId, buildCompleteJson());
                        } catch (Exception e) {
                            log.error("发送完成消息失败", e);
                        }
                    })
                    .doOnError(error -> {
                        log.error("AI服务调用失败", error);
                        sendError(userId, "AI服务调用失败: " + error.getMessage());
                    })
                    .subscribe();

        } catch (Exception e) {
            log.error("处理消息失败", e);
            sendError(userId, "处理消息失败: " + e.getMessage());
        }
    }

    /**
     * 发生错误时调用
     */
    @OnError
    public void onError(Session session, Throwable error, @PathParam("userId") String userId) {
        log.error("WebSocket发生错误，userId: {}", userId, error);
    }

    /**
     * 发送文本消息
     */
    private void sendText(String userId, String message) throws IOException {
        Session session = SESSION_MAP.get(userId);
        if (session != null && session.isOpen()) {
            session.getBasicRemote().sendText(message);
        }
    }

    /**
     * 发送错误消息
     */
    private void sendError(String userId, String errorMsg) {
        try {
            JSONObject error = new JSONObject();
            error.put("error", errorMsg);
            sendText(userId, error.toJSONString());
        } catch (Exception e) {
            log.error("发送错误消息失败", e);
        }
    }

    /**
     * 构建流式消息JSON
     */
    private String buildMessageJson(String content, boolean isComplete) {
        JSONObject json = new JSONObject();
        JSONObject textObj = new JSONObject();
        textObj.put("content", content);
        json.put("text", new Object[]{textObj});
        json.put("status", isComplete ? 2 : 0);
        return json.toJSONString();
    }

    /**
     * 构建完成消息JSON
     */
    private String buildCompleteJson() {
        JSONObject json = new JSONObject();
        json.put("status", 2);
        return json.toJSONString();
    }

    /**
     * 发送消息给指定用户（静态方法供外部调用）
     */
    public static void sendMessage(String userId, String message) {
        try {
            Session session = SESSION_MAP.get(userId);
            if (session != null && session.isOpen()) {
                session.getBasicRemote().sendText(message);
            }
        } catch (IOException e) {
            log.error("发送消息失败，userId: {}", userId, e);
        }
    }
}

package com.example.xunfeitest.demos.web;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.example.xunfeitest.demos.web.config.SparkApiConfig;
import com.example.xunfeitest.demos.web.dto.SparkDto;
import com.example.xunfeitest.demos.web.dto.SparkParamDto;
import okhttp3.*;
import org.jetbrains.annotations.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import javax.websocket.*;
import javax.websocket.server.PathParam;
import javax.websocket.server.ServerEndpoint;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * @author qfy
 * @date Created in 2024/6/7 16:43
 * @entity
 * @controller
 * @tableName
 * @service
 * @mapper
 * @description
 */

/**
 * websocket操作类
 */
@Component
@ServerEndpoint("/websocket/{userId}")
public class WebSocketServer {

    /**
     * 日志工具
     */
    private final Logger logger = LoggerFactory.getLogger(this.getClass());
    /**
     * 与某个客户端的连接会话，需要通过它来给客户端发送数据
     */
    private Session session;
    /**
     * 用户id
     */
    private String userId;
    /**
     * 用来存放每个客户端对应的MyWebSocket对象
     */
    private static final CopyOnWriteArraySet<WebSocketServer> webSockets = new CopyOnWriteArraySet<>();

    /**
     * 用来存在线连接用户信息
     */
    private static final ConcurrentHashMap<String, Session> sessionPool = new ConcurrentHashMap<>();


    /**
     * 链接成功调用的方法
     */
    @OnOpen
    public void onOpen(Session session, @PathParam(value = "userId") String userId) {
        try {
            this.session = session;
            this.userId = userId;
            webSockets.add(this);
            //session池里存入当前用户的id 和session信息
            sessionPool.put(userId, session);
            logger.info("【websocket消息】有新的连接，总数为:" + webSockets.size());
        } catch (Exception ignored) {
        }
    }

    /**
     * 链接关闭调用的方法
     */
    @OnClose
    public void onClose() {
        try {
            webSockets.remove(this);
            sessionPool.remove(this.userId);
            logger.info("【websocket消息】连接断开，总数为:" + webSockets.size());
        } catch (Exception ignored) {
        }
    }

    /**
     * 收到客户端消息后调用的方法
     * message :前端发送的消息
     * 格式 {"content":"你好","userId":"123","type":"spark","historyId":null,"chatType":"spaark"}
     */
    @OnMessage
    public void onMessage(String message) {
        try {
            logger.info("收到客户端消息: " + message);
            SparkParamDto sparkParam = JSON.parseObject(message, SparkParamDto.class);
            if (Objects.equals(sparkParam.getType(), "spark")) {
                getSparkApiChat(sparkParam);
            }
        } catch (Exception e) {
            logger.error("处理消息时发生错误", e);
            sendErrorMessage(userId, "处理消息时发生错误: " + e.getMessage());
        }
    }

    /**
     * 发送错误时的处理
     *  session
     *  error
     */
    @OnError
    public void onError(Session session, Throwable error) {
        logger.error("用户错误,原因:" + error.getMessage());
        error.printStackTrace();
    }


    /**
     * 此为广播消息
     * 向指定用户推送消息
     */
    public boolean sendMessageToUser(String userId, String message) {
        //logger.info("【websocket消息】向用户" + userId + "发送消息：" + message);
        AtomicBoolean pass= new AtomicBoolean(false);
        Session session = sessionPool.get(userId);
        if (session != null && session.isOpen()) {
            try {
                pass.set(true);
                session.getAsyncRemote().sendText(message);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        return pass.get();
    }


    /**
     * 此为单点消息
     * 给客户端发消息
     */
    public void sendOneMessage(String userId, String message) {
        Session session = sessionPool.get(userId);
        if (session != null && session.isOpen()) {
            try {
                session.getAsyncRemote().sendText(message);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    /**
     * 发送错误消息给客户端
     */
    private void sendErrorMessage(String userId, String errorMessage) {
        JSONObject errorObj = new JSONObject();
        JSONObject choicesObj = new JSONObject();
        JSONArray textArray = new JSONArray();
        JSONObject textObj = new JSONObject();

        textObj.put("content", "⚠️ " + errorMessage);
        textArray.add(textObj);
        choicesObj.put("text", textArray);
        choicesObj.put("status", 2);  // 表示结束
        errorObj.put("choices", choicesObj);

        sendOneMessage(userId, JSON.toJSONString(errorObj));
    }

    /**
     * 此为单点消息(多人)
     * 暂时没有使用这个方法
     */
    public void sendMoreMessage(String[] userIds, String message) {
        for (String userId : userIds) {
            Session session = sessionPool.get(userId);
            if (session != null && session.isOpen()) {
                try {
                    logger.info("【websocket消息】 单点消息:" + message);
                    session.getAsyncRemote().sendText(message);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }
    }

    /**
     * 讯飞星火请求chat聊天
     * @param sparkParam
     */
    public void getSparkApiChat(SparkParamDto sparkParam) {
        try {
            logger.info("开始调用星火API，appId: {}, apiKey: {}, 请求内容: {}",
                    SparkApiConfig.getAppId1(),
                    SparkApiConfig.getApiKey1().substring(0, 4) + "****",
                    sparkParam.getContent());

            // 构建鉴权url
            String authUrl = getAuthUrl(
                    SparkApiConfig.getHostUrl1(),
                    SparkApiConfig.getApiKey1(),
                    SparkApiConfig.getApiSecret1());

            OkHttpClient client = new OkHttpClient.Builder()
                    .connectTimeout(30, TimeUnit.SECONDS)
                    .readTimeout(30, TimeUnit.SECONDS)
                    .writeTimeout(30, TimeUnit.SECONDS)
                    .build();

            //将鉴权url替换成 ws协议的url
            String url = authUrl.toString().replace("http://", "ws://").replace("https://", "wss://");

            logger.info("WebSocket URL: {}", url);

            Request request = new Request.Builder()
                    .url(url)
                    .header("Content-Type", "application/json") // 设置Content-Type
                    .build();

            //构建官方对应格式的请求参数
            String body = getSparkJson(SparkApiConfig.getAppId1(), sparkParam);
            logger.info("请求参数: {}", body);

            CompletableFuture<String> messageReceived = new CompletableFuture<>();

            //WebSocket 初始化 ，向讯飞服务器发送请求
            WebSocket webSocket = client.newWebSocket(request, new WebSocketListener(){
                @Override
                public void onOpen(WebSocket webSocket, Response response) {
                    logger.info("讯飞API WebSocket连接已打开");
                    //body 即为处理好的符合官网需求的 请求参数
                    //向讯飞服务端发送消息
                    webSocket.send(body);
                }
                /*
                 * res: 讯飞服务器响应的结果，类型为 String。
                 * webSocket: 当前的 WebSocket 对象。
                 * */
                @Override
                public void onMessage(WebSocket webSocket, @NotNull String res) {
                    try {
                        JSONObject obj = JSON.parseObject(res);
                        logger.info("收到讯飞API响应: {}", res);

                        // 检查是否有错误
                        if (obj.containsKey("header") && obj.getJSONObject("header").containsKey("code")) {
                            int code = obj.getJSONObject("header").getIntValue("code");
                            if (code != 0) {
                                String errorMsg = obj.getJSONObject("header").getString("message");
                                logger.error("讯飞API返回错误: code={}, message={}", code, errorMsg);

                                // 发送错误消息给客户端
                                sendErrorMessage(sparkParam.getUserId(), "讯飞API返回错误: " + errorMsg);
                                webSocket.close(1000, "Error from API");
                                messageReceived.complete(res);
                                return;
                            }
                        }

                        // 正常处理消息
                        if (obj.containsKey("payload") && obj.getJSONObject("payload").containsKey("choices")) {
                            JSONObject choices = obj.getJSONObject("payload").getJSONObject("choices");
                            String result = JSON.toJSONString(choices);
                            sendOneMessage(sparkParam.getUserId(), result);

                            if (obj.getJSONObject("header").getLong("status") == 2) {
                                webSocket.close(1000, "Closing WebSocket connection");
                                messageReceived.complete(res);
                            }
                        }
                    } catch (Exception e) {
                        logger.error("处理讯飞API响应时出错", e);
                        sendErrorMessage(sparkParam.getUserId(), "处理AI响应时出错: " + e.getMessage());
                        webSocket.close(1000, "Error processing response");
                        messageReceived.completeExceptionally(e);
                    }
                }

                @Override
                public void onFailure(WebSocket webSocket, Throwable t, Response response) {
                    logger.error("讯飞API WebSocket连接失败", t);
                    sendErrorMessage(sparkParam.getUserId(), "连接讯飞API失败: " + t.getMessage());
                    messageReceived.completeExceptionally(t);
                }

                @Override
                public void onClosed(WebSocket webSocket, int code, String reason) {
                    logger.info("讯飞API WebSocket连接已关闭: code={}, reason={}", code, reason);
                }
            });

            try {
                // 设置超时时间为30秒
                String resItem = messageReceived.get(30, TimeUnit.SECONDS);
            } catch (Exception e) {
                logger.error("等待讯飞API响应超时或出错", e);
                sendErrorMessage(sparkParam.getUserId(), "请求讯飞API超时或出错: " + e.getMessage());
                webSocket.close(1000, "Request timeout or error");
            }

        } catch (Exception e) {
            logger.error("调用讯飞API过程中出错", e);
            sendErrorMessage(sparkParam.getUserId(), "调用AI服务出错: " + e.getMessage());
        }
    }

    /*
     * 得到鉴权URl
     * */
    public static String getAuthUrl(String hostUrl, String apiKey, String apiSecret) throws Exception {
        URL url = new URL(hostUrl);
        SimpleDateFormat format = new SimpleDateFormat("EEE, dd MMM yyyy HH:mm:ss z", Locale.US);
        format.setTimeZone(TimeZone.getTimeZone("GMT"));
        String date = format.format(new Date());
        String preStr = "host: " + url.getHost() + "\n" +
                "date: " + date + "\n" +
                "GET " + url.getPath() + " HTTP/1.1";
        Mac mac = Mac.getInstance("hmacsha256");
        SecretKeySpec spec = new SecretKeySpec(apiSecret.getBytes(StandardCharsets.UTF_8), "hmacsha256");
        mac.init(spec);
        byte[] hexDigits = mac.doFinal(preStr.getBytes(StandardCharsets.UTF_8));
        String sha = Base64.getEncoder().encodeToString(hexDigits);
        String authorization = String.format("api_key=\"%s\", algorithm=\"%s\", headers=\"%s\", signature=\"%s\"", apiKey, "hmac-sha256", "host date request-line", sha);
        HttpUrl httpUrl = Objects.requireNonNull(HttpUrl.parse("https://" + url.getHost() + url.getPath())).newBuilder()
                .addQueryParameter("authorization", Base64.getEncoder().encodeToString(authorization.getBytes(StandardCharsets.UTF_8)))
                .addQueryParameter("date", date)
                .addQueryParameter("host", url.getHost())
                .build();
        return httpUrl.toString();
    }

    /**
     * 构建请求参数
     *
     * @param appId
     * @param sparkParam
     * @return
     * @throws Exception
     */
    public static String getSparkJson(String appId, SparkParamDto sparkParam) throws Exception {
        SparkDto sparkDto = new SparkDto();
        //----------------payload-----------------
        JSONObject payload = new JSONObject();
        JSONObject message = new JSONObject();
        JSONArray text = new JSONArray();
        JSONObject textObj = new JSONObject();
        textObj.put("role", "user");
        textObj.put("content", sparkParam.getContent());
        text.add(textObj);
        message.put("text", text);
        payload.put("message", message);
        sparkDto.setPayload(payload);

        //----------------parameter-----------------
        JSONObject parameter = new JSONObject(); // parameter参数
        JSONObject chat = new JSONObject();
        chat.put("domain", "4.0Ultra");
        chat.put("temperature", 0.5);
        chat.put("max_tokens", 1000);
        parameter.put("chat", chat);
        sparkDto.setParameter(parameter);

        //----------------header-----------------
        JSONObject header = new JSONObject();
        header.put("app_id", appId);
        sparkDto.setHeader(header);
        return JSON.toJSONString(sparkDto);
    }
}
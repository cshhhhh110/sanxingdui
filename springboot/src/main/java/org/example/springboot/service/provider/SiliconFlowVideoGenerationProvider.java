package org.example.springboot.service.provider;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.example.springboot.exception.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class SiliconFlowVideoGenerationProvider implements VideoGenerationProvider {
    private static final Map<String, String> VIDEO_SIZES = Map.of(
            "16:9", "1280x720",
            "9:16", "720x1280",
            "1:1", "960x960"
    );

    private final ObjectMapper objectMapper;

    @Value("${media-generation.video.base-url:${spring.ai.openai.base-url:https://api.siliconflow.cn}}")
    private String baseUrl;
    @Value("${media-generation.video.api-key:${spring.ai.openai.api-key:}}")
    private String apiKey;
    @Value("${media-generation.video.text-model:Wan-AI/Wan2.2-T2V-A14B}")
    private String textModel;
    @Value("${media-generation.video.image-model:Wan-AI/Wan2.2-I2V-A14B}")
    private String imageModel;
    @Value("${media-generation.video.request-timeout-seconds:30}")
    private long requestTimeoutSeconds;

    @Override
    public String getProviderName() {
        return "siliconflow";
    }

    @Override
    public VideoSubmitResult submit(VideoGenerationRequest request) {
        requireApiKey();
        try {
            boolean imageToVideo = "IMAGE_TO_VIDEO".equals(request.mode());
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("model", imageToVideo ? imageModel : textModel);
            body.put("prompt", request.prompt());
            body.put("image_size", VIDEO_SIZES.getOrDefault(request.aspectRatio(), "1280x720"));
            if (request.negativePrompt() != null && !request.negativePrompt().isBlank()) {
                body.put("negative_prompt", request.negativePrompt());
            }
            if (imageToVideo) {
                if (request.referenceImage() == null || request.referenceImage().isBlank()) {
                    throw new BusinessException("图生视频缺少参考图片");
                }
                body.put("image", request.referenceImage());
            }
            HttpResponse<String> response = post("/v1/video/submit", body);
            JsonNode root = successfulJson(response);
            String requestId = root.path("requestId").asText("");
            if (requestId.isBlank()) throw new BusinessException("SiliconFlow 未返回视频任务ID");
            return new VideoSubmitResult(
                    requestId,
                    imageToVideo ? imageModel : textModel,
                    sanitized(response, root));
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException("SiliconFlow 视频任务提交失败: " + safeMessage(e));
        }
    }

    @Override
    public VideoTaskResult query(String providerTaskId) {
        requireApiKey();
        try {
            HttpResponse<String> response = post("/v1/video/status", Map.of("requestId", providerTaskId));
            JsonNode root = successfulJson(response);
            String status = root.path("status").asText("Failed");
            String reason = root.path("reason").asText("");
            String url = root.path("results").path("videos").path(0).path("url").asText("");
            int progress = switch (status) {
                case "InQueue" -> 15;
                case "InProgress" -> 55;
                case "Succeed" -> 90;
                default -> 0;
            };
            return new VideoTaskResult(status, progress, url, reason, sanitized(response, root));
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException("SiliconFlow 视频状态查询失败: " + safeMessage(e));
        }
    }

    private HttpResponse<String> post(String path, Object body) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(trimSlash(baseUrl) + path))
                .timeout(Duration.ofSeconds(requestTimeoutSeconds))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                .build();
        return HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .build()
                .send(request, HttpResponse.BodyHandlers.ofString());
    }

    private JsonNode successfulJson(HttpResponse<String> response) throws Exception {
        JsonNode root = objectMapper.readTree(response.body());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            String message = root.path("message").asText(root.path("error").path("message").asText(""));
            throw new BusinessException("SiliconFlow 视频请求失败(" + response.statusCode() + ")"
                    + (message.isBlank() ? "" : ": " + truncate(message)));
        }
        return root;
    }

    private String sanitized(HttpResponse<String> response, JsonNode root) throws Exception {
        return objectMapper.writeValueAsString(Map.of(
                "traceId", response.headers().firstValue("x-siliconcloud-trace-id").orElse(""),
                "status", root.path("status").asText("submitted"),
                "seed", root.path("results").path("seed").asLong(0)
        ));
    }

    private void requireApiKey() {
        if (apiKey == null || apiKey.isBlank()) throw new BusinessException("SiliconFlow 视频生成密钥未配置");
    }

    private String trimSlash(String value) {
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    private String truncate(String value) { return value.length() > 180 ? value.substring(0, 180) : value; }
    private String safeMessage(Exception e) { return e.getMessage() == null ? e.getClass().getSimpleName() : truncate(e.getMessage()); }
}

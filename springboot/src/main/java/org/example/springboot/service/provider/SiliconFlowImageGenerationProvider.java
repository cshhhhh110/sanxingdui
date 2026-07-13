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
public class SiliconFlowImageGenerationProvider implements ImageGenerationProvider {
    private static final Map<String, String> IMAGE_SIZES = Map.of(
            "1:1", "1328x1328",
            "16:9", "1664x928",
            "9:16", "928x1664",
            "4:3", "1472x1140",
            "3:4", "1140x1472"
    );

    private final ObjectMapper objectMapper;

    @Value("${media-generation.image.base-url:${spring.ai.openai.base-url:https://api.siliconflow.cn}}")
    private String baseUrl;

    @Value("${media-generation.image.api-key:${spring.ai.openai.api-key:}}")
    private String apiKey;

    @Value("${media-generation.image.model:Qwen/Qwen-Image}")
    private String model;

    @Value("${media-generation.image.timeout-seconds:180}")
    private long timeoutSeconds;

    @Override
    public String getProviderName() {
        return "siliconflow";
    }

    @Override
    public ImageGenerationResult generate(ImageGenerationRequest request) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new BusinessException("SiliconFlow 图片生成密钥未配置");
        }
        try {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("model", model);
            body.put("prompt", request.prompt());
            body.put("image_size", IMAGE_SIZES.getOrDefault(request.aspectRatio(), IMAGE_SIZES.get("1:1")));
            body.put("batch_size", 1);
            if (request.negativePrompt() != null && !request.negativePrompt().isBlank()) {
                body.put("negative_prompt", request.negativePrompt());
            }

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(trimSlash(baseUrl) + "/v1/images/generations"))
                    .timeout(Duration.ofSeconds(timeoutSeconds))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                    .build();
            HttpResponse<String> response = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(15))
                    .build()
                    .send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new BusinessException(providerError(response.statusCode(), response.body()));
            }
            JsonNode root = objectMapper.readTree(response.body());
            String imageUrl = root.path("images").path(0).path("url").asText("");
            if (imageUrl.isBlank()) {
                throw new BusinessException("SiliconFlow 未返回图片地址");
            }
            String traceId = response.headers().firstValue("x-siliconcloud-trace-id").orElse("");
            String sanitized = objectMapper.writeValueAsString(Map.of(
                    "traceId", traceId,
                    "seed", root.path("seed").asLong(0),
                    "inference", root.path("timings").path("inference").asLong(0)
            ));
            return new ImageGenerationResult(imageUrl, model, sanitized);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException("SiliconFlow 图片生成调用失败: " + safeMessage(e));
        }
    }

    private String providerError(int status, String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            String message = root.path("message").asText(root.path("error").path("message").asText(""));
            if (!message.isBlank()) return "SiliconFlow 请求失败(" + status + "): " + truncate(message);
        } catch (Exception ignored) {
            // Use the status-only message below.
        }
        return "SiliconFlow 请求失败，HTTP " + status;
    }

    private String trimSlash(String value) {
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    private String truncate(String value) {
        return value.length() > 180 ? value.substring(0, 180) : value;
    }

    private String safeMessage(Exception exception) {
        String message = exception.getMessage();
        return message == null ? exception.getClass().getSimpleName() : truncate(message);
    }
}

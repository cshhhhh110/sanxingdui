package org.example.springboot.service.provider;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

class SiliconFlowVideoGenerationProviderTest {
    private HttpServer server;

    @AfterEach
    void stopServer() {
        if (server != null) server.stop(0);
    }

    @Test
    void submitsImageVideoAndQueriesResult() throws Exception {
        AtomicReference<String> submitBody = new AtomicReference<>();
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/v1/video/submit", exchange -> {
            submitBody.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            respond(exchange, "{\"requestId\":\"video-request-1\"}");
        });
        server.createContext("/v1/video/status", exchange ->
                respond(exchange, "{\"status\":\"Succeed\",\"reason\":\"\",\"results\":{\"videos\":[{\"url\":\"https://example.com/result.mp4\"}],\"seed\":8}}"));
        server.start();

        ObjectMapper mapper = new ObjectMapper();
        SiliconFlowVideoGenerationProvider provider = new SiliconFlowVideoGenerationProvider(mapper);
        ReflectionTestUtils.setField(provider, "baseUrl", "http://127.0.0.1:" + server.getAddress().getPort());
        ReflectionTestUtils.setField(provider, "apiKey", "test-key");
        ReflectionTestUtils.setField(provider, "textModel", "Wan-AI/Wan2.2-T2V-A14B");
        ReflectionTestUtils.setField(provider, "imageModel", "Wan-AI/Wan2.2-I2V-A14B");
        ReflectionTestUtils.setField(provider, "requestTimeoutSeconds", 10L);

        VideoGenerationProvider.VideoSubmitResult submitted = provider.submit(
                new VideoGenerationProvider.VideoGenerationRequest(
                        "镜头推进", "抖动", "9:16", "IMAGE_TO_VIDEO", "data:image/png;base64,AAAA"));
        JsonNode body = mapper.readTree(submitBody.get());
        assertThat(body.path("model").asText()).isEqualTo("Wan-AI/Wan2.2-I2V-A14B");
        assertThat(body.path("image_size").asText()).isEqualTo("720x1280");
        assertThat(body.path("image").asText()).startsWith("data:image/png;base64,");
        assertThat(submitted.providerTaskId()).isEqualTo("video-request-1");

        VideoGenerationProvider.VideoTaskResult result = provider.query(submitted.providerTaskId());
        assertThat(result.status()).isEqualTo("Succeed");
        assertThat(result.progress()).isEqualTo(90);
        assertThat(result.remoteUrl()).isEqualTo("https://example.com/result.mp4");
    }

    private void respond(com.sun.net.httpserver.HttpExchange exchange, String json) throws java.io.IOException {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().add("Content-Type", "application/json");
        exchange.getResponseHeaders().add("x-siliconcloud-trace-id", "trace-video");
        exchange.sendResponseHeaders(200, bytes.length);
        exchange.getResponseBody().write(bytes);
        exchange.close();
    }
}

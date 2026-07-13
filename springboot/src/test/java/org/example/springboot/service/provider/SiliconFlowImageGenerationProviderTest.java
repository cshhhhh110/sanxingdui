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

class SiliconFlowImageGenerationProviderTest {
    private HttpServer server;

    @AfterEach
    void stopServer() {
        if (server != null) server.stop(0);
    }

    @Test
    void callsOfficialImagesEndpointWithMappedSize() throws Exception {
        AtomicReference<String> requestBody = new AtomicReference<>();
        AtomicReference<String> authorization = new AtomicReference<>();
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/v1/images/generations", exchange -> {
            requestBody.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            authorization.set(exchange.getRequestHeaders().getFirst("Authorization"));
            byte[] response = "{\"images\":[{\"url\":\"https://example.com/result.png\"}],\"seed\":7,\"timings\":{\"inference\":12}}"
                    .getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.getResponseHeaders().add("x-siliconcloud-trace-id", "trace-1");
            exchange.sendResponseHeaders(200, response.length);
            exchange.getResponseBody().write(response);
            exchange.close();
        });
        server.start();

        ObjectMapper mapper = new ObjectMapper();
        SiliconFlowImageGenerationProvider provider = new SiliconFlowImageGenerationProvider(mapper);
        ReflectionTestUtils.setField(provider, "baseUrl", "http://127.0.0.1:" + server.getAddress().getPort());
        ReflectionTestUtils.setField(provider, "apiKey", "test-key");
        ReflectionTestUtils.setField(provider, "model", "Qwen/Qwen-Image");
        ReflectionTestUtils.setField(provider, "timeoutSeconds", 10L);

        ImageGenerationProvider.ImageGenerationResult result = provider.generate(
                new ImageGenerationProvider.ImageGenerationRequest("青铜面具", "乱码", "16:9"));

        JsonNode body = mapper.readTree(requestBody.get());
        assertThat(authorization.get()).isEqualTo("Bearer test-key");
        assertThat(body.path("model").asText()).isEqualTo("Qwen/Qwen-Image");
        assertThat(body.path("image_size").asText()).isEqualTo("1664x928");
        assertThat(body.path("negative_prompt").asText()).isEqualTo("乱码");
        assertThat(result.remoteUrl()).isEqualTo("https://example.com/result.png");
        assertThat(result.sanitizedResponse()).contains("trace-1");
    }
}

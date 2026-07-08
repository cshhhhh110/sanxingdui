package org.example.springboot.service;

import cn.hutool.core.util.StrUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.example.springboot.dto.command.AiChatAttachmentDTO;
import org.example.springboot.exception.BusinessException;
import org.example.springboot.util.FileUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

/**
 * Transcribes uploaded audio through an OpenAI-compatible ASR endpoint.
 */
@Slf4j
@Service
public class AudioTranscriptionService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${asr.openai.api-key:${spring.ai.openai.api-key:}}")
    private String apiKey;

    @Value("${asr.openai.base-url:${spring.ai.openai.base-url:}}")
    private String baseUrl;

    @Value("${asr.openai.transcriptions-path:/v1/audio/transcriptions}")
    private String transcriptionsPath;

    @Value("${asr.openai.model:FunAudioLLM/SenseVoiceSmall}")
    private String model;

    @Value("${asr.openai.language:zh}")
    private String language;

    public String transcribe(AiChatAttachmentDTO attachment) {
        if (StrUtil.isBlank(apiKey) || apiKey.startsWith("YOUR_")) {
            throw new BusinessException("ASR API key is not configured");
        }
        if (StrUtil.isBlank(baseUrl)) {
            throw new BusinessException("ASR base-url is not configured");
        }

        Path audioPath = resolveLocalPath(attachment.getFilePath());
        String response = postMultipart(audioPath, attachment);
        return extractText(response);
    }

    private String postMultipart(Path audioPath, AiChatAttachmentDTO attachment) {
        String boundary = "----SanxingduiAsrBoundary" + UUID.randomUUID();
        HttpURLConnection conn = null;
        try {
            conn = (HttpURLConnection) URI.create(buildEndpoint()).toURL().openConnection();
            conn.setRequestMethod("POST");
            conn.setDoOutput(true);
            conn.setConnectTimeout(15000);
            conn.setReadTimeout(120000);
            conn.setRequestProperty("Authorization", "Bearer " + apiKey);
            conn.setRequestProperty("Content-Type", "multipart/form-data; boundary=" + boundary);

            try (OutputStream output = conn.getOutputStream()) {
                writeFormField(output, boundary, "model", model);
                if (StrUtil.isNotBlank(language)) {
                    writeFormField(output, boundary, "language", language);
                }
                writeFormField(output, boundary, "response_format", "json");
                writeFileField(output, boundary, "file", audioPath, attachment);
                output.write(("--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));
            }

            int status = conn.getResponseCode();
            byte[] body = status >= 200 && status < 300
                    ? conn.getInputStream().readAllBytes()
                    : (conn.getErrorStream() == null ? new byte[0] : conn.getErrorStream().readAllBytes());
            String response = new String(body, StandardCharsets.UTF_8);
            if (status < 200 || status >= 300) {
                throw new BusinessException("ASR HTTP " + status + ": " + response);
            }
            return response;
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException("音频转写请求失败: " + e.getMessage());
        } finally {
            if (conn != null) {
                conn.disconnect();
            }
        }
    }

    private String extractText(String response) {
        try {
            JsonNode root = objectMapper.readTree(response);
            String text = firstNonBlank(
                    root.path("text").asText(null),
                    root.path("result").path("text").asText(null),
                    root.path("data").path("text").asText(null),
                    root.path("choices").path(0).path("message").path("content").asText(null)
            );
            if (StrUtil.isBlank(text)) {
                throw new BusinessException("ASR response has no text");
            }
            return text.trim();
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Failed to parse ASR response: {}", response);
            throw new BusinessException("ASR response parse failed: " + e.getMessage());
        }
    }

    private String buildEndpoint() {
        String safeBase = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        String safePath = transcriptionsPath.startsWith("/") ? transcriptionsPath : "/" + transcriptionsPath;
        return safeBase + safePath;
    }

    private Path resolveLocalPath(String filePath) {
        if (StrUtil.isBlank(filePath)) {
            throw new BusinessException("音频路径为空，无法转写");
        }

        String relativePath = FileUtil.convertToRelativePath(filePath);
        Path basePath = Paths.get(FileUtil.FILE_BASE_PATH).toAbsolutePath().normalize();
        Path resolvedPath = basePath.resolve(relativePath).toAbsolutePath().normalize();

        if (!resolvedPath.startsWith(basePath)) {
            throw new BusinessException("音频路径超出允许范围");
        }
        if (!Files.exists(resolvedPath) || !Files.isRegularFile(resolvedPath)) {
            throw new BusinessException("音频文件不存在: " + filePath);
        }
        return resolvedPath;
    }

    private void writeFormField(OutputStream output, String boundary, String name, String value) throws Exception {
        output.write(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
        output.write(("Content-Disposition: form-data; name=\"" + name + "\"\r\n\r\n").getBytes(StandardCharsets.UTF_8));
        output.write(value.getBytes(StandardCharsets.UTF_8));
        output.write("\r\n".getBytes(StandardCharsets.UTF_8));
    }

    private void writeFileField(OutputStream output, String boundary, String name, Path filePath,
                                AiChatAttachmentDTO attachment) throws Exception {
        String fileName = StrUtil.blankToDefault(attachment.getFileName(), filePath.getFileName().toString());
        String mimeType = StrUtil.blankToDefault(attachment.getMimeType(), resolveMimeType(fileName));

        output.write(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
        output.write(("Content-Disposition: form-data; name=\"" + name + "\"; filename=\"" + fileName + "\"\r\n")
                .getBytes(StandardCharsets.UTF_8));
        output.write(("Content-Type: " + mimeType + "\r\n\r\n").getBytes(StandardCharsets.UTF_8));
        Files.copy(filePath, output);
        output.write("\r\n".getBytes(StandardCharsets.UTF_8));
    }

    private String resolveMimeType(String fileName) {
        String lowerName = fileName == null ? "" : fileName.toLowerCase();
        if (lowerName.endsWith(".mp3")) {
            return "audio/mpeg";
        }
        if (lowerName.endsWith(".m4a")) {
            return "audio/mp4";
        }
        if (lowerName.endsWith(".ogg")) {
            return "audio/ogg";
        }
        if (lowerName.endsWith(".flac")) {
            return "audio/flac";
        }
        return "audio/wav";
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (StrUtil.isNotBlank(value)) {
                return value;
            }
        }
        return null;
    }
}

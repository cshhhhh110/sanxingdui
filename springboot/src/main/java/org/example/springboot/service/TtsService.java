package org.example.springboot.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.HttpURLConnection;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class TtsService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${spring.ai.openai.api-key}")
    private String sfApiKey;

    @Value("${spring.ai.openai.base-url}")
    private String sfBaseUrl;

    private static final String SF_MODEL = "FunAudioLLM/CosyVoice2-0.5B";
    private static final Map<String, String> SF_VOICE_MAP = Map.of(
            "default", "FunAudioLLM/CosyVoice2-0.5B:alex",
            "zh_female", "FunAudioLLM/CosyVoice2-0.5B:bella",
            "sweet", "FunAudioLLM/CosyVoice2-0.5B:anna"
    );

    private static final List<Map<String, String>> SF_VOICE_LIST = List.of(
            Map.of("key", "default", "label", "\u9ed8\u8ba4\u7537\u58f0", "desc", "alex"),
            Map.of("key", "zh_female", "label", "\u6e05\u4eae\u5973\u58f0", "desc", "bella"),
            Map.of("key", "sweet", "label", "\u751c\u7f8e\u5973\u58f0", "desc", "anna")
    );

    @Value("${mimo.api-key:}")
    private String mimoApiKey;

    @Value("${mimo.base-url:https://token-plan-cn.xiaomimimo.com/v1}")
    private String mimoBaseUrl;

    @Value("${mimo.tts.model:mimo-v2.5-tts}")
    private String mimoTtsModel;

    private static final Map<String, String> MIMO_VOICE_MAP = Map.of(
            "default", "\u82cf\u6253",
            "zh_female", "\u51b0\u7cd6",
            "sweet", "\u8309\u8389",
            "suda", "\u82cf\u6253",
            "bingtang", "\u51b0\u7cd6",
            "moli", "\u8309\u8389"
    );

    private static final List<Map<String, String>> MIMO_VOICE_LIST = List.of(
            Map.of("key", "default", "label", "\u9ed8\u8ba4\u7537\u58f0", "desc", "\u82cf\u6253"),
            Map.of("key", "zh_female", "label", "\u6e05\u4eae\u5973\u58f0", "desc", "\u51b0\u7cd6"),
            Map.of("key", "sweet", "label", "\u751c\u7f8e\u5973\u58f0", "desc", "\u8309\u8389")
    );

    @Value("${tts.provider:siliconflow}")
    private String provider;

    @Value("${tts.moss-nano.url:http://localhost:18083}")
    private String localTtsUrl;

    public List<Map<String, String>> getVoiceList() {
        return "mimo".equalsIgnoreCase(provider) ? MIMO_VOICE_LIST : SF_VOICE_LIST;
    }

    public byte[] synthesize(String text, String voice, float speed) {
        String safeText = text == null ? "" : text.trim();
        safeText = safeText.length() > 500 ? safeText.substring(0, 500) : safeText;
        if (safeText.isBlank()) {
            throw new IllegalArgumentException("TTS text is empty");
        }

        try {
            byte[] audio = "mimo".equalsIgnoreCase(provider)
                    ? synthesizeMiMo(safeText, voice)
                    : synthesizeSiFlow(safeText, voice);
            log.info("TTS success provider:{} text:{} audio:{}bytes", provider, safeText.length(), audio.length);
            return audio;
        } catch (Exception e) {
            log.warn("Cloud TTS failed(provider={}), falling back to local TTS: {}", provider, e.getMessage());
        }

        return synthesizeLocal(safeText);
    }

    private byte[] synthesizeSiFlow(String text, String voice) throws Exception {
        String voiceId = SF_VOICE_MAP.getOrDefault(voice != null ? voice : "default",
                "FunAudioLLM/CosyVoice2-0.5B:alex");

        String body = objectMapper.writeValueAsString(Map.of(
                "model", SF_MODEL,
                "input", text,
                "voice", voiceId,
                "response_format", "wav"
        ));

        return doHttpPost(sfBaseUrl + "/v1/audio/speech", body, sfApiKey);
    }

    private byte[] synthesizeMiMo(String text, String voice) throws Exception {
        if (mimoApiKey == null || mimoApiKey.isBlank() || mimoApiKey.startsWith("YOUR_")) {
            throw new IllegalStateException("MiMo API key is not configured");
        }

        String voiceId = MIMO_VOICE_MAP.getOrDefault(voice != null ? voice : "default", "\u82cf\u6253");
        String json = objectMapper.writeValueAsString(Map.of(
                "model", mimoTtsModel,
                "messages", List.of(
                        Map.of("role", "user", "content", "Read the following Chinese text naturally and clearly."),
                        Map.of("role", "assistant", "content", text)
                ),
                "audio", Map.of(
                        "format", "wav",
                        "voice", voiceId
                ),
                "stream", false
        ));

        HttpURLConnection conn = (HttpURLConnection) URI.create(mimoBaseUrl + "/chat/completions").toURL().openConnection();
        conn.setRequestMethod("POST");
        conn.setDoOutput(true);
        conn.setConnectTimeout(10000);
        conn.setReadTimeout(60000);
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setRequestProperty("api-key", mimoApiKey);
        conn.getOutputStream().write(json.getBytes(StandardCharsets.UTF_8));
        conn.getOutputStream().flush();
        conn.getOutputStream().close();

        if (conn.getResponseCode() != 200) {
            String err = conn.getErrorStream() != null
                    ? new String(conn.getErrorStream().readAllBytes(), StandardCharsets.UTF_8)
                    : "unknown";
            conn.disconnect();
            throw new RuntimeException("MiMo TTS " + conn.getResponseCode() + ": " + err);
        }

        String resp = new String(conn.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        conn.disconnect();

        JsonNode root = objectMapper.readTree(resp);
        String b64 = root.at("/choices/0/message/audio/data").asText();
        if (b64 == null || b64.isBlank()) {
            throw new RuntimeException("MiMo TTS returned no audio data");
        }
        return Base64.getDecoder().decode(b64);
    }

    private byte[] doHttpPost(String url, String body, String apiKey) throws Exception {
        HttpURLConnection conn = (HttpURLConnection) URI.create(url).toURL().openConnection();
        conn.setRequestMethod("POST");
        conn.setDoOutput(true);
        conn.setConnectTimeout(10000);
        conn.setReadTimeout(60000);
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setRequestProperty("Authorization", "Bearer " + apiKey);
        conn.getOutputStream().write(body.getBytes(StandardCharsets.UTF_8));
        conn.getOutputStream().flush();
        conn.getOutputStream().close();

        if (conn.getResponseCode() != 200) {
            String err = conn.getErrorStream() != null
                    ? new String(conn.getErrorStream().readAllBytes(), StandardCharsets.UTF_8)
                    : "unknown";
            conn.disconnect();
            throw new RuntimeException("TTS HTTP " + conn.getResponseCode() + ": " + err);
        }
        byte[] audio = conn.getInputStream().readAllBytes();
        conn.disconnect();
        return audio;
    }

    private byte[] synthesizeLocal(String text) {
        String formBody = "text=" + java.net.URLEncoder.encode(text, StandardCharsets.UTF_8)
                + "&demo_id=demo-1";

        try {
            HttpURLConnection conn = (HttpURLConnection) URI.create(localTtsUrl + "/api/generate").toURL().openConnection();
            conn.setRequestMethod("POST");
            conn.setDoOutput(true);
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(120000);
            conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
            conn.getOutputStream().write(formBody.getBytes(StandardCharsets.UTF_8));
            conn.getOutputStream().flush();
            conn.getOutputStream().close();

            if (conn.getResponseCode() != 200) {
                throw new RuntimeException("Local TTS returned " + conn.getResponseCode());
            }
            String resp = new String(conn.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            conn.disconnect();

            JsonNode json = objectMapper.readTree(resp);
            byte[] audio = Base64.getDecoder().decode(json.get("audio_base64").asText());
            log.info("Local TTS success text:{} audio:{}bytes", text.length(), audio.length);
            return audio;
        } catch (Exception e) {
            log.error("Local TTS failed: {}", e.getMessage());
            throw new RuntimeException("TTS synthesis failed: cloud and local providers are unavailable", e);
        }
    }
}

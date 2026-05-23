package org.example.springboot.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.HttpURLConnection;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Slf4j
@Service
public class TtsService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    // ==================== SiliconFlow (CosyVoice2) ====================
    @Value("${spring.ai.openai.api-key}")
    private String sfApiKey;

    @Value("${spring.ai.openai.base-url}")
    private String sfBaseUrl;

    private static final String SF_MODEL = "FunAudioLLM/CosyVoice2-0.5B";
    private static final Map<String, String> SF_VOICE_MAP = Map.of(
            "default",      "FunAudioLLM/CosyVoice2-0.5B:alex",
            "zh_female",    "FunAudioLLM/CosyVoice2-0.5B:bella",
            "sweet",        "FunAudioLLM/CosyVoice2-0.5B:anna"
    );

    private static final List<Map<String,String>> SF_VOICE_LIST = List.of(
            Map.of("key","default","label","默认男声","desc","中性沉稳 alex"),
            Map.of("key","zh_female","label","标准女声","desc","清晰自然 bella"),
            Map.of("key","sweet","label","甜美女声","desc","甜美活泼 anna")
    );

    // ==================== MiMo ====================
    @Value("${mimo.api-key:}")
    private String mimoApiKey;

    @Value("${mimo.base-url:https://api.xiaomimimo.com/v1}")
    private String mimoBaseUrl;

    @Value("${mimo.tts.model:mimo-v2.5-tts}")
    private String mimoTtsModel;

    // MiMo TTS 音色：苏打(男)、冰糖(女)、茉莉(女甜)
    private static final Map<String, String> MIMO_VOICE_MAP = Map.of(
            "default",      "苏打",
            "zh_female",    "冰糖",
            "sweet",        "茉莉"
    );

    private static final List<Map<String,String>> MIMO_VOICE_LIST = List.of(
            Map.of("key","default","label","默认男声","desc","沉稳 苏打"),
            Map.of("key","zh_female","label","标准女声","desc","清晰 冰糖"),
            Map.of("key","sweet","label","甜美女声","desc","甜美 茉莉")
    );

    // ==================== Provider 选择 ====================
    @Value("${tts.provider:siliconflow}")
    private String provider;

    // ==================== 本地兜底 ====================
    @Value("${tts.moss-nano.url:http://localhost:18083}")
    private String localTtsUrl;

    // ==================== 对外接口 ====================

    public java.util.List<java.util.Map<String,String>> getVoiceList() {
        return "mimo".equalsIgnoreCase(provider) ? MIMO_VOICE_LIST : SF_VOICE_LIST;
    }

    public byte[] synthesize(String text, String voice, float speed) {
        String safeText = text.length() > 500 ? text.substring(0, 500) : text;

        try {
            byte[] audio;
            if ("mimo".equalsIgnoreCase(provider)) {
                audio = synthesizeMiMo(safeText, voice);
            } else {
                audio = synthesizeSiFlow(safeText, voice);
            }
            log.info("TTS成功 provider:{} text:{} audio:{}bytes", provider, safeText.length(), audio.length);
            return audio;
        } catch (Exception e) {
            log.warn("云端TTS失败(provider={})，切回本地: {}", provider, e.getMessage());
        }

        return synthesizeLocal(safeText, voice);
    }

    // ==================== SiliconFlow CosyVoice2 ====================

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

    // ==================== MiMo TTS（Chat 通道 + api-key 头） ====================

    private byte[] synthesizeMiMo(String text, String voice) throws Exception {
        if (mimoApiKey == null || mimoApiKey.isBlank() || "YOUR_MIMO_API_KEY_HERE".equals(mimoApiKey)) {
            throw new RuntimeException("MiMo API key 未配置，请在 application.yml 中填写 mimo.api-key");
        }

        String voiceId = MIMO_VOICE_MAP.getOrDefault(voice != null ? voice : "default", "苏打");

        var body = Map.of(
                "model", mimoTtsModel,
                "messages", java.util.List.of(
                        Map.of("role", "user", "content", "用自然流畅的语速朗读以下内容"),
                        Map.of("role", "assistant", "content", text)
                ),
                "audio", Map.of(
                        "format", "wav",
                        "voice", voiceId
                ),
                "stream", false
        );

        String json = objectMapper.writeValueAsString(body);

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
            throw new RuntimeException("MiMo TTS " + conn.getResponseCode() + ": " + err);
        }

        String resp = new String(conn.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        conn.disconnect();

        JsonNode root = objectMapper.readTree(resp);
        String b64 = root.at("/choices/0/message/audio/data").asText();
        if (b64 == null || b64.isEmpty()) {
            throw new RuntimeException("MiMo TTS 返回无音频数据: " + resp.substring(0, Math.min(200, resp.length())));
        }
        return Base64.getDecoder().decode(b64);
    }

    // ==================== 通用 HTTP 请求 ====================

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
            String err = new String(conn.getErrorStream().readAllBytes(), StandardCharsets.UTF_8);
            throw new RuntimeException("TTS HTTP " + conn.getResponseCode() + ": " + err);
        }
        byte[] audio = conn.getInputStream().readAllBytes();
        conn.disconnect();
        return audio;
    }

    // ==================== 本地 TTS 兜底 ====================

    private byte[] synthesizeLocal(String text, String voice) {
        String demoId = "demo-1";
        String formBody = "text=" + java.net.URLEncoder.encode(text, StandardCharsets.UTF_8)
                + "&demo_id=" + demoId;

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
                throw new RuntimeException("本地TTS返回 " + conn.getResponseCode());
            }
            String resp = new String(conn.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            conn.disconnect();

            JsonNode json = objectMapper.readTree(resp);
            byte[] audio = Base64.getDecoder().decode(json.get("audio_base64").asText());
            log.info("本地GPU TTS成功 text:{} audio:{}bytes", text.length(), audio.length);
            return audio;

        } catch (Exception e) {
            log.error("本地TTS也失败: {}", e.getMessage());
            throw new RuntimeException("语音合成失败（云端+本地均不可用）", e);
        }
    }
}

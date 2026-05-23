package org.example.springboot.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.springboot.dto.command.TtsSpeechCommandDTO;
import org.example.springboot.service.TtsService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/tts")
@RequiredArgsConstructor
@Tag(name = "TTS 语音合成", description = "MOSS-TTS-Nano 文本转语音服务")
public class TtsController {

    private final TtsService ttsService;

    @GetMapping("/ping")
    public String ping() { return "ok"; }

    @GetMapping("/voices")
    @Operation(summary = "获取可用音色列表")
    public java.util.List<java.util.Map<String,String>> listVoices() {
        return ttsService.getVoiceList();
    }

    @PostMapping("/speech")
    @Operation(summary = "文本转语音")
    public ResponseEntity<?> speech(@Valid @RequestBody TtsSpeechCommandDTO dto) {
        try {
            byte[] audio = ttsService.synthesize(dto.getText(), dto.getVoice(),
                    dto.getSpeed() != null ? dto.getSpeed() : 1.0f);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("audio/wav"));
            headers.setContentLength(audio.length);
            headers.setCacheControl("no-cache");
            return new ResponseEntity<>(audio, headers, HttpStatus.OK);
        } catch (Exception e) {
            log.error("TTS 失败: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"code\":\"503\",\"msg\":\"" + e.getMessage() + "\"}");
        }
    }
}

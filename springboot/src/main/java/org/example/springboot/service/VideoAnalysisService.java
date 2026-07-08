package org.example.springboot.service;

import cn.hutool.core.util.StrUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.springboot.dto.command.AiChatAttachmentDTO;
import org.example.springboot.exception.BusinessException;
import org.example.springboot.util.FileUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/**
 * Extracts video frames and audio, then reuses image vision and ASR services.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VideoAnalysisService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    private final ImageAnalysisService imageAnalysisService;
    private final AudioTranscriptionService audioTranscriptionService;

    @Value("${video.ffmpeg.path:ffmpeg}")
    private String ffmpegPath;

    @Value("${video.ffmpeg.ffprobe-path:ffprobe}")
    private String ffprobePath;

    @Value("${video.ffmpeg.frame-count:3}")
    private int frameCount;

    @Value("${video.ffmpeg.max-duration-seconds:120}")
    private int maxDurationSeconds;

    @Value("${video.ffmpeg.work-dir:ai-chat-video}")
    private String workDir;

    @Value("${video.analysis.frame-timeout-seconds:60}")
    private int frameAnalysisTimeoutSeconds;

    @Value("${video.analysis.audio-timeout-seconds:90}")
    private int audioTranscriptionTimeoutSeconds;

    public VideoAnalysisResult analyze(AiChatAttachmentDTO attachment, String userMessage) {
        ensureFfmpegAvailable();

        Path videoPath = resolveLocalPath(attachment.getFilePath());
        VideoMetadata metadata = probeDuration(videoPath);
        if (metadata.getDurationSeconds() != null && metadata.getDurationSeconds() > maxDurationSeconds) {
            throw new BusinessException("视频时长超过限制：" + metadata.getDurationSeconds() + "秒，最大允许"
                    + maxDurationSeconds + "秒");
        }

        Path outputDir = createOutputDir(attachment);
        List<Path> frames = extractFrames(videoPath, outputDir, metadata.getDurationSeconds());
        String audioText = extractAndTranscribeAudio(videoPath, outputDir, attachment);
        List<String> frameSummaries = analyzeFrames(frames, userMessage);

        String extractedText = buildExtractedText(frameSummaries, audioText);
        String extractedMeta = buildExtractedMeta(outputDir, frames, audioText, metadata);
        return new VideoAnalysisResult(extractedText, extractedMeta);
    }

    private void ensureFfmpegAvailable() {
        try {
            CommandResult result = runCommand(List.of(ffmpegPath, "-version"), Duration.ofSeconds(10), null);
            if (result.getExitCode() != 0) {
                throw new BusinessException("ffmpeg 未配置或不可用");
            }
        } catch (BusinessException e) {
            throw new BusinessException("ffmpeg 未配置或不可用");
        } catch (Exception e) {
            throw new BusinessException("ffmpeg 未配置或不可用");
        }
    }

    private VideoMetadata probeDuration(Path videoPath) {
        try {
            CommandResult result = runCommand(List.of(
                    ffprobePath,
                    "-v", "error",
                    "-show_entries", "format=duration",
                    "-of", "default=noprint_wrappers=1:nokey=1",
                    videoPath.toString()
            ), Duration.ofSeconds(15), null);
            if (result.getExitCode() != 0 || StrUtil.isBlank(result.getStdout())) {
                return new VideoMetadata(null, "ffprobe unavailable or returned no duration");
            }
            double duration = Double.parseDouble(result.getStdout().trim());
            return new VideoMetadata((int) Math.ceil(duration), null);
        } catch (Exception e) {
            log.warn("Video duration probe failed: {}", e.getMessage());
            return new VideoMetadata(null, "ffprobe unavailable or duration parse failed");
        }
    }

    private List<Path> extractFrames(Path videoPath, Path outputDir, Integer durationSeconds) {
        int safeFrameCount = Math.max(1, frameCount);
        int safeDuration = durationSeconds == null ? maxDurationSeconds : Math.max(1, durationSeconds);
        int interval = Math.max(1, safeDuration / (safeFrameCount + 1));
        Path framePattern = outputDir.resolve("frame_%03d.jpg");

        CommandResult result = runCommand(List.of(
                ffmpegPath,
                "-y",
                "-i", videoPath.toString(),
                "-t", String.valueOf(maxDurationSeconds),
                "-vf", "fps=1/" + interval + ",scale=640:-1",
                "-frames:v", String.valueOf(safeFrameCount),
                framePattern.toString()
        ), Duration.ofSeconds(90), outputDir);

        if (result.getExitCode() != 0) {
            throw new BusinessException("视频关键帧抽取失败：" + truncate(result.getStderr()));
        }

        try {
            List<Path> frames = Files.list(outputDir)
                    .filter(path -> path.getFileName().toString().startsWith("frame_"))
                    .filter(path -> path.getFileName().toString().endsWith(".jpg"))
                    .sorted()
                    .toList();
            if (frames.isEmpty()) {
                throw new BusinessException("视频关键帧抽取失败：未生成帧图片");
            }
            return frames;
        } catch (IOException e) {
            throw new BusinessException("读取视频关键帧失败：" + e.getMessage());
        }
    }

    private String extractAndTranscribeAudio(Path videoPath, Path outputDir, AiChatAttachmentDTO sourceAttachment) {
        Path audioPath = outputDir.resolve("audio.wav");
        CommandResult result = runCommand(List.of(
                ffmpegPath,
                "-y",
                "-i", videoPath.toString(),
                "-t", String.valueOf(maxDurationSeconds),
                "-map", "0:a:0",
                "-vn",
                "-ac", "1",
                "-ar", "16000",
                audioPath.toString()
        ), Duration.ofSeconds(90), outputDir);

        if (result.getExitCode() != 0 || !Files.exists(audioPath)) {
            return "视频未检测到可转写音轨，或音轨提取失败。";
        }

        AiChatAttachmentDTO audioAttachment = new AiChatAttachmentDTO();
        audioAttachment.setFileId(sourceAttachment.getFileId());
        audioAttachment.setMediaType("AUDIO");
        audioAttachment.setFileName("audio.wav");
        audioAttachment.setFilePath(toPublicFilePath(audioPath));
        audioAttachment.setMimeType("audio/wav");
        try {
            audioAttachment.setFileSize(Files.size(audioPath));
        } catch (IOException ignored) {
            audioAttachment.setFileSize(0L);
        }

        try {
            return callWithTimeout(
                    () -> audioTranscriptionService.transcribe(audioAttachment),
                    audioTranscriptionTimeoutSeconds
            );
        } catch (Exception e) {
            log.warn("Video audio transcription failed: {}", e.getMessage());
            return "视频音轨已提取，但转写失败：" + truncate(e.getMessage());
        }
    }

    private List<String> analyzeFrames(List<Path> frames, String userMessage) {
        List<String> summaries = new ArrayList<>();
        for (int i = 0; i < frames.size(); i++) {
            Path frame = frames.get(i);
            AiChatAttachmentDTO frameAttachment = new AiChatAttachmentDTO();
            frameAttachment.setMediaType("IMAGE");
            frameAttachment.setFileName(frame.getFileName().toString());
            frameAttachment.setFilePath(toPublicFilePath(frame));
            frameAttachment.setMimeType("image/jpeg");
            try {
                frameAttachment.setFileSize(Files.size(frame));
            } catch (IOException ignored) {
                frameAttachment.setFileSize(0L);
            }

            try {
                String frameSummary = callWithTimeout(
                        () -> imageAnalysisService.analyze(frameAttachment, userMessage),
                        frameAnalysisTimeoutSeconds
                );
                summaries.add("关键帧" + (i + 1) + "：" + frameSummary);
            } catch (Exception e) {
                summaries.add("关键帧" + (i + 1) + "：解析失败：" + truncate(e.getMessage()));
            }
        }
        return summaries;
    }

    private String buildExtractedText(List<String> frameSummaries, String audioText) {
        StringBuilder builder = new StringBuilder();
        builder.append("视频画面摘要：\n");
        for (String summary : frameSummaries) {
            builder.append("- ").append(summary).append("\n");
        }
        builder.append("视频音频转写：\n").append(StrUtil.blankToDefault(audioText, "无可用音频转写")).append("\n");
        builder.append("综合摘要：请结合以上关键帧画面和音频转写回答用户问题。");
        return builder.toString();
    }

    private String buildExtractedMeta(Path outputDir, List<Path> frames, String audioText, VideoMetadata metadata) {
        Map<String, Object> meta = new LinkedHashMap<>();
        meta.put("provider", "ffmpeg+vision+asr");
        meta.put("workDir", toPublicFilePath(outputDir));
        meta.put("framePaths", frames.stream().map(this::toPublicFilePath).toList());
        meta.put("audioPath", toPublicFilePath(outputDir.resolve("audio.wav")));
        meta.put("audioTranscribed", StrUtil.isNotBlank(audioText)
                && !audioText.startsWith("视频未检测到")
                && !audioText.startsWith("视频音轨已提取，但转写失败"));
        meta.put("durationSeconds", metadata.getDurationSeconds());
        meta.put("durationWarning", metadata.getWarning());
        try {
            return objectMapper.writeValueAsString(meta);
        } catch (Exception e) {
            return "{\"provider\":\"ffmpeg+vision+asr\"}";
        }
    }

    private Path resolveLocalPath(String filePath) {
        if (StrUtil.isBlank(filePath)) {
            throw new BusinessException("视频路径为空，无法解析");
        }

        String relativePath = FileUtil.convertToRelativePath(filePath);
        Path basePath = Paths.get(FileUtil.FILE_BASE_PATH).toAbsolutePath().normalize();
        Path resolvedPath = basePath.resolve(relativePath).toAbsolutePath().normalize();
        if (!resolvedPath.startsWith(basePath)) {
            throw new BusinessException("视频路径超出允许范围");
        }
        if (!Files.exists(resolvedPath) || !Files.isRegularFile(resolvedPath)) {
            throw new BusinessException("视频文件不存在: " + filePath);
        }
        return resolvedPath;
    }

    private Path createOutputDir(AiChatAttachmentDTO attachment) {
        String dirName = "video-" + attachment.getFileId() + "-" + UUID.randomUUID();
        Path basePath = Paths.get(FileUtil.FILE_BASE_PATH).toAbsolutePath().normalize();
        Path outputDir = basePath.resolve(workDir).resolve(dirName).normalize();
        if (!outputDir.startsWith(basePath)) {
            throw new BusinessException("视频解析工作目录超出允许范围");
        }
        try {
            Files.createDirectories(outputDir);
            return outputDir;
        } catch (IOException e) {
            throw new BusinessException("创建视频解析工作目录失败：" + e.getMessage());
        }
    }

    private String callWithTimeout(Callable<String> task, int timeoutSeconds) throws Exception {
        int safeTimeoutSeconds = Math.max(1, timeoutSeconds);
        CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
            try {
                return task.call();
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        });

        try {
            return future.get(safeTimeoutSeconds, TimeUnit.SECONDS);
        } catch (TimeoutException e) {
            future.cancel(true);
            throw new BusinessException("子任务执行超时：" + safeTimeoutSeconds + "秒");
        } catch (java.util.concurrent.ExecutionException e) {
            Throwable cause = e.getCause();
            if (cause instanceof RuntimeException runtimeException && runtimeException.getCause() != null) {
                cause = runtimeException.getCause();
            }
            if (cause instanceof Exception exception) {
                throw exception;
            }
            throw new BusinessException(cause == null ? "子任务执行失败" : cause.getMessage());
        }
    }

    private CommandResult runCommand(List<String> command, Duration timeout, Path workingDirectory) {
        Process process = null;
        Path outputFile = null;
        try {
            outputFile = Files.createTempFile("ai-chat-video-command-", ".log");
            ProcessBuilder builder = new ProcessBuilder(command);
            if (workingDirectory != null) {
                builder.directory(workingDirectory.toFile());
            }
            builder.redirectErrorStream(true);
            builder.redirectOutput(outputFile.toFile());
            process = builder.start();
            boolean finished = process.waitFor(timeout.toMillis(), java.util.concurrent.TimeUnit.MILLISECONDS);
            if (!finished) {
                process.destroyForcibly();
                throw new BusinessException("命令执行超时：" + command.get(0));
            }
            String output = Files.exists(outputFile)
                    ? Files.readString(outputFile, StandardCharsets.UTF_8)
                    : "";
            return new CommandResult(process.exitValue(), output, output);
        } catch (IOException e) {
            throw new BusinessException("命令不可用：" + command.get(0));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new BusinessException("命令执行被中断：" + command.get(0));
        } finally {
            if (process != null && process.isAlive()) {
                process.destroyForcibly();
            }
            if (outputFile != null) {
                try {
                    Files.deleteIfExists(outputFile);
                } catch (IOException ignored) {
                    // Best effort cleanup.
                }
            }
        }
    }

    private String toPublicFilePath(Path path) {
        Path basePath = Paths.get(FileUtil.FILE_BASE_PATH).toAbsolutePath().normalize();
        Path normalized = path.toAbsolutePath().normalize();
        if (!normalized.startsWith(basePath)) {
            return normalized.toString();
        }
        return "/files/" + basePath.relativize(normalized).toString().replace("\\", "/");
    }

    private String truncate(String value) {
        if (StrUtil.isBlank(value)) {
            return "未知错误";
        }
        String normalized = value.replaceAll("[\\r\\n]+", " ").trim();
        return normalized.length() > 160 ? normalized.substring(0, 160) + "..." : normalized;
    }

    @Data
    @AllArgsConstructor
    public static class VideoAnalysisResult {
        private String extractedText;
        private String extractedMeta;
    }

    @Data
    @AllArgsConstructor
    private static class CommandResult {
        private int exitCode;
        private String stdout;
        private String stderr;
    }

    @Data
    @AllArgsConstructor
    private static class VideoMetadata {
        private Integer durationSeconds;
        private String warning;
    }
}

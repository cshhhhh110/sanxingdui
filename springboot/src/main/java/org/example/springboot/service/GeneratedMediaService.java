package org.example.springboot.service;

import lombok.RequiredArgsConstructor;
import org.example.springboot.entity.SysFileInfo;
import org.example.springboot.exception.BusinessException;
import org.example.springboot.mapper.SysFileInfoMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.io.ByteArrayInputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class GeneratedMediaService {
    private final SysFileInfoMapper fileInfoMapper;

    @Value("${media-generation.storage-dir:files/generated}")
    private String storageDir;

    @Value("${media-generation.image.max-result-bytes:20971520}")
    private int maxImageBytes;

    @Value("${media-generation.video.max-result-bytes:209715200}")
    private int maxVideoBytes;

    @Value("${video.ffmpeg.ffprobe-path:ffprobe}")
    private String ffprobePath;

    public SavedMedia saveImage(String remoteUrl, Long userId, String taskId) {
        return saveImage(remoteUrl, userId, taskId, () -> { });
    }

    public SavedMedia saveImage(String remoteUrl, Long userId, String taskId, Runnable onDownloaded) {
        try {
            URI uri = URI.create(remoteUrl);
            if (!("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme()))) {
                throw new BusinessException("图片结果地址协议不受支持");
            }
            HttpRequest request = HttpRequest.newBuilder(uri)
                    .timeout(Duration.ofSeconds(60))
                    .GET()
                    .build();
            HttpResponse<byte[]> response = HttpClient.newBuilder()
                    .followRedirects(HttpClient.Redirect.NORMAL)
                    .connectTimeout(Duration.ofSeconds(10))
                    .build()
                    .send(request, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new BusinessException("生成图片下载失败");
            }
            byte[] bytes = response.body();
            if (bytes.length == 0 || bytes.length > maxImageBytes || ImageIO.read(new ByteArrayInputStream(bytes)) == null) {
                throw new BusinessException("生成结果不是有效图片或文件过大");
            }
            onDownloaded.run();
            String extension = extension(response.headers().firstValue("Content-Type").orElse("image/png"));
            String month = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMM"));
            Path directory = Path.of(storageDir, String.valueOf(userId), month, "image").toAbsolutePath().normalize();
            Files.createDirectories(directory);
            String fileName = UUID.randomUUID().toString().replace("-", "") + "." + extension;
            Path target = directory.resolve(fileName).normalize();
            if (!target.startsWith(directory)) {
                throw new BusinessException("生成文件路径非法");
            }
            Files.write(target, bytes, StandardOpenOption.CREATE_NEW);

            String relativeUrl = "/files/generated/" + userId + "/" + month + "/image/" + fileName;
            SysFileInfo fileInfo = new SysFileInfo();
            fileInfo.setOriginalName("AI生成图片_" + taskId + "." + extension);
            fileInfo.setFilePath(relativeUrl);
            fileInfo.setFileSize((long) bytes.length);
            fileInfo.setFileType("IMG");
            fileInfo.setBusinessType("AI_GENERATED_MEDIA");
            fileInfo.setBusinessId(taskId);
            fileInfo.setBusinessField("result");
            fileInfo.setUploadUserId(userId);
            fileInfo.setIsTemp(0);
            fileInfo.setStatus(1);
            fileInfoMapper.insert(fileInfo);
            return new SavedMedia(fileInfo.getId(), relativeUrl);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException("保存生成图片失败: " + safeMessage(e));
        }
    }

    public SavedMedia saveVideo(String remoteUrl, Long userId, String taskId) {
        Path target = null;
        try {
            URI uri = URI.create(remoteUrl);
            if (!("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme()))) {
                throw new BusinessException("视频结果地址协议不受支持");
            }
            HttpRequest request = HttpRequest.newBuilder(uri).timeout(Duration.ofMinutes(5)).GET().build();
            HttpResponse<byte[]> response = HttpClient.newBuilder()
                    .followRedirects(HttpClient.Redirect.NORMAL)
                    .connectTimeout(Duration.ofSeconds(15))
                    .build()
                    .send(request, HttpResponse.BodyHandlers.ofByteArray());
            byte[] bytes = response.body();
            if (response.statusCode() < 200 || response.statusCode() >= 300 || bytes.length == 0 || bytes.length > maxVideoBytes) {
                throw new BusinessException("生成视频下载失败或文件过大");
            }
            String month = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMM"));
            Path directory = Path.of(storageDir, String.valueOf(userId), month, "video").toAbsolutePath().normalize();
            Files.createDirectories(directory);
            String fileName = UUID.randomUUID().toString().replace("-", "") + ".mp4";
            target = directory.resolve(fileName).normalize();
            if (!target.startsWith(directory)) throw new BusinessException("生成文件路径非法");
            Files.write(target, bytes, StandardOpenOption.CREATE_NEW);
            validateVideo(target);

            String relativeUrl = "/files/generated/" + userId + "/" + month + "/video/" + fileName;
            SysFileInfo fileInfo = new SysFileInfo();
            fileInfo.setOriginalName("AI生成视频_" + taskId + ".mp4");
            fileInfo.setFilePath(relativeUrl);
            fileInfo.setFileSize((long) bytes.length);
            fileInfo.setFileType("VIDEO");
            fileInfo.setBusinessType("AI_GENERATED_MEDIA");
            fileInfo.setBusinessId(taskId);
            fileInfo.setBusinessField("result");
            fileInfo.setUploadUserId(userId);
            fileInfo.setIsTemp(0);
            fileInfo.setStatus(1);
            fileInfoMapper.insert(fileInfo);
            return new SavedMedia(fileInfo.getId(), relativeUrl);
        } catch (BusinessException e) {
            deleteQuietly(target);
            throw e;
        } catch (Exception e) {
            deleteQuietly(target);
            throw new BusinessException("保存生成视频失败: " + safeMessage(e));
        }
    }

    private void validateVideo(Path path) throws Exception {
        Process process = new ProcessBuilder(
                ffprobePath, "-v", "error", "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1", path.toString())
                .redirectErrorStream(true)
                .start();
        boolean completed = process.waitFor(20, TimeUnit.SECONDS);
        String output = new String(process.getInputStream().readAllBytes()).trim();
        if (!completed) {
            process.destroyForcibly();
            throw new BusinessException("ffprobe 校验视频超时");
        }
        if (process.exitValue() != 0) throw new BusinessException("生成结果不是有效视频");
        try {
            double duration = Double.parseDouble(output);
            if (duration <= 0 || duration > 120) throw new BusinessException("生成视频时长无效");
        } catch (NumberFormatException e) {
            throw new BusinessException("无法读取生成视频时长");
        }
    }

    private void deleteQuietly(Path path) {
        if (path == null) return;
        try { Files.deleteIfExists(path); } catch (Exception ignored) { }
    }

    private String extension(String contentType) {
        String value = contentType.toLowerCase(Locale.ROOT);
        if (value.contains("jpeg") || value.contains("jpg")) return "jpg";
        if (value.contains("webp")) return "webp";
        return "png";
    }

    private String safeMessage(Exception exception) {
        String message = exception.getMessage();
        return message == null || message.length() > 180 ? exception.getClass().getSimpleName() : message;
    }

    public record SavedMedia(Long fileId, String url) {}
}

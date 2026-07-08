package org.example.springboot.service;

import cn.hutool.core.util.StrUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.springboot.dto.command.AiChatAttachmentDTO;
import org.example.springboot.exception.BusinessException;
import org.example.springboot.util.FileUtil;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.io.FileSystemResource;
import org.springframework.stereotype.Service;
import org.springframework.util.MimeType;
import org.springframework.util.MimeTypeUtils;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Uses the configured multimodal chat model to summarize uploaded images.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ImageAnalysisService {

    @Qualifier("open-ai")
    private final ChatClient chatClient;

    public String analyze(AiChatAttachmentDTO attachment, String userMessage) {
        Path imagePath = resolveLocalPath(attachment.getFilePath());
        MimeType mimeType = resolveMimeType(attachment);
        String question = StrUtil.blankToDefault(userMessage, "请描述这张图片，并指出它与三星堆或文物展示可能相关的信息。");

        String prompt = """
                你是三星堆数字展馆的图像理解助手。
                请客观分析用户上传的图片，输出不超过 180 字：
                1. 图片中可见的主要物体、场景或文字；
                2. 如果能判断与三星堆文物、展陈或历史文化有关，请说明依据；
                3. 如果图片信息不足，请明确说明不确定。

                用户问题：%s
                """.formatted(question);

        return chatClient.prompt()
                .user(user -> user
                        .text(prompt)
                        .media(mimeType, new FileSystemResource(imagePath)))
                .call()
                .content();
    }

    private Path resolveLocalPath(String filePath) {
        if (StrUtil.isBlank(filePath)) {
            throw new BusinessException("图片路径为空，无法解析");
        }

        String relativePath = FileUtil.convertToRelativePath(filePath);
        Path basePath = Paths.get(FileUtil.FILE_BASE_PATH).toAbsolutePath().normalize();
        Path resolvedPath = basePath.resolve(relativePath).toAbsolutePath().normalize();

        if (!resolvedPath.startsWith(basePath)) {
            throw new BusinessException("图片路径超出允许范围");
        }
        if (!Files.exists(resolvedPath) || !Files.isRegularFile(resolvedPath)) {
            throw new BusinessException("图片文件不存在: " + filePath);
        }

        return resolvedPath;
    }

    private MimeType resolveMimeType(AiChatAttachmentDTO attachment) {
        if (StrUtil.isNotBlank(attachment.getMimeType())) {
            try {
                return MimeTypeUtils.parseMimeType(attachment.getMimeType());
            } catch (Exception e) {
                log.warn("Invalid image mime type: {}", attachment.getMimeType());
            }
        }

        String fileName = StrUtil.blankToDefault(attachment.getFileName(), attachment.getFilePath()).toLowerCase();
        if (fileName.endsWith(".png")) {
            return MimeTypeUtils.IMAGE_PNG;
        }
        if (fileName.endsWith(".gif")) {
            return MimeTypeUtils.IMAGE_GIF;
        }
        return MimeTypeUtils.IMAGE_JPEG;
    }
}

package org.example.springboot.service;

import cn.hutool.core.util.StrUtil;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.hwpf.HWPFDocument;
import org.apache.poi.hwpf.extractor.WordExtractor;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.example.springboot.dto.command.AiChatAttachmentDTO;
import org.example.springboot.exception.BusinessException;
import org.example.springboot.util.FileUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Extracts readable text from uploaded document attachments.
 */
@Slf4j
@Service
public class DocumentTextExtractionService {

    @Value("${document.extract.max-chars:12000}")
    private int maxChars;

    public String extract(AiChatAttachmentDTO attachment) {
        Path path = resolveLocalPath(attachment.getFilePath());
        String fileName = StrUtil.blankToDefault(attachment.getFileName(), path.getFileName().toString()).toLowerCase();

        try {
            String text;
            if (fileName.endsWith(".pdf")) {
                text = extractPdf(path);
            } else if (fileName.endsWith(".docx")) {
                text = extractDocx(path);
            } else if (fileName.endsWith(".doc")) {
                text = extractDoc(path);
            } else if (fileName.endsWith(".txt") || fileName.endsWith(".md") || fileName.endsWith(".log")) {
                text = extractPlainText(path);
            } else {
                throw new BusinessException("暂不支持该文档格式: " + fileName);
            }

            String normalized = normalizeText(text);
            if (StrUtil.isBlank(normalized)) {
                throw new BusinessException("文档未提取到有效文本");
            }
            return truncate(normalized);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Document extraction failed, filePath: {}, error: {}", attachment.getFilePath(), e.getMessage());
            throw new BusinessException("文档文本提取失败: " + e.getMessage());
        }
    }

    private String extractPdf(Path path) throws Exception {
        try (PDDocument document = PDDocument.load(path.toFile())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    private String extractDocx(Path path) throws Exception {
        try (InputStream input = Files.newInputStream(path);
             XWPFDocument document = new XWPFDocument(input);
             XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
            return extractor.getText();
        }
    }

    private String extractDoc(Path path) throws Exception {
        try (InputStream input = Files.newInputStream(path);
             HWPFDocument document = new HWPFDocument(input);
             WordExtractor extractor = new WordExtractor(document)) {
            return extractor.getText();
        }
    }

    private String extractPlainText(Path path) throws Exception {
        byte[] bytes = Files.readAllBytes(path);
        String text = new String(bytes, StandardCharsets.UTF_8);
        if (text.indexOf('\uFFFD') >= 0) {
            text = new String(bytes, Charset.forName("GBK"));
        }
        return text;
    }

    private Path resolveLocalPath(String filePath) {
        if (StrUtil.isBlank(filePath)) {
            throw new BusinessException("文档路径为空，无法提取文本");
        }

        String relativePath = FileUtil.convertToRelativePath(filePath);
        Path basePath = Paths.get(FileUtil.FILE_BASE_PATH).toAbsolutePath().normalize();
        Path resolvedPath = basePath.resolve(relativePath).toAbsolutePath().normalize();

        if (!resolvedPath.startsWith(basePath)) {
            throw new BusinessException("文档路径超出允许范围");
        }
        if (!Files.exists(resolvedPath) || !Files.isRegularFile(resolvedPath)) {
            throw new BusinessException("文档文件不存在: " + filePath);
        }
        return resolvedPath;
    }

    private String normalizeText(String text) {
        if (text == null) {
            return "";
        }
        return text.replace('\u00A0', ' ')
                .replaceAll("[\\t\\x0B\\f\\r]+", " ")
                .replaceAll(" *\\n+ *", "\n")
                .replaceAll("\\n{3,}", "\n\n")
                .trim();
    }

    private String truncate(String text) {
        if (text.length() <= maxChars) {
            return text;
        }
        return text.substring(0, Math.max(0, maxChars)) + "\n\n[文档内容较长，已截断]";
    }
}

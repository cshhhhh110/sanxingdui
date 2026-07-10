package org.example.springboot.agent.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AgentAttachmentDTO {

    @NotBlank(message = "fileId cannot be blank")
    @Size(max = 128, message = "fileId is too long")
    private String fileId;

    @Size(max = 255, message = "fileName is too long")
    private String fileName;

    @Size(max = 128, message = "mediaType is too long")
    private String mediaType;

    @PositiveOrZero(message = "size cannot be negative")
    private long size;

    @Size(max = 255, message = "mimeType is too long")
    private String mimeType;

    @Size(max = 500, message = "filePath is too long")
    private String filePath;
}

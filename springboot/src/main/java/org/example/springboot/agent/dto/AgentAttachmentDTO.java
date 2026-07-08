package org.example.springboot.agent.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AgentAttachmentDTO {

    @NotBlank(message = "文件标识不能为空")
    @Size(max = 128, message = "文件标识不能超过128字")
    private String fileId;

    @Size(max = 255, message = "文件名不能超过255字")
    private String fileName;

    @Size(max = 128, message = "文件类型不能超过128字")
    private String mediaType;

    @PositiveOrZero(message = "文件大小不能为负数")
    private long size;
}

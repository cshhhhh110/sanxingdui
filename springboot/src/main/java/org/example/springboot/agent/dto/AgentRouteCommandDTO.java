package org.example.springboot.agent.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Data
public class AgentRouteCommandDTO {

    @NotBlank(message = "用户输入不能为空")
    @Size(max = 2000, message = "用户输入不能超过2000字")
    private String message;

    @Valid
    @Size(max = 10, message = "单次最多上传10个文件")
    private List<AgentAttachmentDTO> attachments = Collections.emptyList();

    @Size(max = 20, message = "上下文字段不能超过20个")
    private Map<String, Object> context = Collections.emptyMap();
}

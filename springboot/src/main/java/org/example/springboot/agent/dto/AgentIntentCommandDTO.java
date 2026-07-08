package org.example.springboot.agent.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AgentIntentCommandDTO {

    @NotBlank(message = "用户输入不能为空")
    @Size(max = 500, message = "用户输入不能超过500字")
    private String userMessage;
}

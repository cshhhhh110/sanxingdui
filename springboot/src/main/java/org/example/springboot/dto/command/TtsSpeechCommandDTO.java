package org.example.springboot.dto.command;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "TTS 语音合成请求")
public class TtsSpeechCommandDTO {

    @Schema(description = "要合成的文本", required = true, maxLength = 500)
    @NotBlank(message = "文本不能为空")
    @Size(max = 500, message = "文本长度不能超过500")
    private String text;

    @Schema(description = "预设音色名", defaultValue = "default")
    private String voice = "default";

    @Schema(description = "语速", defaultValue = "1.0")
    private Float speed = 1.0f;
}

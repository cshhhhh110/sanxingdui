package org.example.springboot.dto.command;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ConfirmVisualAidProposalDTO {
    @NotBlank
    @Size(max = 64)
    private String clientRequestId;
}

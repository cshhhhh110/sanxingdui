package org.example.springboot.service.provider;

public interface VideoGenerationProvider {
    String getProviderName();
    VideoSubmitResult submit(VideoGenerationRequest request);
    VideoTaskResult query(String providerTaskId);

    record VideoGenerationRequest(
            String prompt,
            String negativePrompt,
            String aspectRatio,
            String mode,
            String referenceImage
    ) {}

    record VideoSubmitResult(String providerTaskId, String model, String sanitizedResponse) {}

    record VideoTaskResult(
            String status,
            int progress,
            String remoteUrl,
            String reason,
            String sanitizedResponse
    ) {}
}

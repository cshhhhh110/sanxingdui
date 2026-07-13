package org.example.springboot.service.provider;

public interface ImageGenerationProvider {
    String getProviderName();
    ImageGenerationResult generate(ImageGenerationRequest request);

    record ImageGenerationRequest(String prompt, String negativePrompt, String aspectRatio, String modelProfile) {}
    record ImageGenerationResult(String remoteUrl, String model, String sanitizedResponse) {}
}

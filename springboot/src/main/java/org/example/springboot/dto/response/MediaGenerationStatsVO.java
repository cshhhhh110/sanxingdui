package org.example.springboot.dto.response;

import java.util.Map;

public record MediaGenerationStatsVO(
        long total,
        long succeeded,
        long failed,
        long processing,
        double successRate,
        long averageDurationSeconds,
        Map<String, Long> byMediaType,
        Map<String, Long> byProvider,
        Map<String, Long> byErrorCode
) {}

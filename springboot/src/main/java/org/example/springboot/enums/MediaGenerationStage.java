package org.example.springboot.enums;

import lombok.Getter;

@Getter
public enum MediaGenerationStage {
    QUEUED("任务已进入队列"),
    PREPARING("正在理解创作需求"),
    GENERATING("正在生成画面"),
    DOWNLOADING("正在获取生成结果"),
    SAVING("正在保存作品"),
    SUCCEEDED("作品已生成"),
    FAILED("生成失败"),
    CANCELED("生成已取消");

    private final String message;

    MediaGenerationStage(String message) {
        this.message = message;
    }
}

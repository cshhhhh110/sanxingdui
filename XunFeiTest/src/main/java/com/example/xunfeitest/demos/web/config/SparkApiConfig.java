package com.example.xunfeitest.demos.web.config;

import lombok.Data;
import lombok.Getter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;

@Data
@Component
@ConfigurationProperties("xunfie.client")
public class SparkApiConfig {
    private String hostUrl;
    private String appId;
    private String apiSecret;
    private String apiKey;
    private Integer maxResponseTime = 30; // 默认30秒超时

    @Getter
    private static String hostUrl1;
    @Getter
    private static String appId1;
    @Getter
    private static String apiSecret1;
    @Getter
    private static String apiKey1;
    @Getter
    private static Integer maxResponseTime1;

    @PostConstruct
    public void init() {
        hostUrl1 = this.hostUrl;
        appId1 = this.appId;
        apiSecret1 = this.apiSecret;
        apiKey1 = this.apiKey;
        maxResponseTime1 = this.maxResponseTime;
    }
}
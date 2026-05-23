package com.example.xunfeitest.demos.web.dto;

import lombok.Data;

/**
 * @author qfy
 * @date Created in 2024/6/11 19:50
 * @entity
 * @controller
 * @tableName
 * @service
 * @mapper
 * @description
 */
@Data
public class SparkParamDto {
    private String content;
    private String userId;
    private String type;
    private String chatType;
    private String historyId;
}

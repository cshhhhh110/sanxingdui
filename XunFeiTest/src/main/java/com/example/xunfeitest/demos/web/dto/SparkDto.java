package com.example.xunfeitest.demos.web.dto;

import com.alibaba.fastjson.JSONObject;
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
public class SparkDto {
    private JSONObject payload; //负载
    private JSONObject parameter; // 参数
    private JSONObject header;
}

package com.example.xunfeitest.demos.web.controller;

import com.example.xunfeitest.utils.BaseResponse;
import com.example.xunfeitest.utils.ResultUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * @author qfy
 * @date Created in 2024/6/17 11:13
 * @entity
 * @controller
 * @tableName
 * @service
 * @mapper
 * @description
 */
@RestController
@RequestMapping("/test")
public class Test {


    /*
    * 这个接口实现Ai判题
    * */
    @GetMapping
    public BaseResponse<String> Test(){
        return ResultUtils.success("111");
    }
}

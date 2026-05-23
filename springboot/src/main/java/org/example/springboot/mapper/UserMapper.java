package org.example.springboot.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.example.springboot.entity.User;
import org.apache.ibatis.annotations.Param;

/**
 * 用户数据访问层
 * @author system
 */
@Mapper
public interface UserMapper extends BaseMapper<User> {
    // 继承BaseMapper，获得基础的CRUD操作
    // 所有复杂查询都在Service层使用Lambda构造器实现
    // 新增：带新用户标记的查询
    User getUserWithNewFlagById(@Param("userId") Long userId);
}

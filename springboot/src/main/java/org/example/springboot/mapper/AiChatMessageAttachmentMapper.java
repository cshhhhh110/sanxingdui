package org.example.springboot.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.example.springboot.entity.AiChatMessageAttachment;

/**
 * AI聊天消息附件Mapper
 */
@Mapper
public interface AiChatMessageAttachmentMapper extends BaseMapper<AiChatMessageAttachment> {
}

ALTER TABLE ai_chat_message
  ADD COLUMN message_type varchar(20) NOT NULL DEFAULT 'TEXT' COMMENT '消息类型：TEXT/MULTIMODAL/SYSTEM',
  ADD COLUMN raw_content text NULL COMMENT '用户原始输入',
  ADD COLUMN processed_content longtext NULL COMMENT '模型可读的处理后内容';

CREATE TABLE IF NOT EXISTS ai_chat_message_attachment (
  id bigint NOT NULL AUTO_INCREMENT COMMENT '附件ID',
  message_id bigint NOT NULL COMMENT '聊天消息ID',
  file_id bigint NOT NULL COMMENT 'sys_file_info.id',
  media_type varchar(20) NOT NULL COMMENT 'IMAGE/AUDIO/VIDEO/DOCUMENT/FILE',
  file_name varchar(255) NULL COMMENT '原始文件名',
  file_path varchar(500) NULL COMMENT '文件访问路径',
  mime_type varchar(100) NULL COMMENT 'MIME类型',
  file_size bigint NULL COMMENT '文件大小',
  analysis_status varchar(20) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING/PROCESSING/DONE/FAILED',
  extracted_text longtext NULL COMMENT '音频转写/文档提取/视频摘要',
  extracted_meta json NULL COMMENT '关键帧、时长、尺寸等结构化信息',
  create_time datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_message_id (message_id),
  KEY idx_file_id (file_id)
) COMMENT='AI聊天消息附件表';

-- AI文博助手生图体验产品化 P0 增量迁移。
-- 适用于已执行 ai-media-generation.sql 的数据库。

ALTER TABLE ai_media_generation_task
  ADD COLUMN stage varchar(24) NOT NULL DEFAULT 'QUEUED' COMMENT '真实任务阶段' AFTER status,
  MODIFY COLUMN progress int NULL COMMENT '仅供应商返回真实进度时记录',
  ADD COLUMN model_profile varchar(20) NULL COMMENT 'FAST/QUALITY' AFTER progress,
  ADD COLUMN content_label varchar(32) NULL COMMENT 'AI内容可信标识' AFTER model_profile,
  ADD COLUMN experience_context json NULL COMMENT '未来体验层关联上下文' AFTER content_label,
  ADD COLUMN client_request_id varchar(64) NULL COMMENT '客户端幂等请求ID' AFTER experience_context,
  ADD COLUMN stage_updated_time datetime NULL AFTER finished_time,
  ADD UNIQUE KEY uk_user_client_request (user_id, client_request_id);

UPDATE ai_media_generation_task
SET stage = CASE status
  WHEN 'SUCCEEDED' THEN 'SUCCEEDED'
  WHEN 'FAILED' THEN 'FAILED'
  WHEN 'CANCELED' THEN 'CANCELED'
  WHEN 'PROCESSING' THEN 'GENERATING'
  ELSE 'QUEUED'
END,
stage_updated_time = COALESCE(update_time, create_time)
WHERE stage = 'QUEUED' OR stage_updated_time IS NULL;

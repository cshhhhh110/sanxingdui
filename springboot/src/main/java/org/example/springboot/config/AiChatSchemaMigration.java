package org.example.springboot.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AiChatSchemaMigration implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        ensureSessionTable();
        ensureMessageTable();
        ensureAttachmentTable();
        ensureVisualAidProposalTable();
        log.info("AI chat schema migration checked");
    }

    private void ensureSessionTable() {
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS ai_chat_session (
                  id BIGINT NOT NULL AUTO_INCREMENT,
                  session_id VARCHAR(64) NOT NULL,
                  user_id BIGINT NOT NULL,
                  title VARCHAR(255) DEFAULT NULL,
                  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                  PRIMARY KEY (id),
                  UNIQUE KEY uk_ai_chat_session_id (session_id),
                  KEY idx_ai_chat_session_user_update (user_id, update_time)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                """);
        addColumnIfMissing("ai_chat_session", "summary",
                "ALTER TABLE ai_chat_session ADD COLUMN summary VARCHAR(1000) NULL AFTER title");
        addColumnIfMissing("ai_chat_session", "status",
                "ALTER TABLE ai_chat_session ADD COLUMN status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' AFTER summary");
        addColumnIfMissing("ai_chat_session", "current_artifact",
                "ALTER TABLE ai_chat_session ADD COLUMN current_artifact VARCHAR(255) NULL AFTER status");
        addColumnIfMissing("ai_chat_session", "current_trail_node",
                "ALTER TABLE ai_chat_session ADD COLUMN current_trail_node VARCHAR(255) NULL AFTER current_artifact");
        addColumnIfMissing("ai_chat_session", "active_guide_state",
                "ALTER TABLE ai_chat_session ADD COLUMN active_guide_state LONGTEXT NULL AFTER current_trail_node");
        addColumnIfMissing("ai_chat_session", "context_json",
                "ALTER TABLE ai_chat_session ADD COLUMN context_json LONGTEXT NULL AFTER active_guide_state");
        addColumnIfMissing("ai_chat_session", "last_visual_aid_task",
                "ALTER TABLE ai_chat_session ADD COLUMN last_visual_aid_task VARCHAR(64) NULL AFTER context_json");
    }

    private void ensureMessageTable() {
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS ai_chat_message (
                  id BIGINT NOT NULL AUTO_INCREMENT,
                  session_id VARCHAR(64) NOT NULL,
                  role VARCHAR(32) NOT NULL,
                  content LONGTEXT,
                  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                  PRIMARY KEY (id),
                  KEY idx_ai_chat_message_session_create (session_id, create_time)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                """);

        addColumnIfMissing("ai_chat_message", "message_type",
                "ALTER TABLE ai_chat_message ADD COLUMN message_type VARCHAR(32) NOT NULL DEFAULT 'TEXT' AFTER content");
        addColumnIfMissing("ai_chat_message", "raw_content",
                "ALTER TABLE ai_chat_message ADD COLUMN raw_content LONGTEXT NULL AFTER message_type");
        addColumnIfMissing("ai_chat_message", "processed_content",
                "ALTER TABLE ai_chat_message ADD COLUMN processed_content LONGTEXT NULL AFTER raw_content");
        addColumnIfMissing("ai_chat_message", "client_message_id",
                "ALTER TABLE ai_chat_message ADD COLUMN client_message_id VARCHAR(100) NULL AFTER processed_content");
        addColumnIfMissing("ai_chat_message", "trace_json",
                "ALTER TABLE ai_chat_message ADD COLUMN trace_json LONGTEXT NULL AFTER client_message_id");
        addColumnIfMissing("ai_chat_message", "references_json",
                "ALTER TABLE ai_chat_message ADD COLUMN references_json LONGTEXT NULL AFTER trace_json");
        addColumnIfMissing("ai_chat_message", "ui_payload",
                "ALTER TABLE ai_chat_message ADD COLUMN ui_payload LONGTEXT NULL AFTER references_json");
        addIndexIfMissing("ai_chat_message", "uk_ai_chat_message_client",
                "CREATE UNIQUE INDEX uk_ai_chat_message_client ON ai_chat_message(session_id, client_message_id)");
    }

    private void ensureVisualAidProposalTable() {
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS ai_visual_aid_proposal (
                  id BIGINT NOT NULL AUTO_INCREMENT,
                  proposal_id VARCHAR(64) NOT NULL,
                  user_id BIGINT NOT NULL,
                  session_id VARCHAR(64) NOT NULL,
                  message_id VARCHAR(100) NOT NULL,
                  artifact_id VARCHAR(100) DEFAULT NULL,
                  artifact_name VARCHAR(100) DEFAULT NULL,
                  title VARCHAR(255) NOT NULL,
                  reason VARCHAR(1000) NOT NULL,
                  prompt LONGTEXT NOT NULL,
                  purpose VARCHAR(40) DEFAULT 'GUIDE_SUPPORT',
                  content_label VARCHAR(40) DEFAULT 'AI_ILLUSTRATION',
                  knowledge_focus LONGTEXT,
                  source_references LONGTEXT,
                  status VARCHAR(32) NOT NULL DEFAULT 'PROPOSED',
                  generation_task_id VARCHAR(64) DEFAULT NULL,
                  client_request_id VARCHAR(64) DEFAULT NULL,
                  expires_at DATETIME DEFAULT NULL,
                  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                  PRIMARY KEY (id),
                  UNIQUE KEY uk_visual_aid_proposal_id (proposal_id),
                  KEY idx_visual_aid_session_message (session_id, message_id),
                  KEY idx_visual_aid_user_status (user_id, status)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                """);
    }

    private void ensureAttachmentTable() {
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS ai_chat_message_attachment (
                  id BIGINT NOT NULL AUTO_INCREMENT,
                  message_id BIGINT NOT NULL,
                  file_id BIGINT DEFAULT NULL,
                  media_type VARCHAR(32) DEFAULT NULL,
                  file_name VARCHAR(255) DEFAULT NULL,
                  file_path VARCHAR(1024) DEFAULT NULL,
                  mime_type VARCHAR(128) DEFAULT NULL,
                  file_size BIGINT DEFAULT NULL,
                  analysis_status VARCHAR(32) DEFAULT NULL,
                  extracted_text LONGTEXT,
                  extracted_meta LONGTEXT,
                  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                  PRIMARY KEY (id),
                  KEY idx_ai_chat_attachment_message (message_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                """);
    }

    private void addColumnIfMissing(String tableName, String columnName, String ddl) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = ?
                  AND COLUMN_NAME = ?
                """, Integer.class, tableName, columnName);

        if (count == null || count == 0) {
            jdbcTemplate.execute(ddl);
            log.info("Added missing AI chat column {}.{}", tableName, columnName);
        }
    }

    private void addIndexIfMissing(String tableName, String indexName, String ddl) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM information_schema.STATISTICS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = ?
                  AND INDEX_NAME = ?
                """, Integer.class, tableName, indexName);
        if (count == null || count == 0) {
            jdbcTemplate.execute(ddl);
            log.info("Added missing AI chat index {}.{}", tableName, indexName);
        }
    }
}

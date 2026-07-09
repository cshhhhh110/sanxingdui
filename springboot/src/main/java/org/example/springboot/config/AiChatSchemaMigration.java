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
}

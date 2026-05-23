package org.example.springboot.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.example.springboot.common.Result;
import org.example.springboot.service.UserService;
import org.example.springboot.util.SysCache;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;


@Component
public class JwtInterceptor implements HandlerInterceptor {
    public static final Logger LOGGER = LoggerFactory.getLogger(HandlerInterceptor.class);
    @Resource
    private UserService userService;
    private static final ObjectMapper MAPPER = new ObjectMapper();
    @Override
    public boolean preHandle(HttpServletRequest request,  HttpServletResponse response,  Object handler) throws Exception {
        // 检查请求路径，对登录、注册相关请求不进行token验证
        String requestURI = request.getRequestURI();
        if (isAuthExcludedPath(requestURI)) {
            LOGGER.info("登录/注册相关路径，不进行token验证：{}", requestURI);
            return true;
        }
        if (!SysCache.isAllow() || SysCache.isBlack()) {
            response.setContentType("application/json;charset=utf-8");
            Result<?> error = Result.error("加载数据失败");
            response.getWriter().write(MAPPER.writeValueAsString(error));
            return false;
        }
        return HandlerInterceptor.super.preHandle(request, response, handler);
    }
    
    /**
     * 判断请求路径是否属于无需验证token的路径
     * @param requestURI 请求路径
     * @return 是否排除验证
     */
    private boolean isAuthExcludedPath(String requestURI) {
        // 排除登录、注册、忘记密码等相关路径
        return requestURI.contains("/api/user/login") ||
               requestURI.contains("/api/user/register") ||
               requestURI.contains("/api/user/add") ||
               requestURI.contains("/api/user/update") ||
               requestURI.contains("/api/user/forget") ||
               requestURI.contains("/api/email/") ||
               requestURI.contains("/api/captcha/") ||
               // 静态资源路径
               requestURI.contains("/api/img/") ||
               requestURI.contains("/api/file/") ||
               // Swagger和文档相关路径
               requestURI.contains("/api/swagger-ui/") ||
               requestURI.contains("/api/swagger-resources/") ||
               requestURI.contains("/api/v3/api-docs/") ||
               requestURI.contains("/api/doc.html") ||
               requestURI.contains("/api/webjars/");
    }
}

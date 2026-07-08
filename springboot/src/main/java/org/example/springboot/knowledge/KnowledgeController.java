package org.example.springboot.knowledge;

import lombok.RequiredArgsConstructor;
import org.example.springboot.common.Result;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/agent/knowledge")
@RequiredArgsConstructor
public class KnowledgeController {

    private final KnowledgeIndexService knowledgeIndexService;

    @GetMapping("/status")
    public Result<KnowledgeStatusDTO> status() {
        return Result.success(knowledgeIndexService.status());
    }

    @GetMapping("/search")
    public Result<KnowledgeSearchResponseDTO> search(
            @RequestParam String query,
            @RequestParam(defaultValue = "3") int limit
    ) {
        return Result.success(knowledgeIndexService.search(query, limit));
    }

    @PostMapping("/sync")
    public ResponseEntity<Result<KnowledgeStatusDTO>> sync() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = authentication != null
                && authentication.isAuthenticated()
                && authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
        if (!isAdmin) {
            return ResponseEntity.status(403)
                    .body(Result.error("403", "仅管理员可以手动同步知识库"));
        }
        return ResponseEntity.ok(Result.success("知识库同步完成", knowledgeIndexService.sync()));
    }
}

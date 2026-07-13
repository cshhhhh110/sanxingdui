package org.example.springboot.agent;

import lombok.RequiredArgsConstructor;
import org.example.springboot.common.Result;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping({"/agent/tools", "/api/agent/tools"})
@RequiredArgsConstructor
public class AgentToolController {

    private final AgentWeatherService weatherService;
    private final AgentToolRegistry toolRegistry;

    @GetMapping
    public Result<List<Map<String, Object>>> tools() {
        List<Map<String, Object>> tools = toolRegistry.getEnabledTools().values().stream()
                .map(tool -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("name", tool.name());
                    item.put("toolName", tool.name());
                    item.put("category", tool.category());
                    item.put("description", tool.description());
                    item.put("riskLevel", tool.riskLevel());
                    item.put("inputSchema", tool.inputSchema());
                    item.put("outputSchema", tool.outputSchema());
                    return item;
                })
                .toList();
        return Result.success(tools);
    }

    @GetMapping("/weather")
    public Result<Map<String, Object>> weather(@RequestParam String city) {
        return Result.success(weatherService.getCurrentWeather(city));
    }

    @GetMapping("/datetime")
    public Result<Map<String, Object>> currentDateTime() {
        ZonedDateTime now = ZonedDateTime.now(ZoneId.of("Asia/Shanghai"));
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(
                "yyyy\u5e74M\u6708d\u65e5 EEEE HH:mm",
                Locale.CHINA
        );

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("timezone", "Asia/Shanghai");
        result.put("isoDateTime", now.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
        result.put("message", "\u73b0\u5728\u662f\u5317\u4eac\u65f6\u95f4 " + now.format(formatter) + "\u3002");
        return Result.success(result);
    }
}

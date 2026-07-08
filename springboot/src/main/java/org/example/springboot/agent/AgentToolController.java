package org.example.springboot.agent;

import lombok.RequiredArgsConstructor;
import org.example.springboot.common.Result;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;

@RestController
@RequestMapping("/agent/tools")
@RequiredArgsConstructor
public class AgentToolController {

    private final AgentWeatherService weatherService;

    @GetMapping("/weather")
    public Result<Map<String, Object>> weather(@RequestParam String city) {
        return Result.success(weatherService.getCurrentWeather(city));
    }

    @GetMapping("/datetime")
    public Result<Map<String, Object>> currentDateTime() {
        ZonedDateTime now = ZonedDateTime.now(ZoneId.of("Asia/Shanghai"));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("timezone", "Asia/Shanghai");
        result.put("isoDateTime", now.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
        result.put("message", "现在是北京时间" + now.format(DateTimeFormatter.ofPattern("yyyy年M月d日 EEEE HH:mm")) + "。");
        return Result.success(result);
    }
}

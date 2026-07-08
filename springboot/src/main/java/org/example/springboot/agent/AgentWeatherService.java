package org.example.springboot.agent;

import org.example.springboot.exception.BusinessException;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AgentWeatherService {

    private final RestClient geocodingClient = RestClient.create("https://geocoding-api.open-meteo.com");
    private final RestClient weatherClient = RestClient.create("https://api.open-meteo.com");

    @SuppressWarnings("unchecked")
    public Map<String, Object> getCurrentWeather(String city) {
        String normalizedCity = city == null ? "" : city.trim();
        if (normalizedCity.length() < 2 || normalizedCity.length() > 50) {
            throw new BusinessException("请输入有效的城市名称");
        }

        Map<String, Object> geocoding = geocodingClient.get()
                .uri(uri -> uri.path("/v1/search")
                        .queryParam("name", normalizedCity)
                        .queryParam("count", 1)
                        .queryParam("language", "zh")
                        .queryParam("format", "json")
                        .build())
                .retrieve()
                .body(Map.class);
        List<Map<String, Object>> locations = geocoding == null
                ? List.of()
                : (List<Map<String, Object>>) geocoding.getOrDefault("results", List.of());
        if (locations.isEmpty()) {
            throw new BusinessException("未找到城市：" + normalizedCity);
        }

        Map<String, Object> location = locations.get(0);
        Number latitude = asNumber(location.get("latitude"));
        Number longitude = asNumber(location.get("longitude"));
        Map<String, Object> forecast = weatherClient.get()
                .uri(uri -> uri.path("/v1/forecast")
                        .queryParam("latitude", latitude)
                        .queryParam("longitude", longitude)
                        .queryParam("current", "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m")
                        .queryParam("daily", "temperature_2m_max,temperature_2m_min,precipitation_probability_max")
                        .queryParam("forecast_days", 1)
                        .queryParam("timezone", "auto")
                        .build())
                .retrieve()
                .body(Map.class);
        if (forecast == null || !(forecast.get("current") instanceof Map<?, ?> currentRaw)) {
            throw new BusinessException("天气服务暂时不可用");
        }

        Map<String, Object> current = (Map<String, Object>) currentRaw;
        Map<String, Object> daily = forecast.get("daily") instanceof Map<?, ?> value
                ? (Map<String, Object>) value
                : Map.of();
        int weatherCode = asNumber(current.get("weather_code")).intValue();
        String locationName = displayLocation(location);
        Object high = first(daily.get("temperature_2m_max"));
        Object low = first(daily.get("temperature_2m_min"));
        Object rainChance = first(daily.get("precipitation_probability_max"));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("city", locationName);
        result.put("observedAt", current.get("time"));
        result.put("condition", describeWeather(weatherCode));
        result.put("temperatureC", current.get("temperature_2m"));
        result.put("apparentTemperatureC", current.get("apparent_temperature"));
        result.put("humidityPercent", current.get("relative_humidity_2m"));
        result.put("windSpeedKmh", current.get("wind_speed_10m"));
        result.put("precipitationMm", current.get("precipitation"));
        result.put("todayHighC", high);
        result.put("todayLowC", low);
        result.put("rainProbabilityPercent", rainChance);
        result.put("message", String.format(
                "%s当前%s，%s℃，体感%s℃；今日%s℃至%s℃，湿度%s%%，风速%s km/h，最高降水概率%s%%。",
                locationName, describeWeather(weatherCode), current.get("temperature_2m"),
                current.get("apparent_temperature"), low, high,
                current.get("relative_humidity_2m"), current.get("wind_speed_10m"), rainChance
        ));
        return result;
    }

    private Number asNumber(Object value) {
        if (value instanceof Number number) return number;
        throw new BusinessException("天气服务返回了无效数据");
    }

    private Object first(Object value) {
        return value instanceof List<?> list && !list.isEmpty() ? list.get(0) : "未知";
    }

    private String displayLocation(Map<String, Object> location) {
        String name = String.valueOf(location.getOrDefault("name", ""));
        String admin = String.valueOf(location.getOrDefault("admin1", ""));
        return admin.isBlank() || admin.equals(name) ? name : admin + " " + name;
    }

    private String describeWeather(int code) {
        return switch (code) {
            case 0 -> "晴朗";
            case 1, 2 -> "少云";
            case 3 -> "阴天";
            case 45, 48 -> "有雾";
            case 51, 53, 55, 56, 57 -> "毛毛雨";
            case 61, 63, 65, 66, 67 -> "下雨";
            case 71, 73, 75, 77 -> "下雪";
            case 80, 81, 82 -> "阵雨";
            case 85, 86 -> "阵雪";
            case 95, 96, 99 -> "雷暴";
            default -> "天气状况未知";
        };
    }
}

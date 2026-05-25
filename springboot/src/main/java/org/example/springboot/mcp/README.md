# MCP (Model Context Protocol) 后端服务

## 概述

本模块实现了后端 MCP Server，用于处理前端自然语言指令的后端逻辑。

## 项目结构

```
src/main/java/org/example/springboot/mcp/
├── config/
│   └── McpAutoConfig.java         # MCP 自动配置
├── dto/
│   ├── McpToolCallRequest.java    # 工具调用请求
│   ├── McpToolCallResponse.java   # 工具调用响应
│   └── McpToolDefinition.java     # 工具定义
├── tool/
│   ├── McpTool.java              # 工具接口
│   └── impl/
│       ├── GetProductDetailTool.java   # 获取商品详情
│       ├── GetUserInfoTool.java        # 获取用户信息
│       ├── IntentParserTool.java       # 意图解析
│       ├── NavigateToTool.java          # 页面导航
│       ├── SearchHeritageTool.java      # 搜索文物
│       └── SearchProductTool.java      # 搜索商品
├── McpController.java             # REST API 控制器
└── McpToolRegistry.java          # 工具注册中心
```

## API 接口

### 1. 获取工具列表
```
GET /api/mcp/tools
```

响应示例:
```json
{
  "success": true,
  "tools": [
    {
      "name": "search_product",
      "description": "搜索商城商品",
      "category": "SEARCH",
      "requireAuth": false
    }
  ],
  "count": 5
}
```

### 2. 调用工具
```
POST /api/mcp/call
Content-Type: application/json
X-User-Id: 123456

{
  "tool": "search_product",
  "params": {
    "keyword": "三星堆",
    "page": 1,
    "pageSize": 10
  }
}
```

响应示例:
```json
{
  "success": true,
  "data": {
    "keyword": "三星堆",
    "results": [...],
    "total": 25,
    "pages": 3
  },
  "message": "搜索到 25 个商品",
  "tool": "search_product",
  "duration": 45
}
```

### 3. 批量调用工具
```
POST /api/mcp/batch
Content-Type: application/json

{
  "requests": [
    {"tool": "search_product", "params": {"keyword": "青铜"}},
    {"tool": "get_user_info", "params": {}}
  ]
}
```

### 4. 检查工具是否存在
```
GET /api/mcp/tools/{name}
```

### 5. 服务状态检查
```
GET /api/mcp/status
```

## 已实现的工具

| 工具名称 | 描述 | 需要认证 |
|---------|------|---------|
| `search_product` | 搜索商城商品 | 否 |
| `search_heritage` | 搜索非遗文物 | 否 |
| `get_product_detail` | 获取商品详情 | 否 |
| `get_user_info` | 获取用户信息 | 是 |
| `navigate_to` | 页面导航 | 否 |
| `intent_parse` | 意图解析 | 否 |

## 添加新工具

1. 创建工具实现类，实现 `McpTool` 接口:

```java
@Component
public class MyCustomTool implements McpTool {
    
    @Override
    public String getName() {
        return "my_custom_tool";
    }
    
    @Override
    public String getDescription() {
        return "我的自定义工具";
    }
    
    @Override
    public String getCategory() {
        return "CUSTOM";
    }
    
    @Override
    public McpToolCallResponse execute(Map<String, Object> params, Long userId) {
        // 实现工具逻辑
        return McpToolCallResponse.success(data, "操作成功");
    }
}
```

2. 工具将自动注册（通过 `@Component` 注解）

## 前端集成

前端通过以下方式调用后端 MCP:

```javascript
import { mcpClient } from '@/mcp'

// 处理自然语言输入
const result = await mcpClient.processInput('帮我搜索三星堆文物')

// 直接调用工具
const result = await mcpClient.callBackendTool('search_product', {
  keyword: '青铜器',
  page: 1
})
```

## 配置说明

工具会自动注册到 `McpToolRegistry`，控制器会自动扫描并注册所有实现了 `McpTool` 接口的组件。

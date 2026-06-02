# 口播录音工具

这是一个可迁移的 MiMo TTS 直连命令行工具。运行后，在终端输入文字并回车，工具会调用小米 MiMo 接口生成 `wav` 音频。

## 使用前准备

- 安装 Node.js 18 或更高版本。
- 复制 `.env.example` 为 `.env`，并填入你的 MiMo API Key。
- `.env` 是本地私有配置，不要提交到 GitHub。

## 启动方式

双击：

```text
start-voiceover.cmd
```

或在当前目录执行：

```powershell
npm start
```

## 基本用法

启动后直接输入口播文字：

```text
欢迎来到青铜数元
```

生成的音频默认保存到：

```text
voiceover_output/
```

文件名格式：

```text
YYYYMMDD-HHmmss_文本前12字_音色.wav
```

## 可用命令

```text
/voice suda
/voice bingtang
/voice moli
/voice default
/voice zh_female
/voice sweet
/speed 1.0
/out D:\口播输出
/status
/help
exit
quit
```

## 配置

`.env.example` 中的字段：

```text
TTS_API_KEY=YOUR_MIMO_API_KEY
TTS_BASE_URL=https://token-plan-sgp.xiaomimimo.com/v1
TTS_MODEL=mimo-v2.5-tts
TTS_VOICE=suda
TTS_SPEED=1.0
TTS_OUTPUT_DIR=voiceover_output
```

说明：

- `TTS_API_KEY`：小米 MiMo API Key。
- `TTS_BASE_URL`：MiMo OpenAI 兼容接口地址。
- `TTS_MODEL`：TTS 模型，当前使用 `mimo-v2.5-tts`。
- `TTS_VOICE`：默认音色，可选 `suda`、`bingtang`、`moli`、`default`、`zh_female`、`sweet`。
- `TTS_SPEED`：默认语速。
- `TTS_OUTPUT_DIR`：默认输出目录，支持相对路径和绝对路径。

## 迁移方式

复制整个目录：

```text
tools/voiceover-cli/
```

到任意电脑或任意位置即可。新环境只需要 Node.js 18+ 和可用的 MiMo API Key。

## 注意事项

- 单段文本不能超过 500 字；超过会提示拆分。
- 请求失败会自动重试 2 次。
- 输出格式固定为 `wav`。

# Agent Architecture

## Request flow

All user-facing chat surfaces use the same flow:

```text
text or attachment metadata
  -> AgentRouterService
  -> TOOL_CALL | RAG | DIRECT_ANSWER | UNSUPPORTED
  -> route-specific handler
```

The Agent owns intent routing. MCP owns tool discovery and execution. MCP must not
classify natural-language input with local keyword rules.

## Route responsibilities

- `TOOL_CALL`: Execute one enabled tool after server-side name and argument validation.
- `RAG`: Retrieve local project knowledge, build a grounded prompt, then call the chat model.
- `DIRECT_ANSWER`: Return the final general answer from the routing call; do not make a second model call.
- `UNSUPPORTED`: Return a capability gap instead of guessing or selecting an unrelated tool.

When routing is unavailable, the safe fallback is `DIRECT_ANSWER`; it must never be an
automatic tool call.

## Tool registration

`AgentToolRegistry` is the server-side source of truth for tools visible to the model.
Adding a tool requires:

1. A registry definition and risk level.
2. Strict argument normalization and validation.
3. A matching client or server executor.
4. Confirmation for destructive or financial actions.
5. Parser and end-to-end tests.

Tools that are implemented in the frontend but absent from the registry are not available
to the Agent.

The active registry includes public navigation and search, trail control, weather,
Beijing date/time, artifact voice, quizzes, courses, cart and order viewing. Legacy local
keyword parsers are not part of the chat request flow.

## Multimodal ingestion

Both chat surfaces upload files through `POST /api/agent/attachments` and pass only the
returned opaque file ID to `POST /api/agent/route`. The server detects the actual media
type, applies modality-specific size limits, and stores temporary files for 30 minutes.

- Documents are parsed with Apache Tika and clipped to a bounded text context.
- Images are analyzed with the configured vision model.
- Audio is transcribed with the configured speech-recognition model.
- Video is reduced to a representative frame and a bounded audio track with FFmpeg, then
  passed through the image and audio adapters.

Normalized attachment context is available to the routing model and to the final answer
model. Local paths are never accepted from clients or returned in API responses. The
current pipeline validates type and size but does not include malware scanning; add that
gate before accepting files from untrusted public deployments.

## Obsidian knowledge index

The `RAG` route uses a backend-owned, read-only index of the Obsidian Vault instead of
letting browsers load a fixed set of text files. The default published Vault lives at
`springboot/knowledge-vault/wiki`; production can point at an independently maintained
Vault by setting `KNOWLEDGE_VAULT_PATH` to its `wiki/` directory.

The indexer:

1. Accepts Markdown files only and resolves every real path beneath the configured root.
2. Parses Frontmatter fields, tags, sources, related pages, and Obsidian wikilinks.
3. Uses SHA-256 to reuse unchanged documents during scheduled or manual refreshes.
4. Ranks Chinese queries with title, metadata, lexical relevance, and linked-page boosts.
5. Returns bounded model context plus source metadata; it never exposes absolute file paths.

Endpoints:

- `GET /api/agent/knowledge/status`: index health and document count.
- `GET /api/agent/knowledge/search?query=...&limit=3`: ranked documents and bounded context.
- `POST /api/agent/knowledge/sync`: administrator-only manual incremental refresh.

Both chat surfaces call the same search API through `searchKnowledge()`. If the backend
index is unavailable, the client falls back to the legacy static text set so that chat
degrades without converting a knowledge question into an unrelated tool call.

Only curated `wiki/` pages belong in the production index. `.raw/`, Obsidian plugin data,
API keys, PDFs, and private notes must remain outside the published directory.

## Compatibility

`POST /api/agent/route` is the canonical endpoint. `POST /api/agent/intent` remains a legacy
adapter that maps every non-tool route to `QUESTION`.

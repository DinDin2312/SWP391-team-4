# NEXUS AI – Hybrid RAG & Latency Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Member AI and Coach AI answer fast (first words < 2 s) and readable, grounded in a real vector-retrieved knowledge base (Hybrid RAG) plus live SQL data.

**Architecture:** New `modules/rag` package: text chunker → Gemini embeddings → vectors stored in MySQL (JSON) → loaded into an in-memory index → exact cosine top-K search. Both chat services share one `GeminiClient` (pooled HTTP, configurable model, fail-fast, timing logs) and a prompt that contains top-K knowledge chunks + only the live SQL data relevant to the question. Frontend renders Markdown safely, sends short chat history, and streams the answer.

**Tech Stack:** Spring Boot 4.1.1 / Java 21, MySQL 8 + Flyway, Gemini REST API (`generateContent`, `streamGenerateContent`, `batchEmbedContents`), React + node:test.

**Spec:** Decisions agreed in chat on 2026-11-01 (summarised in "Root causes" and "Decisions" below).

## Root causes found in the current code (evidence)

| Symptom | Cause | Where |
|---|---|---|
| Slow | 3 models tried **sequentially**, each with 5 s connect + 15 s read timeout → up to ~60 s before the "server overloaded" message; exceptions swallowed, so nobody sees why | `AiChatServiceImpl.java:170-191`, `CoachAiChatServiceImpl.java:187-208` |
| Slow | `new RestTemplate` per request (new TLS handshake every message) | same files, lines 92-95 / 160-163 |
| Slow | Every message rebuilds the whole catalogue (all packages, all classes, bookings, health; coach: all exercises + all students + assessments) and stuffs it into the prompt | `AiChatServiceImpl.java:48-90`, `CoachAiChatServiceImpl.java:47-118` |
| Slow (perceived) | No streaming: user stares at "typing…" until all ≤1200/3000 tokens are generated | both services + `NexusAiChat.jsx:345` |
| Hard to read | Gemini returns Markdown (`**bold**`, `-` lists, `###`) but UI prints raw text (`whitespace-pre-wrap {msg.text}`) → visible asterisks/hashes | `NexusAiChat.jsx:421-427`, same in `CoachNexusAiChat.jsx` |
| Hard to follow | Stateless: only the current message is sent, AI forgets the previous turn ("cái đó" / "lớp kia" make no sense to it) | `NexusAiChat.jsx:345` |

> [!IMPORTANT]
> RAG alone fixes *answer quality and prompt size*, not latency. It even adds one embedding call (~150–400 ms). The speed wins come from Tasks 1 and 7. That is why they are in this plan.

## Decisions

- Vector store: MySQL `JSON` column + in-memory `float[]` index, exact cosine search (no Docker, no new infra). Target size ≤ 10 000 chunks.
- Embedding model: config `gemini.embedding.model` (default `gemini-embedding-001`, `outputDimensionality=768`). Task 1 verifies the name with ListModels; change config, not code, if it differs.
- Chat model: config `gemini.chat.model` + one `gemini.chat.fallback-model`; names verified in Task 1 (the current `gemini-3.8-flash` / `gemini-3.5-flash-lite` are unverified).
- Knowledge source (v1): Markdown files in `Backend/src/main/resources/rag/knowledge/*.md`, ingested at startup; re-embedded only when the file's SHA-256 changes. Manager upload UI is **out of scope** (YAGNI) — can be added later on top of `DocumentIngestionService`.
- No new npm packages: a small, XSS-safe Markdown renderer that builds React elements (never `dangerouslySetInnerHTML`).

## Global Constraints

- **Never `git commit` / `git push`.** Each task ends with tests + `git status` report to the user (AGENTS.md §5).
- Do not touch `sports-center-simulator`.
- Bilingual: every new UI string goes through `t(...)` with EN/VI entries in `Frontend/src/i18n/messages.js`; works in Light/Dark mode.
- API key only from `GEMINI_API_KEY` env (`gemini.api.key=${GEMINI_API_KEY:}`); never log the key or full URLs containing it.
- Existing `[ACTION:...]` tag contract (NAVIGATE, ADD_CART, BOOK_CLASS, PREFILL_SINGLE_WORKOUT, PREFILL_TRAINING_PLAN) must keep working unchanged.
- Backend tests: `mvn test` stays green; Frontend: `npm test` stays green with ≥ 95 % line coverage. New frontend test files are appended to the `test:coverage` script list in `Frontend/package.json`.

## Review Focus

1. **No API key / Gemini down / quota 429** → chat returns a clear message within ≤ 8 s, never hangs; RAG degrades to "no chunks" instead of failing the request. (Tests in Task 1 + Task 5.)
2. **Empty knowledge base or nothing above threshold** → prompt has no "KNOWLEDGE" block and AI must not invent citations. (Task 5.)
3. **Vietnamese text without spaces issues / very long paragraphs** → chunker never produces a chunk > `maxChars` and never cuts inside a word. (Task 3.)
4. **Malicious model output** (`<script>`, `<img onerror>`, `[x](javascript:...)`) → rendered as plain text, links only `http(s)`. (Task 2.)
5. **Action tag split across stream chunks** → tags are parsed only from the final assembled text, never executed twice. (Task 7.)

---

### Task 1: Shared `GeminiClient` (fast-fail, pooled, measurable)

**Files:**
- Create: `Backend/src/main/java/com/team4/sportscenter/modules/rag/gemini/GeminiClient.java`
- Create: `Backend/src/main/java/com/team4/sportscenter/modules/rag/gemini/GeminiResponseParser.java`
- Modify: `Backend/src/main/resources/application.properties` (add keys below)
- Modify: `AiChatServiceImpl.java:92-193`, `CoachAiChatServiceImpl.java:159-211` → call `GeminiClient`
- Test: `Backend/src/test/java/com/team4/sportscenter/GeminiResponseParserTests.java`

**Interfaces:**
- Produces: `GeminiClient#generate(String prompt, int maxOutputTokens): Optional<String>`; `GeminiClient#embed(List<String> texts, EmbedTask task): List<float[]>` with `enum EmbedTask { RETRIEVAL_DOCUMENT, RETRIEVAL_QUERY }`; `GeminiResponseParser#text(Map<String,Object> body): Optional<String>`, `#embeddings(Map<String,Object> body): List<float[]>`.

Config keys: `gemini.chat.model`, `gemini.chat.fallback-model`, `gemini.embedding.model=gemini-embedding-001`, `gemini.embedding.dimensions=768`, `gemini.http.connect-timeout-ms=3000`, `gemini.http.read-timeout-ms=8000`.

- [ ] **Step 0: Baseline + verify model names.** With the backend running, time 3 member questions (`Measure-Command { Invoke-RestMethod ... }`) and record the numbers in the task report. Call `GET https://generativelanguage.googleapis.com/v1beta/models?key=$env:GEMINI_API_KEY` and put real model names into the config keys.
- [ ] **Step 1: Write failing tests** `GeminiResponseParserTests`: `text_returnsFirstPartText`, `text_emptyWhenNoCandidates`, `text_emptyWhenBlockedPromptFeedback`, `embeddings_parsesValuesInOrder` (two embeddings → `float[]` length 3 each, values equal input).
- [ ] **Step 2:** `mvn test -Dtest=GeminiResponseParserTests` → FAIL (class missing).
- [ ] **Step 3: Implement.** One `RestClient`/`RestTemplate` bean reused (pooled), timeouts from config. `generate`: try primary model; only on 5xx/429/timeout try fallback **once**; log `model`, HTTP status, elapsed ms at INFO, exception class at WARN (never the URL/key). Total worst case ≈ 2 × 8 s.
- [ ] **Step 4:** Replace the duplicated HTTP blocks in both chat services with `geminiClient.generate(...)`; keep existing fallback messages when `Optional.empty()`. Add timing log for "context build ms" vs "gemini ms".
- [ ] **Step 5:** `mvn test` → BUILD SUCCESS. Re-run Step 0 timings; report before/after.
- [ ] **Step 6:** `git status`, report changed files. **Do not commit.**

### Task 2: Readable answers – safe Markdown + short history

**Files:**
- Create: `Frontend/src/features/member/chatMarkdown.jsx` (renderer) and `Frontend/src/features/member/chatMarkdown.test.js`
- Modify: `NexusAiChat.jsx:345, 421-427`, `CoachNexusAiChat.jsx` (same two spots)
- Modify: `MemberController.java:142` & `CoachController.java:217` request DTO → optional `history`
- Modify: both chat services: prepend history to prompt
- Modify: `Frontend/package.json` (append test file)

**Interfaces:**
- Produces: `renderChatMarkdown(text: string): ReactNode[]` supporting `**bold**`, `*italic*`, `- `/`* `/`1. ` lists, `### ` headings, blank-line paragraphs, `http(s)` links only.
- Produces: request body `{ message: string, history?: [{ role: "user"|"model", text: string }] }` — last 6 turns, each text truncated to 500 chars server-side.
- Produces: `record Turn(String role, String text)` in `modules/rag/gemini/Turn.java`.

- [ ] **Step 1: Failing tests** (`renderToStaticMarkup`): bold → `<strong>`; `- a\n- b` → `<ul>` with 2 `<li>`; `<script>alert(1)</script>` appears escaped; `[x](javascript:alert(1))` renders no `href`; `[x](https://a.vn)` renders `href="https://a.vn"` with `rel="noopener noreferrer"`.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement renderer (line-based parser → React elements). Use it for bot messages only; user messages stay plain text.
- [ ] **Step 4:** Send last 6 turns as `history`; backend validates role ∈ {user, model}, caps at 6, truncates; adds them as prior `contents` entries in `GeminiClient#generate` (add overload `generate(List<Turn> history, String prompt, int max)`).
- [ ] **Step 5:** `npm test` (≥ 95 %) and `mvn test` green. Manually check one answer with a list in Light + Dark mode.
- [ ] **Step 6:** `git status`, report. **Do not commit.**

### Task 3: Knowledge storage + chunker

**Files:**
- Create: `Backend/src/main/resources/db/migration/V23__create_rag_knowledge_tables.sql`
- Create: `modules/rag/entities/KnowledgeDocument.java`, `DocumentChunk.java`
- Create: `modules/rag/repositories/KnowledgeDocumentRepository.java`, `DocumentChunkRepository.java`
- Create: `modules/rag/services/TextChunker.java`
- Modify: `Backend/database_init.sql` (same two tables, keep in sync)
- Test: `TextChunkerTests.java`

Tables:
- `KNOWLEDGE_DOCUMENTS(document_id PK, source_key VARCHAR(150) UNIQUE, title VARCHAR(255), category VARCHAR(40), audience ENUM('MEMBER','COACH','ALL'), content_hash CHAR(64), created_at, updated_at)`
- `DOCUMENT_CHUNKS(chunk_id PK, document_id FK ON DELETE CASCADE, chunk_index INT, content_text TEXT, embedding JSON NOT NULL, INDEX(document_id))`

**Interfaces:**
- Produces: `enum Audience { MEMBER, COACH, ALL }` in `modules/rag/entities/Audience.java`.
- Produces: `TextChunker#split(String markdown, int maxChars, int overlapChars): List<String>` (defaults 900 / 150); splits on headings → paragraphs → sentences → spaces; prefixes each chunk with its nearest `#` heading.

- [ ] **Step 1: Failing tests:** `split_respectsMaxChars` (5 000-char Vietnamese paragraph → every chunk ≤ 900); `split_neverCutsInsideWord`; `split_keepsHeadingContext` (chunk under `## Đau khớp gối` starts with that heading); `split_emptyInputReturnsEmptyList`; `split_overlapRepeatsTail`.
- [ ] **Step 2:** FAIL → **Step 3:** implement → **Step 4:** `mvn test` green (Flyway applies V23; `DatabaseMigrationTests` passes because it counts dynamically).
- [ ] **Step 5:** `git status`, report. **Do not commit.**

### Task 4: Vector index + search

**Files:**
- Create: `modules/rag/services/VectorMath.java`, `VectorIndex.java`, `RetrievalService.java`
- Create: `modules/rag/dtos/RetrievedChunk.java` (record: `documentTitle`, `category`, `text`, `score`)
- Test: `VectorMathTests.java`, `VectorIndexTests.java`

**Interfaces:**
- Produces: `record IndexedChunk(long chunkId, String documentTitle, String category, Audience audience, String text, float[] vector)`.
- Produces: `VectorMath#cosine(float[] a, float[] b): double` (0 when either norm is 0; throws on length mismatch); `VectorIndex#replaceAll(List<IndexedChunk>)`, `#topK(float[] query, int k, double minScore, Audience audience): List<RetrievedChunk>` (thread-safe, copy-on-write); `RetrievalService#retrieve(String question, Audience audience): List<RetrievedChunk>` — embeds with `RETRIEVAL_QUERY`, returns empty list on any embedding failure.
- Config: `rag.top-k=3`, `rag.min-score=0.60`, `rag.enabled=true`.

- [ ] **Step 1: Failing tests:** cosine identical = 1.0, orthogonal = 0.0, opposite = -1.0, zero vector = 0.0; `topK` returns highest scores in descending order, drops below `minScore`, filters by audience (`ALL` docs visible to both).
- [ ] **Step 2–4:** FAIL → implement → `mvn test` green.
- [ ] **Step 5:** `git status`, report. **Do not commit.**

### Task 5: Ingestion + seed knowledge + wire into both chats

**Files:**
- Create: `modules/rag/services/DocumentIngestionService.java` (+ `impl/`), `modules/rag/RagStartupLoader.java` (`ApplicationReadyEvent`, async)
- Create seed docs `Backend/src/main/resources/rag/knowledge/`: `chinh-sach-trung-tam.md` (ALL), `dinh-duong-tang-co-giam-mo.md` (ALL), `chan-thuong-khop-goi-vai-lung.md` (ALL), `ky-thuat-bai-tap-co-ban.md` (COACH), `huong-dan-dat-lich-va-goi-tap.md` (MEMBER). Front-matter: `title`, `category`, `audience`. Content must match real rules in `BUSINESS_RULES_AND_WORKFLOWS.md` (booking, refund/credit, reschedule, lost & found).
- Create: `modules/rag/services/PromptAssembler.java`
- Modify: `AiChatServiceImpl.java`, `CoachAiChatServiceImpl.java`
- Test: `PromptAssemblerTests.java`, `DocumentIngestionServiceTests.java` (Mockito: unchanged hash ⇒ `embed` never called)

**Interfaces:**
- Produces: `DocumentIngestionService#ingest(String sourceKey, String markdown): IngestResult` (`SKIPPED_UNCHANGED | INGESTED | FAILED`), batch-embeds ≤ 100 chunks per call; `PromptAssembler#knowledgeBlock(List<RetrievedChunk>): String` → `""` when empty, otherwise numbered `[1] (title) text` lines plus the rule "Only cite [n] that appear above; if the knowledge does not cover it, say so".
- Live-data slimming: member prompt keeps packages + open classes but only top 15 classes ranked by name/subject match with the question (simple keyword overlap); coach prompt sends the exercise list only when the message mentions giáo án/bài tập/plan/workout or a student name.

- [ ] **Step 1: Failing tests:** `knowledgeBlock_emptyWhenNoChunks`; `knowledgeBlock_numbersChunksAndIncludesTitles`; ingestion skips unchanged hash; ingestion marks `FAILED` and keeps old chunks when embedding throws.
- [ ] **Step 2–4:** FAIL → implement → `mvn test` green.
- [ ] **Step 5: Manual acceptance (record answers in report):** "Tập đẩy ngực xong bị nhói vai trước thì sao?" cites `[n]` from the injury doc; "Hủy lớp có được hoàn tiền không?" matches the center policy; with `GEMINI_API_KEY` unset → clear message, no crash; with knowledge folder empty → normal answer, no citations.
- [ ] **Step 6:** `git status`, report. **Do not commit.**

### Task 6: Show sources in the chat UI

**Files:**
- Modify: chat endpoints return `{ text: string, sources: [{ index, title, category }] }` (keep plain-string fallback for old clients: frontend accepts both shapes)
- Modify: `NexusAiChat.jsx`, `CoachNexusAiChat.jsx`: small "Nguồn tham khảo / Sources" chips under bot message
- Modify: `Frontend/src/i18n/messages.js`
- Test: extend `chatMarkdown.test.js` or new `chatSources.test.js` for the response-shape normaliser `normalizeChatResponse(data): { text, sources }`

- [ ] **Step 1:** Failing tests: string input → `{ text, sources: [] }`; object input passes through; missing `sources` → `[]`.
- [ ] **Step 2–4:** FAIL → implement → `npm test` (≥ 95 %) + `mvn test` green; check Light/Dark + EN/VI.
- [ ] **Step 5:** `git status`, report. **Do not commit.**

### Task 7: Streaming answers (biggest perceived-speed win)

**Files:**
- Modify: `GeminiClient` → `stream(List<Turn> history, String prompt, int max, Consumer<String> onDelta): Optional<String>` using `:streamGenerateContent?alt=sse`
- Create: `POST /api/v1/member/ai/chat/stream` and `POST /api/v1/coach/ai/chat/stream` returning `SseEmitter` (events: `delta`, `done` with `{ sources }`, `error`)
- Create: `Frontend/src/features/member/chatStream.js` + `chatStream.test.js` (SSE line parser, pure)
- Modify: both chat components: use `fetch` + `ReadableStream`, append deltas live, hide `[ACTION:...]` while streaming, parse/execute actions **once** on `done`. Keep the non-stream endpoint as fallback when streaming fails.

**Interfaces:**
- Produces: `parseSseChunk(buffer: string): { events: {event, data}[], rest: string }`; `stripPartialActionTag(text: string): string` (hides an unfinished trailing `[ACTION:` fragment).

- [ ] **Step 1: Failing tests:** event split across two chunks is reassembled; `[ACTION:ADD_CA` at the end is hidden; full tag executes exactly once at `done`.
- [ ] **Step 2–4:** FAIL → implement → `npm test` + `mvn test` green.
- [ ] **Step 5: Acceptance:** first visible words < 2 s on 3 questions (record timings next to Task 1 baseline).
- [ ] **Step 6:** `git status`, report. **Do not commit.**

---

## Out of scope (v1)

Manager upload/edit UI for documents, PDF parsing, re-ranking models, multi-turn memory persisted in DB, usage dashboards.

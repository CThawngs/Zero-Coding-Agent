# 📚 CORNELL NOTES: DAY 5 - SPEC-DRIVEN PRODUCTION GRADE DEVELOPMENT
**Course:** 5-Day AI Agents Intensive with Google × Kaggle  
**Date:** June 19, 2026  
**Unit:** 5 - Spec-Driven Production Grade Development in the Age of Vibe Coding  
**Author:** Lee Boonstra (Google/Kaggle)  

**Resources:**  
- 🎧 Podcast: https://www.youtube.com/watch?v=VSRdL4wlbLY (21:17 min)  
- 📄 Whitepaper (38 pages): https://www.kaggle.com/whitepaper-spec-driven-production-grade-development-in-the-age-of-vibe-coding  
- 🧪 Codelab 1 (Optional): Deploy expense agent to Google Cloud Agent Runtime  
- 🧪 Codelab 2 (Optional): Vibe code frontend with Antigravity, link to cloud agent

---

## ════════════════════════════════════════════════════════════════
## 🔑 KEYWORDS / QUESTIONS (Cues)
════════════════════════════════════════════════════════════════

| # | Keyword / Question | English |
|---|-------------------|---------|
| 1 | 180-degree flip | Paradigm shift in dev workflow |
| 2 | Illusion of Speed | Illusion of Speed - bug-to-code ratio |
| 3 | Spec-Driven Development (SDD) | Spec-Driven Development - specs as source of truth |
| 4 | Code = disposable | Code is disposable, specs are assets |
| 5 | Flat YAML format | Flat YAML parsing accuracy 51.9% |
| 6 | Gherkin syntax | Given-When-Then behavior-driven specs |
| 7 | Context Architecture | Hierarchical instruction management |
| 8 | Execution Modes | Architect, Builder, Forensic, Author, Librarian |
| 9 | Forensic Mode | Evidence prompting protocol |
|10 | MCP | Model Context Protocol - USB-C for AI tools |
|11 | Zero-Trust Development | Zero-Trust - sandboxing, guardrails, policy server |
|12 | AI-Generated Test Coverage | AI-generated test coverage for confidence |
|13 | Policy Server | Hybrid policy server for enforcement |
|14 | Team Culture Evolution | Team culture & process evolution |
|15 | Code Reviews | AI-assisted code reviews with turn-by-turn |

---

## ════════════════════════════════════════════════════════════════
## 📝 NOTES (English → Vietnamese in each section)
════════════════════════════════════════════════════════════════

### 1. INTRODUCTION & PARADIGM SHIFT / GIỚI THIỆU & SỰ CHUYỂN DỊCH PARADIGM

**English:**  
The daily routine of Google Software Engineers has flipped 180° in one year. From manual line-by-line coding, digging through docs, debugging intent discrepancies → **managing "legion of sleepless AI interns"** (Antigravity, Gemini CLI).  
**Illusion of Speed** is real: velocity overdrive but bug-to-code ratio remains challenging. AI generates bugs at unprecedented rate. **Vibe Coding ≠ Vibe In Production.**  
**Solution:** Spec-Driven Development (SDD) — specs as source of truth, code becomes disposable.

**Tiếng Việt:**  
Thói quen hàng ngày của Kỹ sư Google đã đảo ngược 180° trong 1 năm. Từ code thủ công từng dòng, đọc docs, debug sự chênh lệch ý định → **quản lý "nhà đoàn thực tập AI không ngủ"** (Antigravity, Gemini CLI).  
**Ảo tưởng của Tốc độ** là thực: tốc độ bùng nổ nhưng tỷ lệ bug/code vẫn là thách thức. AI tạo bug ở quy mô chưa từng có. **Vibe Coding ≠ Vibe Production (trong môi trường production).**  
**Giải pháp:** Spec-Driven Development (SDD) — spec là nguồn sự thật, code trở nên disposable (có thể ném đi).

---

### 2. CORE PARADIGM SHIFT TABLE / BẢNG SỰ CHUYỂN DỊCH PARADIGM CỐT LÕI

| Old Workflow (Pre-2024) | New Workflow (2025+) |
|-------------------------|----------------------|
| Dig through docs, manually write code | Manage AI coding agents (Antigravity, Gemini CLI) |
| Debug discrepancies between code & intent | Write comprehensive specs; AI generates 1000s lines |
| **Implementation = bottleneck** | **Human review & integration = bottleneck** |
| Code = asset (tài sản) | **Spec = asset; Code = disposable (có thể vứt)** |

**Key Quote:**  
> *"If your specification is rock-solid, a modern agent can regenerate your entire codebase from scratch. You could flip a back-end from Python to Go in a single afternoon."*  
> *"The value is in the spec now, not the syntax."*

---

### 3. SPECIFICATION ENGINEERING / KỸ THUẬT THIẾT KẾ SPEC

#### 3.1 Format Matters — Hybrid Markdown + Conditional YAML

**SKCC 2026 Study (Riang et al.):** LLMs suffer **up to 40% performance drop** with generic unoptimized markdown.

| Format | Parsing Accuracy (Deeply Nested) | Reason |
|--------|-----------------------------------|--------|
| **Flat YAML** | **51.9%** ✅ | Minimal visual clutter, token-efficient |
| JSON | 43.1% | "Reasoning format tax" — braces, commas, quotes consume context |
| Generic Markdown | Baseline -40% | Unstructured text causes context fragmentation |

**Winning Formula:**  
- **Clean Markdown** → Narrative headers, anchors AI attention (dẫn dắt sự chú ý của AI)  
- **Flat YAML** → Structured data/config >3 levels deep  
- **Strip visual clutter** → Keeps AI on "strict cost-efficient rails" (giữ AI trên đường ray chặt chẽ, tiết kiệm chi phí)

#### 3.2 Behavior-Driven Development with Gherkin Syntax

> *"Given, When, Then forces the AI to process reality in a strict sequence of state, action, and outcome."*

```gherkin
Given the user is logged in
When they click checkout
Then the cart clears
```

**Purpose:** Strips "vibe" out completely; forces deterministic logic processing (épp buộc logic xử lý xác định).

---

### 4. CONTEXT ARCHITECTURE / KIẾN TRÚC CONTEXT (HIỆN SỐP DẠNG PHÂN CẤP)

```
┌─────────────────────────────────────┐
│  Chat Interface                     │  ← Short-lived, high-level orchestration
│  (Ask agent to review specific file)│
├─────────────────────────────────────┤
│  Spec Folder (Version Controlled)   │  ← Static source of truth
│  (Checked in alongside code)        │
├─────────────────────────────────────┤
│  .agent/skills Directory            │  ← Reusable workflows/habits
│  (e.g., "always update changelog")  │
├─────────────────────────────────────┤
│  System Prompts (Multi-altitude)    │  ← DNA for codebase
│  • Global persona                   │
│  • Team agents.md                   │
│  • Project-level prompt             │
└─────────────────────────────────────┘
```

**Key Principle:** Don't paste 100-page specs into chat. Build hierarchical context (đừng paste 100 trang spec vào chat, hãy xây dựng context phân cấp).

---

### 5. EXECUTION MODES / CÁC CHẾ ĐỀ THỰC THI

| Mode | Use Case | Key Constraints |
|------|----------|-----------------|
| **Architect** | Greenfield projects | ❌ No auto-approval/YOLO; ✅ Must propose folder structure for approval; ✅ Must pin library versions explicitly |
| **Builder** | Feature addition | ✅ Match existing architectural style; ✅ Manual line-by-line diff confirmation |
| **Forensic Specialist** | Bug fixing | **Evidence prompting > Symptom prompting** (prompt bằng bằng chứng > prompt theo triệu chứng) |
| **Author** | Documentation | Maintain docs in sync |
| **Librarian** | SQL/Data | Specialized data operations |

#### Forensic Mode: Evidence Prompting Protocol

> *"Symptom prompting is like walking into an auto mechanic, making a weird clicking noise with your mouth, and expecting them to fix your engine."*

**Required Steps Before Any Fix:**  
1. AI writes **failing unit test** OR provides **failing curl command** to reproduce bug  
2. AI **only fixes root cause** — no "cleanup" of unrelated code  
3. Human reviews minimal, focused diff

---

### 6. TOOL STANDARDIZATION: MCP (MODEL CONTEXT PROTOCOL)

> *"The USB-C for AI tools."* — Open standard connecting AI agents to any tool/service.

**MCP = One Integration, Every Framework**  
- Replace bespoke wrappers with standardized protocol  
- Enables interoperability across frameworks  
- Shift from builder to high-level orchestrator

**No standards = tech debt:** Each API is a "standard-of-one" — low-leverage tasks, fragile bespoke wrappers, maintenance burden.

---

### 7. ZERO-TRUST DEVELOPMENT / PHÁT TRIỂN ZERO-TRUST

**Building the Safety Net (xây dựng lưới an toàn):**

| Layer | Component | Mô tả |
|-------|-----------|-------|
| **Sandboxing** | Ephemeral isolated environments | Chạy code trong sandbox tách biệt, giới hạn blast radius |
| **Human-in-the-Loop** | HITL checkpoints | Con người duyệt các quyết định quan trọng |
| **AI-Generated Test Coverage** | Comprehensive test generation | AI gen test coverage > human capacity |
| **Evaluation** | Automated evaluation loops | Tub-loop evaluation liên tục |
| **Policy Server** | Hybrid policy enforcement | Server chính sách hybrid (on-prem + cloud) |
| **Context Hygiene & Prompt Sanitization** | Input validation, injection defense | Vệ sinh context, khử độc prompt injection |

---

### 8. TEAM CULTURE & PROCESS EVOLUTION / VĂN HÓA TEAM & TIẾN HÓA QUY TRÌNH

#### Code Reviews (19-24)
**New Turn-by-Turn Review Model:**  
- AI reviews code in iterative turns (luân phiên)  
- Each turn: AI proposes change → Human confirms/rejects  
- Not rubber-stamping → active orchestration

#### Sustainability (25)
- **Spec versioned alongside code** (spec phiên bản cùng code)  
- **Disposable code, durable specs** (code vứt, spec bền)  
- Team evolves from "code owners" → "spec architects"

---

### 9. SUMMARY / TÓM TẮT

**Spec-Driven Development Equation:**
```
Rock-solid Spec + Modern Agent = Regeneratable Codebase
Disposable Code + Durable Specs = Sustainable Velocity
Human Orchestration + AI Execution = Production-Ready
```

**Key Takeaways for Practitioners:**
1. **Invest in specs, not syntax** — spec quality determines output quality
2. **Use hierarchical context** — don't stuff everything into chat
3. **Match execution mode to task** — Architect/Builder/Forensic/Author/Librarian
4. **Standardize via MCP** — eliminate bespoke wrappers
5. **Embrace zero-trust** — sandbox, HITL, eval, policy server
6. **Forensic debugging** — evidence prompting, minimal diffs
7. **Code reviews = orchestration** — not rubber stamps
8. **Code is disposable** — spec is the asset

---

### 10. CODELABS (OPTIONAL) / TÙY CHỌN

#### Codelab 1: Enterprise Cloud Scale — Deploy Expense Agent to Agent Runtime on Google Cloud
https://codelabs.developers.google.com/enterprise-cloud-scale-deploying-the-expense-agent-to-agent-runtime-on-google-cloud

**Requirements:** Google Cloud billing account  
**Learn:** Deploy to Agent Runtime, managed infrastructure, scaling, observability

#### Codelab 2: Vibe Code Frontend with Antigravity
https://codelabs.developers.google.com/vibecode-frontend-with-antigravity

**Learn:**  
- Build frontend web app with Antigravity  
- Deploy to Cloud Run  
- Link to async event-triggered architecture  
- Live expense submissions → cloud-hosted agent

---

## ════════════════════════════════════════════════════════════════
## 📋 SUMMARY (TÓM TẮT)
════════════════════════════════════════════════════════════════

**English Summary:**  
Day 5 covers the final paradigm shift: **Spec-Driven Development (SDD)** bridging the gap between fragile vibe-coded prototypes and production-grade enterprise software. The core insight: **code is disposable, specs are the asset**. Key practices: Flat YAML + Gherkin for spec format, hierarchical context architecture, 5 execution modes (Architect/Builder/Forensic/Author/Librarian), MCP for tool standardization, zero-trust safety net (sandboxing, HITL, eval, policy server), forensic evidence-based debugging, and turn-by-turn AI code reviews. Optional codelabs cover Google Cloud deployment and frontend integration.

**Tóm tắt tiếng Việt:**  
Ngày 5 bao gồm chuyển dịch paradigm cuối cùng: **Spec-Driven Development (SDD)** lấp đầy khoảng trống giữa prototype vibe-coded mong manh và phần mềm enterprise production-grade. Insight cốt lõi: **code là disposable, spec mới là tài sản**. Các thực hành chủ chốt: Flat YAML + Gherkin cho format spec, kiến trúc context phân cấp, 5 chế độ thực thi (Architect/Builder/Forensic/Author/Librarian), MCP chuẩn hóa công cụ, lưới an toàn zero-trust (sandbox, HITL, eval, policy server), forensic debugging dựa trên bằng chứng, code review luân phiên AI. Codelab tùy chọn bao gồm deploy Google Cloud và tích hợp frontend.

---

## ═══════════════════════════════════════════════════════════════
## ✅ ACTION ITEMS (NHIỆM VỤ HÀNH ĐỘNG)
════════════════════════════════════════════════════════════════

| # | Action | Status | Note |
|---|--------|--------|------|
| 1 | 🎧 Listen to Podcast Day 5 | ⏅ **DONE** | 21:17 min |
| 2 | 📄 Read Whitepaper (38 pages) | ⏅ **DONE** | Full read |
| 3 | 📝 Create Cornell Notes | ⏅ **DONE** | This file |
| 4 | 🧪 Codelab 1: Deploy to Cloud (Optional) | ⏳ **SKIP** | Requires billing |
| 5 | 🧪 Codelab 2: Frontend with Antigravity (Optional) | ⏳ **SKIP** | Requires billing |
| 6 | 💬 Discord #5dai-question-forum | ⏳ TODO | Ask questions |
| 7 | 📖 Forum browse Day 5 | ⏳ TODO | Browse discussion |
| 8 | 🏁 Capstone Integration | ⏳ TODO | Apply Days 1-5 |

---

## ═══════════════════════════════════════════════════════════════
## 🔗 ALL LINKS (TẤT CẢ LINK)
════════════════════════════════════════════════════════════════

| Resource | URL |
|----------|-----|
| Podcast | https://www.youtube.com/watch?v=VSRdL4wlbLY |
| Whitepaper | https://www.kaggle.com/whitepaper-spec-driven-production-grade-development-in-the-age-of-vibe-coding |
| Codelab 1 (Cloud Deploy) | https://codelabs.developers.google.com/enterprise-cloud-scale-deploying-the-expense-agent-to-agent-runtime-on-google-cloud |
| Codelab 2 (Frontend) | https://codelabs.developers.google.com/vibecode-frontend-with-antigravity |
| Livestream Playlist | https://www.youtube.com/playlist?list=PLqFaTIg4myu8AFXUjrVhDkUGp0A9kK8CX |
| Day 5 Live Stream | https://www.youtube.com/live/... (TBD) |
| Discussion Forum | https://www.kaggle.com/competitions/5-day-ai-agents-intensive-vibecoding-course-with-google/discussion?sort=hotness |

---

## ═══════════════════════════════════════════════════════════════
## 🏆 CAPSTONE INTEGRATION (TÍCH HỢP CAPSTONE)
════════════════════════════════════════════════════════════════

**Apply All 5 Days to Capstone Project:**

| Day | Concept | Capstone Integration |
|-----|---------|---------------------|
| 1 | Harness Engineering, Factory Model, Vibe vs Agentic | Architecture: Harness + Factory Model for agent orchestration |
| 2 | MCP, A2A, A2UI, AP2, UCP, N×M Problem | Integration Layer: MCP for tools, A2A for agent communication |
| 3 | Agent Skills, SKILL.md, Progressive Disclosure, ADK 2.0 | Procedural Memory: Skills for business logic, ADK Graph workflow |
| 4 | Security Checkpoint, HITL, Policy Server, STRIDE, Eval | Production Safety: Zero-trust, sandbox, policy enforcement |
| 5 | Spec-Driven Development, Gherkin, MCP, Zero-Trust, Forensic | Manufacturing Process: Specs as source of truth, durable specs |

**Capstone Checklist:**
- [ ] Define **Gherkin specs** for all agent behaviors
- [ ] Build **hierarchical context** (Spec folder → .agent/skills → System prompts)
- [ ] Implement **5 execution modes** for different tasks
- [ ] Standardize tools via **MCP**
- [ ] Add **zero-trust layers**: sandbox, HITL, eval, policy server
- [ ] Use **forensic debugging** — evidence prompting only
- [ ] **Disposable code** pattern — regenerate from specs
- [ ] Document everything in **version-controlled specs**

---

*End of Day 5 Cornell Notes*  
*Created: June 19, 2026*  
*Format: English-first, Vietnamese-below per section (Cornell EN→VI bilingual)*

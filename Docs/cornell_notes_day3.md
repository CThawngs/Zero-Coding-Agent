# 📚 CORNELL NOTES: DAY 3 - AGENT SKILLS
**Course:** 5-Day AI Agents Intensive with Google × Kaggle  
**Date:** June 17, 2026  
**Unit:** 3 - Agent Skills  
**Resources:**  
- 🎧 Podcast: https://www.youtube.com/watch?v=uYURYHhpmKc (23:42)  
- 📄 Whitepaper: "Agent Skills" (62 pages) - https://www.kaggle.com/whitepaper-agent-skills  
- 🧪 Codelab 1: Explore how Skills work in Antigravity - https://codelabs.developers.google.com/getting-started-with-antigravity-skills  
- 🧪 Codelab 2: Build agents with Agents CLI and ADK - https://codelabs.developers.google.com/agents-cli-adk-lifecycle  

---

## 🎯 CORNELL METHOD STRUCTURE

| **KEYWORDS / QUESTIONS (Cues)** | **NOTES (Note-taking Area)** |
|---|---|
| *(Left column - for review)* | *(Right column - during learning)* |

> **FORMAT:** Each section contains **English version first**, then **Vietnamese version below** (labeled clearly). Summary also follows this pattern.

---

## 🔑 KEYWORDS / QUESTIONS (CUES)

### Podcast Core Concepts
1. **Agent Skills** - Lightweight folder-based primitive for procedural memory
2. **Four Friction Points** - Context rot, missing procedural memory, multi-agent overload, portability
3. **Progressive Disclosure** - On-demand loading vs. monolithic context
4. **SKILL.md Anatomy** - YAML frontmatter + Markdown body + scripts/ + references/ + assets/
5. **Two Creation Paths** - SME-driven (Path A) vs. Trace-driven (Path B)
6. **Skills vs MCP vs agents.md** - Reach vs Global context vs Procedural memory

### Whitepaper Structure (62 Pages)
7. **Introduction** (pp.4-5): Why skills, four friction points
8. **What is an Agent Skill** (pp.6-11): Anatomy, progressive disclosure, paths A/B, vs MCP/agents.md
9. **Why Popular** (pp.12-14): Context rot, procedural memory, single-agent flexibility, portability
10. **Evaluating Skills** (pp.15-24): Toolkit, trigger quality, output quality, eval illusion, token budget
11. **Production Ready** (pp.25-31): Runtime internals, skills as unit of improvement, context overflow
12. **Meta-Skills** (pp.32-35): Self-improving skills, where it breaks, future direction
13. **Composing Skills** (pp.36-38): DAG orchestration, capability profiles, skill taxonomy, context debt

### Codelab Skills
14. **Antigravity Skills** - Authoring SKILL.md, progressive levels, script integration
15. **Agents CLI + ADK 2.0** - Scaffold, graph workflow agents, linting, local playground
16. **7 Domain Skills** - scaffold, code, deploy, eval, observability, publish, workflow

### Key Questions
17. How does progressive disclosure solve context rot?
18. When to create a Skill vs use MCP vs agents.md?
19. What makes a good trigger description in SKILL.md?
18. How do meta-skills enable self-improvement?
19. How do Skills compose with Day 2's MCP/A2A protocols?

---

## 📝 NOTES (NOTE-TAKING AREA)

---

### 1. INTRODUCTION & FOUR FRICTION POINTS

**[ENGLISH VERSION]**

**Authors:** Debanshu Das, Gabriela Hernandez Larios, Lavi Nigam, Smitha Kolan, Tanvi Singhal (Google)  
**Date:** May 2026 | **Length:** 62 pages

**Core Thesis:** Agent Skills are a lightweight, folder-based primitive that gives LLMs **procedural memory** — the ability to remember *how* to do things step-by-step — solving four critical friction points in AI agent development:

| # | Friction Point | Problem | Skill Solution |
|---|----------------|---------|----------------|
| **1** | **Context Rot** | Dumping all instructions into one prompt degrades LLM performance silently | **Progressive Disclosure** — load only when triggered |
| **2** | **Missing Procedural Memory** | LLMs have episodic (what happened) & semantic (facts) memory, but lack "how-to" memory | **Skills = Procedural Memory Primitive** — step-by-step logic |
| **3** | **Multi-Agent Overload** | Complex swarms hard to build/maintain; operational nightmare | **Single Agent + Skills** — one agent flexes into many specialist roles |
| **4** | **Portability** | Custom integrations lock you into platforms | **Folder + Markdown** — works anywhere with filesystem access |

**Key Quote:** *"Agent Skills can be seen as the first credible procedural memory primitive for LLM Agents."*

**[VIETNAMESE VERSION]**

**Tác giả:** Debanshu Das, Gabriela Hernandez Larios, Lavi Nigam, Smitha Kolan, Tanvi Singhal (Google)  
**Ngày:** Tháng 5/2026 | **Độ dài:** 62 trang

**Thuyết cốt lõi:** Agent Skills là primitive dựa trên thư mục nhẹ, cung cấp cho LLM **bộ nhớ thủ tục (procedural memory)** — khả năng nhớ *cách làm* từng bước — giải quyết 4 điểm ma sát quan trọng trong phát triển AI agent:

| # | Điểm Ma Sát | Vấn đề | Giải pháp Skill |
|---|-------------|--------|----------------|
| **1** | **Context Rot (Thối ngữ cảnh)** | Đút tất cả hướng dẫn vào một prompt làm giảm hiệu năng LLM thầm lặng | **Progressive Disclosure (Công bố tiến bộ)** — chỉ tải khi được kích hoạt |
| **2** | **Thiếu Bộ Nhớ Thủ Tục** | LLM có bộnhớ sự kiện (cái gì xảy ra) & ngữ nghĩa (sự thật), nhưng thiếu "cách làm" | **Skills = Primitive Bộ Nhớ Thủ Tục** — logic từng bước |
| **3** | **Quá Tải Multi-Agent** | Hệ thống multi-agent phức tạp khó xây/dùng; ác mộng vận hành | **Single Agent + Skills** — một agent chuyển đổi vai trò chuyên gia |
| **4** | **Portability (Khả năng di động)** | Tích hợp tùy chỉnh khóa bạn vào platform | **Thư mục + Markdown** — hoạt động bất kỳ đâu có filesystem |

**Trích dẫn quan trọng:** *"Agent Skills có thể được xem là primitive bộ nhớ thủ tục đáng tin cậy đầu tiên cho LLM Agents."*

---

### 2. ANATOMY OF AN AGENT SKILL

**[ENGLISH VERSION]**

**An Agent Skill is a folder containing:**

```
skill_folder/
├── SKILL.md          # MANDATORY: The "brain" — metadata, trigger description, core instructions
├── scripts/          # Executable code (Python, bash) — deterministic "how"
├── references/       # Dense domain context (PDFs, specs) — too long for prompt
└── assets/           # JSON schemas, email templates, static files
```

| Component | Purpose | Example |
|-----------|---------|---------|
| `SKILL.md` | Metadata + when-to-use + instructions | Name, description, step-by-step logic |
| `scripts/` | Deterministic execution | `hash_calculator.py` — don't let LLM guess math |
| `references/` | Domain knowledge | 50-page tax code PDF |
| `assets/` | Structured data | JSON schema, email template |

> **Key Insight:** *"You really want to separate the **what to do** from the **how to do it deterministically**."*

**[VIETNAMESE VERSION]**

**Một Agent Skill là một thư mục chứa:**

```
skill_folder/
├── SKILL.md          # BẮT BUỘC: "Bộ não" — metadata, mô tả trigger, hướng dẫn cốt lõi
├── scripts/          # Code thực thi (Python, bash) — "cách làm" deterministik
├── references/       # Ngữ cảnh domain dày đặc (PDF, specs) — quá dài cho prompt
└── assets/           # JSON schemas, email templates, file tĩnh
```

| Thành phần | Mục đích | Ví dụ |
|------------|----------|-------|
| `SKILL.md` | Metadata + khi nào dùng + hướng dẫn | Tên, mô tả, logic từng bước |
| `scripts/` | Thực thi deterministik | `hash_calculator.py` — đừng để LLM đoán toán |
| `references/` | Kiến thức domain | 50 trang PDF luật thuế |
| `assets/` | Dữ liệu có cấu trúc | JSON schema, email template |

> **Insight quan trọng:** *"Bạn thực sự muốn tách biệt **cái gì cần làm** (what to do) khỏi **cách làm deterministik** (how to do it deterministically)."*

---

### 3. SKILL.MD: TWO-PART STRUCTURE

**[ENGLISH VERSION]**

#### **Part 1: YAML Frontmatter (Metadata Layer)**
```yaml
---
name: database-inspector
description: Use this skill when the user asks to query the database, check table schemas, or inspect user data in the local PostgreSQL instance.
---
```

**Key Fields:**
- **name** (optional): Unique, lowercase, hyphens allowed (e.g., `postgres-query`). Defaults to directory name.
- **description** (mandatory): **Most important field** — functions as "trigger phrase" for semantic matching. Must be precise:
  - ❌ Bad: `"Database tools"`
  - ✅ Good: `"Executes read-only SQL queries against the local PostgreSQL database to retrieve user or transaction data. Use this for debugging data states"`

#### **Part 2: Markdown Body (Instructions)**
Injected into agent's context when skill activates. Should include:
1. **Goal** — Clear statement of what skill achieves
2. **Instructions** — Step-by-step logic
3. **Examples** — Few-shot input/output examples
4. **Constraints** — "Do not" rules

**Example Body:**
```markdown
# Database Inspector

## Goal
To safely query the local database and provide insights on the current data state.

## Instructions
- Analyze the user's natural language request to understand the data need.
- Formulate a valid SQL query.
  - CRITICAL: Only SELECT statements are allowed.
- Use the script scripts/query_runner.py to execute the SQL.
  - Command: python scripts/query_runner.py "SELECT * FROM..."
- Present the results in a Markdown table.

## Constraints
- Never output raw user passwords or API keys.
- If the query returns > 50 rows, summarize the data instead of listing it all.
```

**[VIETNAMESE VERSION]**

#### **Phần 1: YAML Frontmatter (Lớp Metadata)**
```yaml
---
name: database-inspector
description: Use this skill when the user asks to query the database, check table schemas, or inspect user data in the local PostgreSQL instance.
---
```

**Các trường quan trọng:**
- **name** (tùy chọn): Duy nhất, chữ thường, cho phép dấu gạch ngang (vd: `postgres-query`). Mặc định là tên thư mục.
- **description** (bắt buộc): **Trường quan trọng nhất** — đóng vai trò "cụm từ kích hoạt" cho semantic matching. Phải chính xác:
  - ❌ Sai: `"Database tools"`
  - ✅ Tốt: `"Executes read-only SQL queries against the local PostgreSQL database to retrieve user or transaction data. Use this for debugging data states"`

#### **Phần 2: Markdown Body (Hướng Dẫn)**
Được inject vào context của agent khi skill kích hoạt. Nên bao gồm:
1. **Goal (Mục tiêu)** — Khẳng định rõ skill đạt được gì
2. **Instructions (Hướng dẫn)** — Logic từng bước
3. **Examples (Ví dụ)** — Few-shot input/output
4. **Constraints (Ràng buộc)** — Quy tắc "Không được"

**Ví dụ Body:**
```markdown
# Database Inspector

## Goal
To safely query the local database and provide insights on the current data state.

## Instructions
- Analyze the user's natural language request to understand the data need.
- Formulate a valid SQL query.
  - CRITICAL: Only SELECT statements are allowed.
- Use the script scripts/query_runner.py to execute the SQL.
  - Command: python scripts/query_runner.py "SELECT * FROM..."
- Present the results in a Markdown table.

## Constraints
- Never output raw user passwords or API keys.
- If the query returns > 50 rows, summarize the data instead of listing it all.
```

---

### 4. TWO PATHS TO SKILL CREATION

**[ENGLISH VERSION]**

### **Path A: Subject Matter Expert (SME) Driven**
- **Who:** HR managers, compliance officers, tradespeople, domain experts
- **How:** Translate existing human runbooks/SOPs into `SKILL.md`
- **Requires:** No coding — just markdown
- **Value:** Democratizes agent creation — non-engineers can build agents

### **Path B: Developer / Trace-Driven**
- **Who:** Engineers observing successful agent workflows
- **How:** Capture a successful multi-step trace → clean → crystallize into reusable skill
- **Value:** *"Next time the agent doesn't have to burn compute figuring it out from scratch"*
- **Process:** Run agent → observe successful trace → extract pattern → crystallize as Skill

> **Restaurant Kitchen Analogy:**
> - `SKILL.md` metadata = **Menu** (agent reads to know what's available)
> - `scripts/` = **Blender** (agent doesn't plug in until ordered)
> - `references/` = **Grandma's recipe book** (read only when dish ordered)
> - **Technical term:** *Progressive Disclosure* — only reveal complex mechanics when actively triggered

**[VIETNAMESE VERSION]**

### **Path A: Chuyên Gia Lĩnh Vực (SME) - SME Driven**
- **Ai:** Quản lý HR, compliance officer, thợ thủ công, chuyên gia domain
- **Cách:** Dịch runbook/SOP nhân sự hiện tại thành `SKILL.md`
- **Yêu cầu:** Không cần code — chỉ markdown
- **Giá trị:** Dân chủ hóa tạo agent — non-engineer cũng tạo được agent

### **Path B: Developer / Trace-Driven**
- **Ai:** Kỹ sư quan sát workflow agent thành công
- **Cách:** Bắt trace multi-step thành công → làm sạch → kết tinh thành skill tái sử dụng
- **Giá trị:** *"Lần sau agent không phải đốt compute để tìm ra từ đầu"*
- **Quy trình:** Chạy agent → quan sát trace thành công → trích xuất pattern → kết tinh thành Skill

> **Ví dụ Nhà Hàng:**
> - `SKILL.md` metadata = **Menu** (agent đọc để biết có món gì)
> - `scripts/` = **Máy xay sinh tố** (agent không cắm chước trừ khi được order)
> - `references/` = **Sổ công thức bà ngoại** (chỉ đọc khi món được order)
> - **Thuật ngữ kĩ thuật:** *Progressive Disclosure* — chỉ tiết lộ cơ chế phức tạp khi được kích hoạt chủ động

---

### 5. SKILLS vs MCP vs AGENTS.MD

**[ENGLISH VERSION]**

| Primitive | Role | Scope | Analogy |
|-----------|------|-------|---------|
| **MCP (Model Context Protocol)** | **Reach** — connects agent to external systems (Salesforce, BigQuery, PostgreSQL) | External connectivity | Agent's **"hands"** |
| **`agents.md`** | **Global context** — always-on project rules (e.g., "always use TypeScript", "follow linting rules") | Project-wide, persistent | Agent's **"constitution"** |
| **Agent Skill** | **Know-how / Procedural memory** — step-by-step logic for specific task | **On-demand**, triggered | Agent's **"brains"** |

> **Composition:** A skill might say: *"Here are 5 steps to process a refund. Step 2: Use MCP tool to check database."* They compose beautifully.

**[VIETNAMESE VERSION]**

| Primitive | Vai trò | Phạm vi | Ẩn dụ |
|-----------|---------|---------|-------|
| **MCP (Model Context Protocol)** | **Reach (Tiếp cận)** — kết nối agent với hệ thống ngoại部 (Salesforce, BigQuery, PostgreSQL) | Kết nối bên ngoài | **"Chân tay"** của Agent |
| **`agents.md`** | **Global context (Ngữ cảnh toàn cục)** — rules luôn bật (ví dụ: "luôn dùng TypeScript", "tuân theo linting") | Toàn dự án, bền vững | **"Hiến pháp"** của Agent |
| **Agent Skill** | **Know-how / Procedural memory** — logic từng bước cho task cụ thể | **On-demand**, được trigger | **"Bộ não"** của Agent |

> **Composition:** Một skill có thể nói: *"Đây là 5 bước xử lý refund. Bước 2: Dùng MCP tool để check database."* Chúng compose tuyệt vời.

---

### 6. PROGRESSIVE DISCLOSURE & TOKEN ECONOMICS

**[ENGLISH VERSION]**

### **The Problem: Context Rot (Chroma 2025 Study - 18 Frontier Models)**
- **Naive assumption:** Larger context windows = better performance
- **Reality:** Performance degrades *silently* as input grows — **attention dilution**
- **Lost-in-the-middle:** Models lose track of information buried in long contexts

### **The Solution: Progressive Disclosure**
```
50 skills in library:
├── Metadata only (trigger descriptions): ~4,000 tokens
├── Active skill body (when triggered): ~2,000 tokens
└── Other 49 skills: 0 tokens (stay on disk)
```
- **Result:** Up to **98% reduction in active context**
- Model stays sharp — only sees what matters *now*

### **At Enterprise Scale (40,000 skills)**
- Don't load all metadata → use **RAG pipeline**
- Fast embeddings model scans 40k descriptions → passes top 5 to context window
- **Progressive disclosure taken to the next level**

**[VIETNAMESE VERSION]**

### **Vấn Đề: Context Rot (Nghiên Cứu Chroma 2025 - 18 Models SOTA)**
- **Giả định ngây thơ:** Cửa sổ context lớn hơn = hiệu năng tốt hơn
- **Thực tế:** Hiệu năng giảm *thầm lặng* khi input lớn — **attention dilution (pha loãng chú ý)**
- **Lost-in-the-middle:** Model mất thông tin chôn ở giữa context dài

### **Giải Pháp: Progressive Disclosure (Công Bố Tiến Bộ)**
```
50 skills trong thư viện:
├── Chỉ metadata (mô tả trigger): ~4,000 tokens
├── Skill body active (khi trigger): ~2,000 tokens
└── 49 skills khác: 0 tokens (ở yên trên disk)
```
- **Kết quả:** Giảm tới **98% context active**
- Model giữ sắc bén — chỉ thấy gì quan trọng *ngay bây giờ*

### **Quy Mô Enterprise (40,000 skills)**
- Không load tất cả metadata → dùng **RAG pipeline**
- Embedding model nhanh quét 40k mô tả → pass top 5 vào context window
- **Progressive disclosure đẩy lên cấp độ tiếp theo**

---

### 7. MULTI-AGENT vs SINGLE AGENT + SKILLS

**[ENGLISH VERSION]**

### **When Multi-Agent Still Wins**
1. **Genuine async parallelism** — 3 agents researching 3 companies simultaneously
2. **Differing security postures** — HR agent (salary access) vs. Marketing agent (public web) — isolation prevents leaks

### **Where Skills Win (Almost Everything Else)**
- **Logistics example:** 100 shipping process variants
- **Old way:** 100 sub-agents, 100 deployments, complex routing = operational nightmare
- **Skills way:** 1 general agent + 100 skills in folders = vastly more elegant
- **Token efficiency:** No context bloat from idle sub-agents

**[VIETNAMESE VERSION]**

### **Khi Multi-Agent Vẫn Thắng**
1. **Async parallelism thực sự** — 3 agent research 3 công ty cùng lúc
2. **Security posture khác biệt** — HR agent (lương) vs Marketing agent (web công khai) — isolation ngăn leak

### **Nơi Skills Thắng (Gần Như Mọi Thứ Khác)**
- **Ví dụ Logistics:** 100 biến thể quy trình shipping
- **Cách cũ:** 100 sub-agent, 100 deploy, routing phức tạp = ác mộng vận hành
- **Cách Skills:** 1 agent chung + 100 skills trong thư mục = thanh lịch hơn rất nhiều
- **Token efficiency:** Không bị phình context từ sub-agent nhàn rỗi

---

### 8. EVALUATING SKILLS (THE EVALUATION TOOLKIT)

**[ENGLISH VERSION]**

### **The Evaluation Toolkit**
| Stage | What to Evaluate | Method |
|-------|------------------|--------|
| **Trigger** | Does the right skill fire? Right skill stays dormant? | Semantic matching tests, edge cases |
| **Output Quality** | Correctness, completeness, format adherence | Golden set comparison, LLM-as-Judge |
| **Tool Trajectory** | Right tools called in right order? | Trace inspection, step verification |
| **Token Budget** | Skill doesn't exceed budget when active | Token counting, budget alerts |

### **The Trigger is the First Gate**
- **Vague description** → wrong skill fires OR right one stays dormant
- **Overlapping descriptions** → agent confused, picks wrong skill
- **Test:** Feed 100 varied queries, measure precision/recall of skill selection

### **System vs. Skill: The Evaluation Illusion**
- Evaluating system without skills = optimistic baseline
- Each skill adds latency, tokens, failure points
- **True eval:** System WITH skills under realistic load

### **Token Budget: Isolation is a Trap**
- Skills don't share token budget cleanly
- Active skill + context = combined pressure
- **Solution:** Per-skill token budgets, circuit breakers at 80%

**[VIETNAMESE VERSION]**

### **Evaluation Toolkit (Bộ Công Cụ Đánh Giá)**
| Stage | Đánh Giá Gì | Phương Pháp |
|-------|-------------|-------------|
| **Trigger** | Skill đúng fire? Skill đúng dormant? | Test semantic matching, edge cases |
| **Output Quality** | Đúng, đầy đủ, format đúng | So sánh golden set, LLM-as-Judge |
| **Tool Trajectory** | Tool đúng, đúng thứ tự? | Kiểm tra trace, verify từng bước |
| **Token Budget** | Skill không vượt budget khi active | Đếm token, alert ngân sách |

### **Trigger Là Cổng Đầu Tiên**
- **Mô tả mơ hồ** → skill sai fire HOẶC skill đúng ở yên
- **Mô tả trùng lặp** → agent bối rối, chọn skill sai
- **Test:** Feed 100 query đa dạng, đo precision/recall chọn skill

### **System vs Skill: Ảo Tưởng Đánh Giá**
- Đánh giá hệ thống không có skills = baseline lạc quan
- Mỗi skill thêm latency, token, điểm failure
- **True eval:** Hệ thống CÓ skills dưới load thực tế

### **Token Budget: Cách Ly Là Cạm Bẫy**
- Skills không chia sẻ token budget sạch
- Skill active + context = áp lực kết hợp
- **Giải pháp:** Budget token per-skill, circuit breaker ở 80%

---

### 9. FOUR CATASTROPHIC FAILURE MODES

**[ENGLISH VERSION]**

| Failure Mode | Description | Consequence |
|--------------|-------------|-------------|
| **Trigger Failure** | Vague description → wrong skill fires or right one stays dormant | Agent does wrong thing / does nothing |
| **Context Overflow** | Skill body too large, pushes out critical context | Model loses critical info, hallucinates |
| **Hallucinated Capability** | Skill claims ability it doesn't have (e.g., "runs SQL" but no script) | Silent failure, wrong output |
| **Composition Explosion** | Too many skills triggered simultaneously → context explosion | Latency spike, cost explosion |

**[VIETNAMESE VERSION]**

| Failure Mode | Mô Tả | Hậu Quả |
|--------------|-------|---------|
| **Trigger Failure** | Mô tả mơ hồ → skill sai fire HOẶC skill đúng ở yên | Agent làm sai / không làm gì |
| **Context Overflow** | Skill body quá lớn, đẩy ra context quan trọng | Model mất info quan trọng, hallucinate |
| **Hallucinated Capability** | Skill tuyên bố năng lực không có (vd: "chạy SQL" nhưng không có script) | Failure thầm lặng, output sai |
| **Composition Explosion** | Quá nhiều skills trigger cùng lúc → context explosion | Spike latency, bùng chi phí |

---

### 10. META-SKILLS & SELF-IMPROVING SKILLS

**[ENGLISH VERSION]**

### **What are Meta-Skills?**
Skills that operate on other skills — enabling **self-improvement loops**.

### **Capabilities:**
1. **Skill Analysis** — Audit existing skills for quality, coverage, redundancy
2. **Skill Generation** — Create new skills from successful traces automatically
3. **Skill Optimization** — Rewrite skill bodies for token efficiency, clarity
4. **Skill Composition** — Combine multiple skills into workflows/DAGs

### **Where This Falls Apart**
- **Infinite recursion risk** — Meta-skill improving meta-skill improving...
- **Evaluation bottleneck** — How to verify the improver improves?
- **Drift** — Skills gradually diverge from original intent

### **Where This Is Going**
- **Skill Marketplaces** — Install skills like npm packages
- **Auto-Curated Skill Libraries** — Agent maintains its own skill library
- **Cross-Platform Skill Standard** — Works on Claude Code, GitHub Copilot, Cursor, Antigravity

**[VIETNAMESE VERSION]**

### **Meta-Skills Là Gì?**
Skills vận hành trên skills khác — cho phép **vòng lặp tự cải tiến**.

### **Khả Năng:**
1. **Phân Tích Skill** — Audit skills hiện có: chất lượng, coverage, redundancy
2. **Tạo Skill** — Tự động tạo skill mới từ trace thành công
3. **Tối Ưu Skill** — Viết lại body skill cho tiết token, rõ ràng hơn
4. **Compose Skill** — Kết hợp nhiều skills thành workflows/DAGs

### **Nơi Cái Này Vỡ**
- **Rủi ro đệ quy vô tận** — Meta-skill cải tiến meta-skill cải tiến...
- **Ẩn hụt đánh giá** — Làm sao verify cái cải tiến thực sự cải tiến?
- **Drift** — Skills dần chệch khỏi ý định ban đầu

### **Xu Hướng Tương Lai**
- **Skill Marketplaces** — Cài skill như npm packages
- **Thư Viện Skill Tự Curated** — Agent tự maintain thư viện skill của mình
- **Chuẩn Kỹ Năng Cross-Platform** — Chạy trên Claude Code, GitHub Copilot, Cursor, Antigravity

---

### 11. COMPOSING & PACKAGING SKILLS

**[ENGLISH VERSION]**

### **Execution Routing: DAG Orchestration**
- Skills as nodes in a Directed Acyclic Graph
- Dynamic routing based on skill outputs
- Enables complex multi-step workflows without hardcoded logic

### **Environment Packaging: Capability Profiles**
- Bundle skills + MCP servers + env vars + secrets into deployable units
- "Capability Profile" = everything an agent needs for a domain

### **The Canonical Skill Taxonomy**
Standardized categories emerging:
- **Data Skills** (query, transform, validate)
- **Code Skills** (generate, refactor, test, review)
- **Ops Skills** (deploy, monitor, scale)
- **Domain Skills** (legal, finance, HR, marketing)

### **Context Debt and Shifting Intelligence Left**
- **Context Debt** = accumulated complexity from poor skill design
- **Shifting Left** = invest in skill quality early → compound returns
- **Architectural Tradeoff:** Skill granularity vs. management overhead

**[VIETNAMESE VERSION]**

### **Execution Routing: DAG Orchestration**
- Skills như nodes trong Directed Acyclic Graph
- Routing động dựa trên output skills
- Cho phép workflows multi-step phức tạp không hardcode logic

### **Environment Packaging: Capability Profiles**
- Bundle skills + MCP servers + env vars + secrets thành đơn vị deploy
- "Capability Profile" = mọi thứ agent cần cho một domain

### **The Canonical Skill Taxonomy (Danh Mục Kỹ Năng Chuẩn)**
Các chuẩn đang nổi lên:
- **Data Skills** (query, transform, validate)
- **Code Skills** (generate, refactor, test, review)
- **Ops Skills** (deploy, monitor, scale)
- **Domain Skills** (legal, finance, HR, marketing)

### **Context Debt và Shifting Intelligence Left**
- **Context Debt** = độ phức tạp tích lũy từ design skill kém
- **Shifting Left** = đầu tư chất lượng skill sớm → lợi thế kép
- **Architectural Tradeoff:** Độ mượt skill vs. overhead quản lý

---

### 12. CODELABS: PRACTICAL IMPLEMENTATION

**[ENGLISH VERSION]**

**Codelab 1: Explore How Skills Work in Antigravity**
- **URL:** https://codelabs.developers.google.com/getting-started-with-antigravity-skills
- **Skills:** Authoring SKILL.md, progressive levels, script integration
- **Key Tasks:**
  1. Create skill directory structure
  2. Write SKILL.md with proper YAML frontmatter + body
  3. Add scripts/ for deterministic execution
  3. Test skill activation via chat
  4. Progressive levels: Basic → Scripted → Referenced → Meta-skill

**Codelab 2: Build Agents with Agents CLI and ADK 2.0**
- **URL:** https://codelabs.developers.google.com/agents-cli-adk-lifecycle
- **Skills:** Agents CLI, ADK 2.0 graph workflow agents, linting, local playground
- **Key Tasks:**
  1. Install `agents-cli` via `uvx google-agents-cli setup`
  2. Auto-installs 7 domain skills: `adk-code`, `deploy`, `eval`, `observability`, `publish`, `scaffold`, `workflow`
  3. Scaffold agent: `agents-cli scaffold create customer-support-agent --prototype --yes`
  4. Explore ADK 2.0 graph workflow (`app/agent.py` with LlmAgent, nodes, edges)
  5. Lint & test via local web playground with auto-reload

**Agents CLI Setup:**
```bash
uvx google-agents-cli setup
```
**Installs 7 domain skills to `~/.agents/skills/`:**
| Skill | Purpose |
|-------|---------|
| `google-agents-cli-adk-code` | ADK code assistance |
| `google-agents-cli-deploy` | Deployment workflows |
| `google-agents-cli-eval` | Evaluation harnesses |
| `google-agents-cli-observability` | Telemetry & monitoring |
| `google-agents-cli-publish` | Publishing agents |
| `google-agents-cli-scaffold` | Project scaffolding |
| `google-agents-cli-workflow` | Workflow orchestration |

**[VIETNAMESE VERSION]**

**Codelab 1: Khám Phá Skills Trong Antigravity**
- **URL:** https://codelabs.developers.google.com/getting-started-with-antigravity-skills
- **Kỹ năng:** Viết SKILL.md, các cấp tiến bộ, tích hợp script
- **Nhiệm Vụ Chính:**
  1. Tạo cấu trúc thư mục skill
  2. Viết SKILL.md với YAML frontmatter + body đúng
  3. Thêm scripts/ cho thực thi deterministik
  4. Test kích hoạt skill qua chat
  5. Các cấp tiến bộ: Cơ bản → Có Script → Có References → Meta-skill

**Codelab 2: Xây Dựng Agent Với Agents CLI Và ADK 2.0**
- **URL:** https://codelabs.developers.google.com/agents-cli-adk-lifecycle
- **Kỹ năng:** Agents CLI, ADK 2.0 graph workflow agents, linting, local playground
- **Nhiệm Vụ Chính:**
  1. Cài `agents-cli` qua `uvx google-agents-cli setup`
  2. Tự cài 7 domain skills: `adk-code`, `deploy`, `eval`, `observability`, `publish`, `scaffold`, `workflow`
  3. Scaffold agent: `agents-cli scaffold create customer-support-agent --prototype --yes`
  4. Khám phá ADK 2.0 graph workflow (`app/agent.py` với LlmAgent, nodes, edges)
  5. Lint & test qua local web playground có auto-reload

**Cài Đặt Agents CLI:**
```bash
uvx google-agents-cli setup
```
**Tự cài 7 domain skills vào `~/.agents/skills/`:**
| Skill | Mục Đích |
|-------|---------|
| `google-agents-cli-adk-code` | Hỗ trợ code ADK |
| `google-agents-cli-deploy` | Workflow triển khai |
| `google-agents-cli-eval` | Khung đánh giá |
| `google-agents-cli-observability` | Telemetry & monitoring |
| `google-agents-cli-publish` | Xuất bản agent |
| `google-agents-cli-scaffold` | Scaffold dự án |
| `google-agents-cli-workflow` | Điều phối workflow |

---

## 📝 SUMMARY (TÓM TẮT)

### [ENGLISH VERSION]

Day 3 introduces **Agent Skills** as the **procedural memory primitive** for LLM agents — solving the four critical friction points of context rot, missing procedural memory, multi-agent overload, and portability.

**Core Innovation: Progressive Disclosure**
Instead of loading all instructions/tools into the context window (causing attention dilution and "lost-in-the-middle"), Skills load **on-demand**:
- Library of 50 skills: only ~4K tokens for metadata
- Active skill: ~2K tokens when triggered
- **98% reduction** in active context vs. monolithic prompts

**SKILL.md Anatomy:**
- **YAML Frontmatter:** `name`, `description` (critical trigger phrase)
- **Markdown Body:** Goal, Instructions, Examples, Constraints
- **Optional:** `scripts/` (deterministic execution), `references/`, `assets/`

**Two Creation Paths:**
- **Path A (SME-driven):** Translate SOPs → markdown (no code)
- **Path B (Trace-driven):** Capture successful trace → crystallize as skill

**Skills vs MCP vs agents.md:**
- **MCP** = Reach (external systems) = "hands"
- **agents.md** = Global rules = "constitution"
- **Skills** = Procedural memory = "brains" (on-demand)

**Token Economics:** 50 skills → 4K metadata + 2K active = 98% context reduction. At 40K scale → RAG over skill metadata.

**Multi-Agent vs Skills:** Multi-agent for genuine async parallelism or security isolation. Skills win for almost everything else — 1 agent + 100 skills beats 100 sub-agents operationally.

**Evaluation:** Four gates — Trigger precision, Output quality, Tool trajectory, Token budget. Four failure modes: Trigger failure, Context overflow, Hallucinated capability, Composition explosion.

**Future:** Meta-skills (skills that improve skills), Skill marketplaces, Cross-platform standard (Claude Code, Copilot, Cursor, Antigravity).

**[VIETNAMESE VERSION]**

Day 3 giới thiệu **Agent Skills** như **primitive bộ nhớ thủ tục (procedural memory)** cho LLM agents — giải quyết 4 điểm ma sát cốt lõi: context rot, thiếu procedural memory, multi-agent overload, portability.

**Đổi Mới Cốt Lõi: Progressive Disclosure (Công Bố Tiến Bộ)**
Thay vì load tất cả hướng dẫn/tools vào context window (gây attention dilution và "lost-in-the-middle"), Skills load **on-demand (khi cần)**:
- Thư viện 50 skills: chỉ ~4K tokens cho metadata
- Skill active: ~2K tokens khi triggered
- **Giảm 98% context active** so với prompt monolithic

**Cấu Trúc SKILL.md:**
- **YAML Frontmatter:** `name`, `description` (cụm từ trigger quan trọng nhất)
- **Markdown Body:** Goal, Instructions, Examples, Constraints
- **Tùy chọn:** `scripts/` (thực thi deterministik), `references/`, `assets/`

**Hai Con Đường Tạo Skill:**
- **Path A (SME-driven):** Dịch SOP → markdown (không cần code)
- **Path B (Trace-driven):** Bắt trace thành công → kết tinh thành skill

**Skills vs MCP vs agents.md:**
- **MCP** = Reach (hệ thống ngoài) = "chân tay"
- **agents.md** = Rules toàn cục = "hiến pháp"
- **Skills** = Procedural memory = "bộ não" (on-demand)

**Kinh Tế Token:** 50 skills → 4K metadata + 2K active = giảm 98% context. Quy mô 40K → RAG over skill metadata.

**Multi-Agent vs Skills:** Multi-agent cho async parallelism thật hoặc security isolation. Skills thắng hầu hết — 1 agent + 100 skills thắng 100 sub-agent về mặt vận hành.

**Đánh Giá:** 4 cổng — Trigger precision, Output quality, Tool trajectory, Token budget. 4 failure modes: Trigger failure, Context overflow, Hallucinated capability, Composition explosion.

**Tương Lai:** Meta-skills (skills cải tiến skills), Skill marketplaces, Chuẩn cross-platform (Claude Code, Copilot, Cursor, Antigravity).

---

## ✅ ACTION ITEMS (DAY 3 CHECKLIST)

- [ ] **Listen to Podcast** (23:42) + take notes in this file
- [ ] **Read Whitepaper** (62 pages) + extract key takeaways in this file
- [ ] **Codelab 1:** Explore Skills in Antigravity - Author SKILL.md
- [ ] **Codelab 2:** Agents CLI + ADK 2.0 - Scaffold, lint, test agent
- [ ] **Screenshot Evidence** for both codelabs → `Day 3\evidence\`
- [ ] **Discord #5dgai-question-forum** - Post questions
- [ ] **Forum Browse** Day 3 discussion
- [ ] **Capstone Refinement:** Add Skills layer to 3 ideas
- [ ] **Livestream Tomorrow** (Jun 18, 11 AM PT) - YouTube

---

## 💡 CAPSTONE PROJECT REFINEMENT (DAY 3 LAYER)

> **Update your 3 ideas from Day 1/2 with Skills layer**

### IDEA 1: [Name from Day 1]

**Core Skills Needed:**
- [ ] `skill-name` — Description
- [ ] `skill-name` — Description

**MCP Servers:** (from Day 2)
- [ ] 
- [ ] 

**A2A Pattern:** (from Day 2)
- [ ] Orchestrator → Specialist agents
- [ ] Peer-to-peer agent communication

**Commerce Model:** (from Day 2)
- [ ] Per-Call / Subscription / Outcome-Based / Revenue Share

---

### IDEA 2: [Name from Day 1]

**Core Skills Needed:**
- [ ] 
- [ ] 

**MCP Servers:**
- [ ] 
- [ ] 

**A2A Pattern:**
- [ ] 
- [ ] 

**Commerce Model:**
- [ ] 

---

### IDEA 3: [Name from Day 1]

**Core Skills Needed:**
- [ ] 
- [ ] 

**MCP Servers:**
- [ ] 
- [ ] 

**A2A Pattern:**
- [ ] 
- [ ] 

**Commerce Model:**
- [ ] 

---

## 🔗 ALL IMPORTANT LINKS

| Resource | Link |
|----------|------|
| Podcast (YouTube) | https://www.youtube.com/watch?v=uYURYHhpmKc |
| Whitepaper (Kaggle) | https://www.kaggle.com/whitepaper-agent-skills |
| Codelab 1: Antigravity Skills | https://codelabs.developers.google.com/getting-started-with-antigravity-skills |
| Codelab 2: Agents CLI + ADK | https://codelabs.developers.google.com/agents-cli-adk-lifecycle |
| Agents CLI GitHub | https://github.com/google/agents-cli |
| ADK 2.0 Docs | https://github.com/google/adk-python |
| Kaggle Discord | https://discord.gg/kaggle |
| Day 3 Discussion Forum | https://www.kaggle.com/competitions/5-day-ai-agents-intensive-vibecoding-course-with-google/discussion |
| Livestream (Jun 18, 11 AM PT) | https://youtube.com/live/1T2mxYZkqL0 |
| Previous Recordings | https://www.youtube.com/playlist?list=PLqFaTIg4myu8AFXUjrVhDkUGp0A9kK8CX |

---

**File Location:** `C:\Users\nguye\OneDrive\Documents\Projects\AI Agent (Google x Kaggle)\Day 3\cornell_notes_day3.md`  
**Created:** June 17, 2026  
**Method:** Cornell Note-Taking System (Keywords/Notes/Summary)  
**Format:** English first, Vietnamese below in each section (labeled)  
**Scope:** Complete Day 3 knowledge in ONE file
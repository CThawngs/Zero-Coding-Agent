# 📚 CORNELL NOTES: DAY 2 - AGENT TOOLS & INTEROPERABILITY
**Course:** 5-Day AI Agents Intensive with Google × Kaggle  
**Date:** June 16, 2026  
**Unit:** 2 - Agent Tools & Interoperability  
**Resources:**  
- 🎧 Podcast: https://www.youtube.com/watch?v=GjjKXqxFTOY  
- 📄 Whitepaper: "Agent Tools & Interoperability" (49 pages) - https://www.kaggle.com/whitepaper-agent-tools-and-interoperability  
- 🧪 Codelab 1: Get started with Antigravity CLI - https://codelabs.developers.google.com/antigravity-cli-hands-on#0  
- 🧪 Codelab 2: Explore Google Developer Knowledge MCP server - https://codelabs.developers.google.com/developer-knowledge-mcp-antigravity  

---

## 🎯 CORNELL METHOD STRUCTURE

| **KEYWORDS / QUESTIONS (Cues)** | **NOTES (Note-taking Area)** |
|---|---|
| *(Left column - for review)* | *(Right column - during learning)* |

> **FORMAT:** Each section contains **English version first**, then **Vietnamese version below** (labeled clearly). Summary also follows this pattern.

---

## 🔑 KEYWORDS / QUESTIONS (CUES)

### Podcast Core Concepts
1. **Model Context Protocol (MCP)** - Standardized tool connection
2. **Agent2Agent (A2A)** - Agent-to-agent collaboration protocol
3. **Agent-to-UI (A2UI)** - Generative UI for agents
4. **Agent Payments Protocol (AP2)** - Machine-to-machine commerce
5. **Universal Commerce Protocol (UCP)** - Secure commerce standard
6. **N×M Prototyping Problem** - Why custom integrations fail
7. **Vibe Coder's View of MCP** - Discovery, Configuration, Connection

### Whitepaper Structure (49 Pages)
8. **Introduction** (pp.6-9): Why this paper, who it's for
9. **MCP from Vibe Coder View** (pp.10-16): Discovery, Config, Connection, N×M Problem, Debugging, Best Practices
10. **Agent-to-Agent (A2A) Interoperability** (pp.17-30): Architectures, bounded/unbounded, GOTO problem, virtual workforce, agent cards, registries
11. **Agent-to-UI (A2UI) Interoperability** (pp.31-34): Communication gap, generative UI, secure implementation, catalog
12. **Commerce Protocols** (pp.35-39): AP2, UCP, monetizing agents
13. **Implementation** (pp.40-49): Practical codelabs, debugging, production patterns

### Codelab Skills
14. **Antigravity CLI** - Terminal-based vibe coding
15. **MCP Server Configuration** - Adding Google Developer Knowledge MCP
16. **MCP Querying** - Accessing canonical docs via protocol

---

## 📝 NOTES (NOTE-TAKING AREA)

---

### 1. INTRODUCTION & MOTIVATION

**[ENGLISH VERSION]**

**Authors:** Kanchana Patlolla, Łukasz Olejniczak, Pier Paolo Ippolito (Google)  
**Date:** May 2026 | **Length:** 49 pages

**Core Thesis:** In the era of vibe coding with less structure, harnesses and protocols help build trust in the agent development process. While velocity remains the primary driver, **standardized protocols** allow expanding further by transforming isolated "custom machines" into **modular, interoperable platforms**.

**The Problem:** Without agreed open standards, developers create tech debt - each API becomes a "standard-of-one". These are low-leverage tasks: writing fragile, bespoke wrappers for every tool, maintaining them over time, adapting to others' needs.

**The Solution:** Adopting protocol layers allows a shift from being a mere **builder** to a high-level **orchestrator**.

**Key Quote:** *"Without agreed upon open standards, developers are creating tech debt, each API is a standard-of-one."*

**[VIETNAMESE VERSION]**

**Tác giả:** Kanchana Patlolla, Łukasz Olejniczak, Pier Paolo Ippolito (Google)  
**Ngày:** Tháng 5/2026 | **Độ dài:** 49 trang

**Thuyết cốt lõi:** Trong kỷ nguyên vibe coding ít cấu trúc hơn, khung làm việc (harnesses) và giao thức (protocols) giúp xây dựng niềm tin trong quá trình phát triển agent. Mặc dù tốc độ vẫn là động lực chính, **các giao thức tiêu chuẩn** cho phép mở rộng xa hơn bằng cách biến các "máy tùy chỉnh" cô lập thành **nền tảng mô-đun, tương thích**.

**Vấn đề:** Không có tiêu chuẩn mở đồng thuận, dev tạo nợ kĩ thuật - mỗi API trở thành "tiêu chuẩn của một". Đây là việc đòn bẩy thấp: viết wrapper bespoke mong manh cho mỗi công cụ, duy trì theo thời gian, thích ứng với nhu cầu người khác.

**Giải pháp:** Áp dụng các lớp giao thức cho phép chuyển dịch từ đơn thuần **builder** thành **orchestrator** cấp cao.

**Trích dẫn quan trọng:** *"Không có tiêu chuẩn mở đồng thuận, các nhà phát triển đang tạo nợ kĩ thuật, mỗi API là một tiêu chuẩn riêng."*

---

### 2. MODEL CONTEXT PROTOCOL (MCP) - VIBE CODER'S VIEW

**[ENGLISH VERSION]**

**What is MCP?**
An open protocol that standardizes how applications provide context to LLMs. Think of it as **"USB-C for AI tools"** - a universal connector between models and data sources/tools.

**Three Pillars for Vibe Coders:**

| Pillar | Description | Vibe Coder Action |
|--------|-------------|-------------------|
| **Discovery** | Finding available MCP servers | Browse registries, search `mcp.so`, GitHub, npm |
| **Configuration** | Setting up server connections | Edit `mcp.json` / `config.json`, define transport (stdio/SSE) |
| **Connection** | Establishing runtime link | Launch server, verify tools/resources/prompts appear |

**The N×M Prototyping Problem:**
- **Without MCP:** N models × M tools = N×M custom integrations
- **With MCP:** N models + M tools = N + M standardized connections
- **Result:** Exponential reduction in integration complexity

**Debugging MCP Servers:**
1. Check server logs (stdio/SSE)
2. Verify tool schema validity (JSON Schema)
3. Test with MCP Inspector tool
4. Validate transport layer connectivity

**Vibe Coder Toolkit - Best Practices:**
- Start with official MCP servers (filesystem, git, postgres, etc.)
- Use stdio transport for local, SSE for remote
- Pin server versions in config
- Implement graceful fallback when MCP unavailable

**[VIETNAMESE VERSION]**

**MCP là gì?**
Giao thức mở chuẩn hóa cách ứng dụng cung cấp ngữ cảnh cho LLM. Hãy nghĩ như **"USB-C cho công cụ AI"** - bộ kết nối phổ dụng giữa mô hình và nguồn dữ liệu/công cụ.

**Ba Trụ Cột Cho Vibe Coders:**

| Trụ cột | Mô tả | Hành động Vibe Coder |
|---------|-------|---------------------|
| **Discovery (Khám phá)** | Tìm MCP servers có sẵn | Duyệt registries, tìm `mcp.so`, GitHub, npm |
| **Configuration (Cấu hình)** | Thiết lập kết nối server | Chỉnh `mcp.json` / `config.json`, định nghĩa transport (stdio/SSE) |
| **Connection (Kết nối)** | Thiết lập link runtime | Khởi động server, verify tools/resources/prompts xuất hiện |

**Vấn Đề N×M Prototyping:**
- **Không có MCP:** N mô hình × M công cụ = N×M tích hợp tùy chỉnh
- **Có MCP:** N mô hình + M công cụ = N + M kết nối tiêu chuẩn
- **Kết quả:** Giảm phức độ tích hợp theo cấp số mũ

**Debug MCP Servers:**
1. Kiểm tra log server (stdio/SSE)
2. Verify schema công cụ (JSON Schema)
3. Test với MCP Inspector tool
4. Validate kết nối transport layer

**Bộ Công Cụ Vibe Coder - Best Practices:**
- Bắt đầu với MCP servers chính thức (filesystem, git, postgres, v.v.)
- Dùng stdio transport cho local, SSE cho remote
- Pin version server trong config
- Implement fallback nhẹ nhàng khi MCP không khả dụng

---

### 3. AGENT-TO-AGENT (A2A) INTEROPERABILITY

**[ENGLISH VERSION]**

**What is A2A?**
An open protocol enabling secure communication and collaboration between AI agents built on different frameworks by different companies. Announced by Google (April 2024).

**Core Components:**

| Component | Purpose |
|-----------|---------|
| **Agent Card** | Metadata manifest: capabilities, skills, auth, endpoints |
| **Task** | Unit of work with state (pending/running/completed/failed) |
| **Message** | Communication unit (parts: text, file, data) |
| **Artifact** | Output produced by agent (files, data, UI) |
| **Push Notifications** | Async updates for long-running tasks |

**Bounded vs. Unbounded Domains:**

| Domain Type | Description | A2A Role |
|-------------|-------------|----------|
| **Bounded** | Well-defined scope (e.g., calendar, email) | Direct delegation, clear contracts |
| **Unbounded** | Open-ended (e.g., research, creative) | Iterative collaboration, dynamic discovery |

**The GOTO Problem in Agentic Architecture:**
- Agents jumping between tasks without clear handoffs
- Context loss during delegation
- **A2A Solution:** Structured task lifecycle, explicit state transitions, artifact passing

**Virtual Workforce Architecture:**
```
Orchestrator Agent
    │
    ├──→ Specialist Agent A (via A2A)
    ├──→ Specialist Agent B (via A2A)
    └──→ Specialist Agent C (via A2A)
```

**Agent Cards & Registries:**
- **Public Marketplaces:** Discover agents by capability
- **Private Enterprise Registries:** Internal agent catalog
- **Agent Card Schema:** JSON manifest with skills, auth, endpoints

**Implementing A2A:**
1. **Expose A2A Agent:** Implement JSON-RPC 2.0 over HTTP, serve Agent Card at `/.well-known/agent-card.json`
2. **Connect Remote Agents:** Discover via registry, negotiate capabilities, delegate tasks
3. **Push Notifications:** Webhook-based async updates for long-running operations

**[VIETNAMESE VERSION]**

**A2A là gì?**
Giao thức mở cho phép giao tiếp và hợp tác an toàn giữa các AI agent được xây trên framework khác nhau bởi công ty khác nhau. Được Google tuyên bố (Tháng 4/2024).

**Các Thành Phần Cốt Lõi:**

| Thành phần | Mục đích |
|------------|----------|
| **Agent Card** | Manifest metadata: capabilities, skills, auth, endpoints |
| **Task** | Đơn vị công việc có trạng thái (pending/running/completed/failed) |
| **Message** | Đơn vị giao tiếp (parts: text, file, data) |
| **Artifact** | Output do agent tạo ra (files, data, UI) |
| **Push Notifications** | Cập nhật async cho task lâu |

**Bounded vs. Unbounded Domains:**

| Loại Domain | Mô tả | Vai trò A2A |
|-------------|-------|-------------|
| **Bounded (Có giới hạn)** | Phạm vi rõ ràng (calendar, email) | Ủy thác trực tiếp, hợp đồng rõ ràng |
| **Unbounded (Không giới hạn)** | Mở (research, creative) | Hợp tác lặp, khám phá động |

**Vấn Đề GOTO Trong Kiến Trúc Agentic:**
- Agent nhảy giữa các task không có giao việc rõ ràng
- Mất ngữ cảnh khi ủy thác
- **Giải pháp A2A:** Đời sống task có cấu trúc, chuyển trạng thái tường minh, truyền artifact

**Kiến Trúc Lực Lượng Ảo:**
```
Orchestrator Agent
    │
    ├──→ Specialist Agent A (via A2A)
    ├──→ Specialist Agent B (via A2A)
    └──→ Specialist Agent C (via A2A)
```

**Agent Cards & Registries:**
- **Public Marketplaces:** Khám phá agent theo capability
- **Private Enterprise Registries:** Catalog agent nội bộ
- **Agent Card Schema:** JSON manifest với skills, auth, endpoints

**Triển Khai A2A:**
1. **Expose A2A Agent:** Implement JSON-RPC 2.0 over HTTP, serve Agent Card tại `/.well-known/agent-card.json`
2. **Connect Remote Agents:** Khám phá qua registry, thương lượng capabilities, ủy thác task
3. **Push Notifications:** Webhook-based async updates cho operations lâu

---

### 4. AGENT-TO-UI (A2UI) INTEROPERABILITY

**[ENGLISH VERSION]**

**The Communication Gap:**
Traditional agents return text/JSON. Modern users expect rich, interactive UIs. A2UI bridges this by standardizing how agents generate and deliver **Generative UI**.

**What is Generative UI?**
UI components generated dynamically by agents at runtime based on context, user intent, and available data. Not pre-built screens - assembled on-demand.

**A2UI: Secure Implementation:**
- **Sandboxed rendering:** UI components execute in isolated environments
- **Capability-based permissions:** UI requests only needed permissions
- **Streaming updates:** Progressive UI enhancement as agent processes

**The Basic Catalog:**
Standard UI components agents can generate:
- Forms (input, select, date picker)
- Tables (sortable, filterable, paginated)
- Charts (line, bar, pie, scatter)
- Cards (media, action, info)
- Modals/Dialogs

**Bringing Your Own Components:**
Teams can extend catalog with domain-specific components while maintaining A2UI compatibility.

**[VIETNAMESE VERSION]**

**Khoảng Cách Giao Tiếp:**
Agent truyền thống trả về text/JSON. Người dùng hiện đại mong đợi UI 풍부, interactive. A2UI cầu nối bằng cách chuẩn hóa cách agent tạo và phân phối **Generative UI**.

**Generative UI Là Gì?**
Các thành phần UI được tạo động bởi agent tại runtime dựa trên ngữ cảnh, ý định người dùng, dữ liệu có sẵn. Không phải màn hình pre-built - assembled on-demand.

**A2UI: Triển Khai An Toàn:**
- **Sandboxed rendering:** UI components chạy trong môi trường cô lập
- **Capability-based permissions:** UI chỉ yêu cầu permissions cần thiết
- **Streaming updates:** UI cải tiến tiến tiến khi agent xử lý

**Basic Catalog (Catalog Cơ Bản):**
Các thành phần UI chuẩn agent có thể tạo:
- Forms (input, select, date picker)
- Tables (sortable, filterable, paginated)
- Charts (line, bar, pie, scatter)
- Cards (media, action, info)
- Modals/Dialogs

**Mang Component Của Mình:**
Team có thể mở rộng catalog với component domain-specific đồng thời giữ tương thích A2UI.

---

### 5. COMMERCE PROTOCOLS: AP2 & UCP

**[ENGLISH VERSION]**

**Agent Payments Protocol (AP2):**
Standard for **machine-to-machine payments** between agents. Enables:
- Autonomous service procurement
- Usage-based billing
- Escrow for multi-step transactions
- Audit trails for compliance

**Universal Commerce Protocol (UCP):**
Broader commerce layer for agent economies:
- **Identity & Reputation:** Verifiable agent credentials
- **Contract Negotiation:** Automated SLA agreement
- **Settlement:** Multi-currency, cross-chain support
- **Dispute Resolution:** Automated arbitration

**Monetizing A2A Agents:**
| Model | Description |
|-------|-------------|
| **Per-Call** | Pay per API invocation |
| **Subscription** | Monthly/annual access to agent |
| **Outcome-Based** | Pay for results (e.g., leads generated) |
| **Revenue Share** | Percentage of value created |

**Key Insight:** These protocols transform agents from **cost centers** into **revenue-generating autonomous services**.

**[VIETNAMESE VERSION]**

**Agent Payments Protocol (AP2):**
Tiêu chuẩn cho **thanh toán machine-to-machine** giữa các agent. Cho phép:
- Mua dịch vụ tự chủ
- Billing dựa trên usage
- Escrow cho giao dịch multi-step
- Audit trail cho compliance

**Universal Commerce Protocol (UCP):**
Lớp commerce rộng hơn cho agent economies:
- **Identity & Reputation:** Credentials agent có thể verify
- **Contract Negotiation:** Đàm phán SLA tự động
- **Settlement:** Hỗ trợ multi-currency, cross-chain
- **Dispute Resolution:** Trọng tài tự động

**Monetizing A2A Agents:**
| Mô hình | Mô tả |
|---------|-------|
| **Per-Call** | Trả phí mỗi lần gọi API |
| **Subscription** | Truy cập hàng tháng/năm |
| **Outcome-Based** | Trả cho kết quả (vd: leads) |
| **Revenue Share** | % giá trị được tạo ra |

**Insight Quan Trọng:** Các giao thức này chuyển agent từ **cost centers** thành **dịch vụ tự chủ sinh lời**.

---

### 6. CODELABS: PRACTICAL IMPLEMENTATION

**[ENGLISH VERSION]**

**Codelab 1: Get Started with Antigravity CLI**
- **URL:** https://codelabs.developers.google.com/antigravity-cli-hands-on#0
- **Skills:** Terminal-based vibe coding, MCP server management
- **Key Tasks:**
  1. Install/verify Antigravity CLI
  2. Configure MCP servers in `mcp.json`
  3. Test CLI commands (`antigravity mcp list`, `antigravity mcp call`)
  4. Connect to Google Developer Knowledge MCP

**Codelab 2: Explore Google Developer Knowledge MCP Server**
- **URL:** https://codelabs.developers.google.com/developer-knowledge-mcp-antigravity
- **Skills:** Querying canonical Google docs via MCP
- **Key Tasks:**
  1. Add Google Developer Knowledge MCP to Antigravity
  2. Query APIs, SDKs, best practices via natural language
  3. Access machine-readable developer documentation
  4. Understand MCP resource/tool/prompt patterns

**MCP Server Configuration Pattern:**
```json
{
  "mcpServers": {
    "google-developer-knowledge": {
      "command": "npx",
      "args": ["-y", "@google/mcp-server-developer-knowledge"],
      "transport": "stdio"
    }
  }
}
```

**[VIETNAMESE VERSION]**

**Codelab 1: Bắt đầu với Antigravity CLI**
- **URL:** https://codelabs.developers.google.com/antigravity-cli-hands-on#0
- **Kỹ năng:** Vibe coding terminal-based, quản lý MCP server
- **Nhiệm vụ chính:**
  1. Cài đặt/verify Antigravity CLI
  2. Cấu hình MCP servers trong `mcp.json`
  3. Test CLI commands (`antigravity mcp list`, `antigravity mcp call`)
  4. Kết nối Google Developer Knowledge MCP

**Codelab 2: Khám phá Google Developer Knowledge MCP Server**
- **URL:** https://codelabs.developers.google.com/developer-knowledge-mcp-antigravity
- **Kỹ năng:** Truy vấn docs Google chuẩn xác qua MCP
- **Nhiệm vụ chính:**
  1. Thêm Google Developer Knowledge MCP vào Antigravity
  2. Truy vấn APIs, SDKs, best practices bằng ngôn ngữ tự nhiên
  3. Truy cập tài liệu dev machine-readable
  4. Hiểu pattern MCP resource/tool/prompt

**Pattern Cấu Hình MCP Server:**
```json
{
  "mcpServers": {
    "google-developer-knowledge": {
      "command": "npx",
      "args": ["-y", "@google/mcp-server-developer-knowledge"],
      "transport": "stdio"
    }
  }
}
```

---

## 📝 SUMMARY (TÓM TẮT)

### [ENGLISH VERSION]

Day 2 establishes the **protocol layer** for agent interoperability. The whitepaper introduces five key protocols solving the fragmentation of the AI agent ecosystem:

1. **MCP (Model Context Protocol)** - Universal connector between models and tools/data ("USB-C for AI"). Solves the N×M integration problem by standardizing discovery, configuration, and connection.

2. **A2A (Agent2Agent)** - Secure agent-to-agent collaboration protocol with Agent Cards, Tasks, Messages, Artifacts, and Push Notifications. Enables virtual workforce architectures with bounded/unbounded domain specialization.

3. **A2UI (Agent-to-UI)** - Generative UI standard for dynamic, sandboxed, capability-based UI components generated at runtime.

4. **AP2 (Agent Payments Protocol)** - Machine-to-machine payments for autonomous service procurement.

5. **UCP (Universal Commerce Protocol)** - Full commerce layer with identity, contracts, settlement, and dispute resolution.

**Codelabs** provide hands-on experience with Antigravity CLI and Google Developer Knowledge MCP, demonstrating how vibe coders can leverage standardized protocols instead of building custom integrations.

**Key Takeaway:** Protocols transform developers from **builders of custom wrappers** into **orchestrators of interoperable platforms**. This is the harness engineering layer from Day 1 applied to the tool ecosystem.

### [VIETNAMESE VERSION]

Day 2 thiết lập **lớp giao thức** cho tính tương thích agent. Whitepaper giới thiệu năm giao thức chính giải quyết sự phân mảnh của hệ sinh thái AI agent:

1. **MCP (Model Context Protocol)** - Bộ kết nối phổ dụng giữa mô hình và công cụ/dữ liệu ("USB-C cho AI"). Giải quyết vấn đề tích hợp N×M bằng cách chuẩn hóa khám phá, cấu hình, kết nối.

2. **A2A (Agent2Agent)** - Giao thức hợp tác agent-to-agent an toàn với Agent Cards, Tasks, Messages, Artifacts, Push Notifications. Cho phép kiến trúc lực lượng ảo với chuyên môn hóa bounded/unbounded domain.

3. **A2UI (Agent-to-UI)** - Tiêu chuẩn Generative UI cho các thành phần UI dynamic, sandboxed, capability-based được tạo tại runtime.

4. **AP2 (Agent Payments Protocol)** - Thanh toán machine-to-machine cho procurement dịch vụ tự chủ.

5. **UCP (Universal Commerce Protocol)** - Lớp commerce đầy đủ với identity, contracts, settlement, dispute resolution.

**Codelabs** cung cấp trải nghiệm thực hành với Antigravity CLI và Google Developer Knowledge MCP, demo cách vibe coders tận dụng giao thức tiêu chuẩn thay vì build tích hợp tùy chỉnh.

**Key Takeaway:** Giao thức chuyển dev từ **builder của wrapper tùy chỉnh** thành **orchestrator của nền tảng tương thích**. Đây là lớp harness engineering từ Day 1 áp dụng cho hệ sinh thái công cụ.

---

## ✅ ACTION ITEMS (DAY 2 CHECKLIST)

- [ ] **Listen to Podcast** (15 min) + take notes in this file
- [ ] **Read Whitepaper** (49 pages) + extract key takeaways in this file
- [ ] **Codelab 1:** Antigravity CLI - Configure MCP servers
- [ ] **Codelab 2:** Google Developer Knowledge MCP - Query docs
- [ ] **Screenshot Evidence** for both codelabs → `Day 2\evidence\`
- [ ] **Discord #5dgai-question-forum** - Post questions
- [ ] **Forum Browse** Day 2 discussion
- [ ] **Capstone Refinement:** Add tool/MCP layer to 3 ideas
- [ ] **Livestream Tomorrow** (Jun 17, 11 AM PT) - YouTube

---

## 💡 CAPSTONE PROJECT REFINEMENT (DAY 2 LAYER)

> **Update your 3 ideas from Day 1 with tool/MCP/A2A considerations**

### IDEA 1: [Name from Day 1]

**MCP Servers Needed:**
- [ ] 
- [ ] 

**A2A Collaboration Pattern:**
- [ ] Orchestrator → Specialist agents
- [ ] Peer-to-peer agent communication
- [ ] Human-in-the-loop delegation

**Commerce Model (if applicable):**
- [ ] Per-Call
- [ ] Subscription
- [ ] Outcome-Based
- [ ] Revenue Share

**External APIs/Tools to Wrap as MCP:**
- [ ] 
- [ ] 

---

### IDEA 2: [Name from Day 1]

**MCP Servers Needed:**
- [ ] 
- [ ] 

**A2A Collaboration Pattern:**
- [ ] 
- [ ] 

**Commerce Model:**
- [ ] 

**External APIs/Tools to Wrap as MCP:**
- [ ] 
- [ ] 

---

### IDEA 3: [Name from Day 1]

**MCP Servers Needed:**
- [ ] 
- [ ] 

**A2A Collaboration Pattern:**
- [ ] 
- [ ] 

**Commerce Model:**
- [ ] 

**External APIs/Tools to Wrap as MCP:**
- [ ] 
- [ ] 

---

## 🔗 ALL IMPORTANT LINKS

| Resource | Link |
|----------|------|
| Podcast (YouTube) | https://www.youtube.com/watch?v=GjjKXqxFTOY |
| Whitepaper (Kaggle) | https://www.kaggle.com/whitepaper-agent-tools-and-interoperability |
| Codelab 1: Antigravity CLI | https://codelabs.developers.google.com/antigravity-cli-hands-on#0 |
| Codelab 2: Developer Knowledge MCP | https://codelabs.developers.google.com/developer-knowledge-mcp-antigravity |
| A2A Protocol Announcement | https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/ |
| A2A GitHub | https://github.com/a2aproject/A2A |
| MCP Specification | https://modelcontextprotocol.io/ |
| Kaggle Discord | https://discord.gg/kaggle |
| Day 2 Discussion Forum | https://www.kaggle.com/competitions/5-day-ai-agents-intensive-vibecoding-course-with-google/discussion |
| Livestream (Jun 17, 11 AM PT) | https://youtube.com/live/PGI_S59EoRA |
| Day 1 Recording | https://youtube.com/live/7iic3Zj427M |

---

**File Location:** `C:\Users\nguye\OneDrive\Documents\Projects\AI Agent (Google x Kaggle)\Day 2\cornell_notes_day2.md`  
**Created:** June 16, 2026  
**Method:** Cornell Note-Taking System (Keywords/Notes/Summary)  
**Format:** English first, Vietnamese below in each section (labeled)  
**Scope:** Complete Day 2 knowledge in ONE file
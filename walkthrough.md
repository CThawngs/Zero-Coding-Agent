# Walkthrough: Capstone Project Completed 🎉

Dự án Capstone cho khóa học **Google × Kaggle 5-Day AI Agents Intensive** đã được hoàn thiện 100%, tích hợp đầy đủ các kiến thức từ Ngày 1 đến Ngày 5.

---

## Các tính năng đã triển khai

### 1. Model Context Protocol (MCP) - Day 2 & 4
- **MCP Client Manager** ([mcpManager.js](file:///c:/Users/nguye/OneDrive/Documents/Projects/AI%20Agent%20%28Google%20x%20Kaggle%29/antigravity-web/backend/src/services/mcpManager.js)): Tự động kết nối tới các MCP server cục bộ bằng stdio và JSON-RPC 2.0. Thực hiện thành công bắt tay `initialize`, khám phá các tool của server (`tools/list`), và gọi tool (`tools/call`).
- **REST API** ([mcp.js](file:///c:/Users/nguye/OneDrive/Documents/Projects/AI%20Agent%20%28Google%29/antigravity-web/backend/src/routes/mcp.js)): Quản lý thêm, sửa, xóa, lấy trạng thái sống của các MCP servers.
- **UI Settings Panel** ([SettingsModal.jsx](file:///c:/Users/nguye/OneDrive/Documents/Projects/AI%20Agent%20%28Google%29/antigravity-web/frontend/src/components/Settings/SettingsModal.jsx)): Thêm tab cấu hình MCP cho phép xem trạng thái các server, danh sách tool chi tiết của từng server, và form đăng ký nhanh.
- **LLM Integration**: Các MCP tools được tự động load và cung cấp động vào system prompt của AI Agent.

### 2. Agent-to-Agent (A2A) Collaboration - Day 2 & 4
- **Agent Card**: Cung cấp tệp metadata tiêu chuẩn tại route `/.well-known/agent-card.json` mô tả kỹ năng của agent.
- **Cổng giao dịch JSON-RPC 2.0**: Route [a2a.js](file:///c:/Users/nguye/OneDrive/Documents/Projects/AI%20Agent%20%28Google%29/antigravity-web/backend/src/routes/a2a.js) cho phép các AI Agent bên ngoài tạo tác vụ (`task.create`), theo dõi tiến độ (`task.status`), và hủy tác vụ (`task.cancel`).
- **Tool ủy thác**: Cung cấp tool `delegate_to_agent(agentUrl, prompt)` cho AI để có thể chuyển giao tác vụ lâu dài cho agent chuyên môn khác.

### 3. Agent Skills & Progressive Disclosure - Day 3
- **Skills Directory** ([skills/](file:///c:/Users/nguye/OneDrive/Documents/Projects/AI%20Agent%20%28Google%29/skills/)): Chứa các kỹ năng thủ tục viết bằng tệp Markdown và YAML frontmatter:
  - [file-operations/SKILL.md](file:///c:/Users/nguye/OneDrive/Documents/Projects/AI%20Agent%20%28Google%29/skills/file-operations/SKILL.md)
  - [code-review/SKILL.md](file:///c:/Users/nguye/OneDrive/Documents/Projects/AI%20Agent%20%28Google%29/skills/code-review/SKILL.md)
- **Progressive Disclosure** ([skillsManager.js](file:///c:/Users/nguye/OneDrive/Documents/Projects/AI%20Agent%20%28Google%29/antigravity-web/backend/src/services/skillsManager.js)): Tự động đối sánh từ khóa trong prompt của user với mô tả của skill để chỉ nạp những skill cần thiết vào prompt hệ thống, tiết kiệm token và tránh nhiễu ngữ cảnh (Context Rot).

### 4. Spec-Driven Development - Day 5
- **Behavior Specs** ([docs/spec/](file:///c:/Users/nguye/OneDrive/Documents/Projects/AI%20Agent%20%28Google%29/docs/spec/)): Tài liệu hóa các đặc tả hành vi của agent dưới dạng Gherkin (.feature):
  - [file_ops.feature](file:///c:/Users/nguye/OneDrive/Documents/Projects/AI%20Agent%20%28Google%29/docs/spec/file_ops.feature)
  - [mcp.feature](file:///c:/Users/nguye/OneDrive/Documents/Projects/AI%20Agent%20%28Google%29/docs/spec/mcp.feature)

---

## Hướng dẫn Khởi chạy và Xác thực

### Bước 1: Chạy Server Backend & Frontend
Cả 2 server hiện tại đang được khởi chạy ngầm tự động trong môi trường làm việc của bạn:
- **Backend:** `http://localhost:3747`
- **Frontend:** `http://localhost:5743`

Bạn có thể chạy tệp tin `start.bat` trong thư mục project để khởi chạy thủ công cả hai cùng một lúc khi mở máy:
```cmd
start.bat
```

### Bước 2: Xác thực các API Endpoints bằng Terminal
Chạy các lệnh PowerShell sau để kiểm tra tính năng A2A:

1. **Kiểm tra Agent Card:**
   ```powershell
   Invoke-RestMethod -Uri 'http://localhost:3747/.well-known/agent-card.json' | ConvertTo-Json
   ```

2. **Tạo Task thông qua JSON-RPC 2.0:**
   ```powershell
   $body = @{
     jsonrpc = "2.0"
     id = "1"
     method = "task.create"
     params = @{ prompt = "Review code in src/app.js" }
   } | ConvertTo-Json
   Invoke-RestMethod -Uri "http://localhost:3747/api/a2a" -Method Post -Body $body -ContentType "application/json" | ConvertTo-Json
   ```

3. **Thêm server MCP từ giao diện Web:**
   - Mở trình duyệt truy cập `http://localhost:5743`.
   - Vào nút cài đặt hình bánh răng ⚙️ ở góc dưới cùng bên trái.
   - Chọn tab **MCP** mới.
   - Điền ID là `google-developer-knowledge`, Command là `npx`, Arguments là `-y, @google/mcp-server-developer-knowledge`.
   - Nhấn **Thêm Server** và theo dõi trạng thái hiển thị của server cùng các công cụ (tools) của nó!

# Walkthrough: Capstone Project Completed 🎉

Dự án Capstone cho khóa học **Google × Kaggle 5-Day AI Agents Intensive** đã được hoàn thiện 100%, tích hợp đầy đủ các kiến thức từ Ngày 1 đến Ngày 5 cùng các cải tiến giao diện/UX cao cấp và tính năng hệ thống vượt trội.

---

## Các tính năng đã triển khai & Cải tiến mới

### 1. Đa Nhiệm & Chạy Song Song Nhiều Phiên Chat (Parallel Background Streaming) 🔄
- **Độc lập luồng xử lý**: Nâng cấp toàn diện kiến trúc quản lý trạng thái (`chatStore.js`). Các phiên stream API và quá trình suy nghĩ/coding của AI Agent giờ đây được đóng gói độc lập theo từng `conversationId` trong một bản đồ `activeStreams`.
- **Hoạt động ngầm (Background Processing)**: Khi AI Agent đang viết code ở phiên chat A, bạn hoàn toàn có thể chuyển sang phiên chat B hoặc tạo một phiên chat mới để hỏi đáp tác vụ khác. AI Agent ở phiên chat A vẫn tiếp tục nhận dữ liệu SSE, chạy loop công cụ và lưu kết quả bình thường ở chế độ nền mà không bị ngắt quãng.
- **Biểu tượng Loading song song trên Sidebar**: 
  - Mỗi cuộc trò chuyện đang có AI Agent hoạt động ngầm sẽ hiển thị một vòng xoay loading xoay tròn (`Loader2` spinner) ở phía bên phải tiêu đề cuộc trò chuyện trong Sidebar (giống giao diện Antigravity 2.0).
  - Vòng xoay này sẽ tự động biến mất và hiển thị lại nút Thao tác (Đổi tên/Xoá) ngay khi Agent hoàn thành công việc của nó.
  - Khi một Agent ngầm hoàn thành nhiệm vụ, hệ thống sẽ phát một âm thanh chime thông báo dễ chịu để bạn biết kết quả đã sẵn sàng mà không cần canh giữ màn hình.
- **Hộp thoại Cấp quyền HITL cục bộ**: Các yêu cầu xác nhận chạy lệnh terminal (HITL) được lọc chính xác theo `conversationId`, đảm bảo hộp thoại phê duyệt chỉ hiển thị ở đúng cuộc trò chuyện tương ứng chứ không bị lẫn sang các phiên chat khác.
- **Nút Dừng độc lập (Stop Agent)**: Bạn có thể nhấn dừng hoạt động của AI Agent ở phiên chat hiện tại bất kì lúc nào, hệ thống sẽ chỉ huỷ luồng xử lý (`AbortController`) của đúng phiên chat đó và giữ nguyên các phiên chat đang chạy ngầm khác.

### 2. Trình Duyệt Thư Mục & Tạo File/Folder Theo Phong Cách VS Code 📁
- **Mở Thư Mục Bằng File Explorer Hệ Điều Hành**: Khắc phục triệt để lỗi không mở được hộp thoại chọn thư mục. Trên Windows, lệnh PowerShell hiện được khởi chạy ở chế độ **STA (Single-Threaded Apartment)** để đảm bảo mở thành công hộp thoại Folder Selection (`FolderBrowserDialog`) gốc của OS và trả về đường dẫn tuyệt đối cho backend.
- **Tạo File/Folder Inline (VS Code Style)**: Loại bỏ hoàn toàn các hộp thoại popup trình duyệt phiền phức. 
  - Khi hover qua thư mục, hệ thống sẽ hiện hai biểu tượng **New File** và **New Folder**.
  - Khi click, một ô nhập liệu inline sẽ hiển thị trực tiếp và tự động thụt lề thụt dòng (indentation) đồng bộ với mức độ sâu của thư mục hiện tại.
  - Khi ô nhập liệu bị bỏ trống hoặc người dùng nhấn Escape, hành động tạo sẽ tự động bị hủy.
  - Khi click chuột ra ngoài (blur), nếu có nội dung nhập liệu thì hệ thống sẽ tự động commit tạo file.
- **Ràng Buộc Đuôi File (Extension Validation)**: Khi thêm file, hệ thống sẽ kiểm tra và bắt buộc người dùng nhập phần mở rộng hợp lệ (ví dụ: `.txt`, `.md`, `.json`, `.py`, `.html`, `.css`,...). Nếu không nhập đuôi file, hệ thống sẽ cảnh báo bằng thông báo rõ ràng và giữ lại ô nhập liệu để người dùng sửa đổi.
- **Hiển thị thanh công cụ khi thư mục trống**: Khắc phục lỗi ẩn thanh công cụ khi workspace chưa có tệp tin. Giờ đây, thanh công cụ tạo file/folder sẽ luôn được ghim ở đầu để người dùng dễ dàng tạo tệp tin đầu tiên kiểu inline.

### 3. Thiết Lập Model LLM Thủ Công Cho Dynamic Providers (OpenRouter, 9Router, Custom) ⚙️
- **Không tự động tạo model mặc định "custom-model"**: Tránh việc tự động gán tên model giả lập gây lỗi khi gọi API.
- **Bắt buộc nhập Model ID cụ thể**: Đối với các nhà cung cấp động có quy mô lớn (hơn 10 LLMs), hệ thống sẽ để trống danh sách model ban đầu. Trong màn hình cấu hình ban đầu (`SetupModal`), sau khi người dùng điền API Key hoặc Base URL, hệ thống sẽ chuyển hướng sang một bước thứ hai yêu cầu người dùng nhập cụ thể ID model mong muốn (ví dụ: `google/gemini-2.5-flash` cho OpenRouter). Nút hoàn thành chỉ khả dụng khi người dùng đã nhập và lưu ít nhất một model hợp lệ.
- **Duy Trì Trạng Thái Ứng Dụng (Configuration Persistence)**:
  - Cải tiến hàm kiểm tra cấu hình `isConfigured()` để chấp nhận các kết nối 9Router hoặc Custom Endpoint không có API key (chỉ cần trạng thái kết nối `connected: true`), giúp tránh việc SetupModal liên tục hiện lại khi tải lại trang.
  - Toàn bộ lựa chọn model, provider đang hoạt động, và thư mục làm việc gần nhất (workspace path) được lưu trữ hoàn toàn qua `localStorage` và tự động khôi phục chính xác khi khởi động lại ứng dụng.

### 4. Cải tiến giao diện & Trải nghiệm người dùng (UX) 🌟
- **Thay đổi Layout chuẩn IDE**: Đã chuyển vị trí **File Explorer sang bên trái** và **Lịch sử chat (Sidebar) sang bên phải**. Thiết kế lại các thanh resize-handle và đảo ngược chiều kéo giãn để phù hợp hoàn hảo với thói quen sử dụng các IDE chuyên nghiệp như VS Code, Cursor.
- **Biểu tượng nhà cung cấp có màu sắc**: Thay thế toàn bộ logo provider bằng phiên bản có màu sắc chính xác từ CDN Lobe Icons (Gemini, OpenAI, Claude, OpenRouter, Ollama, LM Studio).
- **Logo 9Router & Ẩn logo Custom Endpoint**: Tích hợp logo 9Router gốc từ tệp cục bộ `/nine-router.png`. Đồng thời, ẩn biểu tượng cho Custom Endpoint như yêu cầu.
- **Tối ưu hóa tab Giới thiệu & Cài đặt**:
  - Khắc phục lỗi tràn văn bản ở mục "Providers" trong tab giới thiệu bằng cách cho phép tự động xuống hàng thông qua CSS Flexbox.
  - Định dạng lại nút "Thêm Server" trong cấu hình máy chủ MCP thành nút lớn, cân đối, đầy đủ padding.
  - Loại bỏ trường nhập tên "Name custom endpoint" không cần thiết dành riêng cho 9Router.
- **Avatar & Icon Provider khi Chat**:
  - Thêm badge icon của nhà cung cấp LLM tương ứng vào góc dưới của Avatar AI Agent (⚡) khi trả lời tin nhắn.
  - Hiển thị icon nhà cung cấp kế bên dòng chữ "Zero Coding Agent is thinking..." khi đang chờ phản hồi từ API.
- **Logo Tab Trình duyệt (Favicon)**: Thiết kế lại tệp `favicon.svg` thành một biểu tượng tia sét (⚡) phát sáng với dải màu chuyển sắc gradient từ tím sang xanh dương tương đồng với bộ nhận diện thương hiệu.
- **Auto Reload khi kết nối**: Tự động reload lại trang sau 500ms khi người dùng nhấn "Connect" ở Custom Endpoint hoặc 9Router để đồng bộ hóa trạng thái ứng dụng.
- **Ngôn ngữ mặc định**: Đặt Tiếng Anh (English) làm ngôn ngữ khởi chạy mặc định của toàn bộ ứng dụng. Giao diện chỉ chuyển sang Tiếng Việt nếu người dùng tự thay đổi thủ công trong Settings.
- **Đổi tên thư mục toàn cục**: Đổi tên thư mục chứa mã nguồn web từ `antigravity-web` thành `Agent Coding` đồng bộ trong toàn bộ các tệp tin cấu hình và kịch bản khởi chạy.

### 5. Hệ thống Xác thực API & Tự động Nhận diện 🔑
- **Khắc phục lỗi API Key**: 
  - Thêm cơ chế tự động đồng bộ hóa cấu hình `syncWithBackend` khi ứng dụng khởi chạy để lấy thông tin API Key đã lưu trong file `.env` ở backend, tránh hiển thị bảng thông báo cài đặt lại API Key không cần thiết khi người dùng tải lại trang.
  - Cải tiến backend (`llmRouter.js`) để tự động nhận dạng và bỏ qua các API Key đã bị mã hóa (chứa kí tự `*` gửi từ frontend) nhằm khôi phục và sử dụng chính xác API Key gốc được lưu trong `process.env`.
- **Nhận diện Model Miễn phí thông minh**: Bộ lọc Model Free (`isModelFree`) giờ đây tự động quét từ khóa "free" (không phân biệt hoa thường) trong ID hoặc Tên đầy đủ của model để tự động phân loại, hỗ trợ tốt các model mới được thêm động từ OpenRouter hoặc các nhà cung cấp khác.
- **Đổi tên App trên OpenRouter**: Cấu hình chính xác tiêu đề hiển thị trong log của OpenRouter thành `Zero Coding Agent` thay vì đường dẫn URL cục bộ `http://localhost:5743`.

### 6. Model Context Protocol (MCP) - Day 2 & 4
- **MCP Client Manager** ([mcpManager.js](file:///c:/Users/nguye/OneDrive/Documents/Projects/AI%20Agent%20%28Google%29/Agent%20Coding/backend/src/services/mcpManager.js)): Tự động kết nối tới các MCP server cục bộ bằng stdio và JSON-RPC 2.0. Thực hiện thành công bắt tay `initialize`, khám phá các tool của server (`tools/list`), và gọi tool (`tools/call`).
- **UI Settings Panel** ([SettingsModal.jsx](file:///c:/Users/nguye/OneDrive/Documents/Projects/AI%20Agent%20%28Google%29/Agent%20Coding/frontend/src/components/Settings/SettingsModal.jsx)): Thêm tab cấu hình MCP cho phép xem trạng thái các server, danh sách tool chi tiết của từng server, và form đăng ký nhanh.
- **LLM Integration**: Các MCP tools được tự động load và cung cấp động vào system prompt của AI Agent.

### 7. Agent-to-Agent (A2A) Collaboration - Day 2 & 4
- **Agent Card**: Cung cấp tệp metadata tiêu chuẩn tại route `/.well-known/agent-card.json` mô tả kỹ năng của agent.
- **Cổng giao dịch JSON-RPC 2.0**: Route [a2a.js](file:///c:/Users/nguye/OneDrive/Documents/Projects/AI%20Agent%20%28Google%29/Agent%20Coding/backend/src/routes/a2a.js) cho phép các AI Agent bên ngoài tạo tác vụ (`task.create`), theo dõi tiến độ (`task.status`), và hủy tác vụ (`task.cancel`).
- **Tool ủy thác**: Cung cấp tool `delegate_to_agent(agentUrl, prompt)` cho AI để có thể chuyển giao tác vụ lâu dài cho agent chuyên môn khác.

### 8. Agent Skills & Progressive Disclosure - Day 3
- **Skills Directory** ([skills/](file:///c:/Users/nguye/OneDrive/Documents/Projects/AI%20Agent%20%28Google%29/skills/)): Chứa các kỹ năng thủ tục viết bằng tệp Markdown và YAML frontmatter:
  - [file-operations/SKILL.md](file:///c:/Users/nguye/OneDrive/Documents/Projects/AI%20Agent%20%28Google%29/skills/file-operations/SKILL.md)
  - [code-review/SKILL.md](file:///c:/Users/nguye/OneDrive/Documents/Projects/AI%20Agent%20%28Google%29/skills/code-review/SKILL.md)
- **Progressive Disclosure** ([skillsManager.js](file:///c:/Users/nguye/OneDrive/Documents/Projects/AI%20Agent%20%28Google%29/Agent%20Coding/backend/src/services/skillsManager.js)): Tự động đối sánh từ khóa trong prompt của user với mô tả của skill để chỉ nạp những skill cần thiết vào prompt hệ thống, tiết kiệm token và tránh nhiễu ngữ cảnh (Context Rot).

### 9. Spec-Driven Development - Day 5
- **Behavior Specs** ([docs/spec/](file:///c:/Users/nguye/OneDrive/Documents/Projects/AI%20Agent%20%28Google%29/docs/spec/)): Tài liệu hóa các đặc tả hành vi của agent dưới dạng Gherkin (.feature):
  - [file_ops.feature](file:///c:/Users/nguye/OneDrive/Documents/Projects/AI%20Agent%20%28Google%29/docs/spec/file_ops.feature)
  - [mcp.feature](file:///c:/Users/nguye/OneDrive/Documents/Projects/AI%20Agent%20%28Google%29/docs/spec/mcp.feature)

---

## Hướng dẫn Khởi chạy và Xác thực

### Bước 1: Chạy Server Backend & Frontend
Cả 2 server hiện tại đang được khởi chạy ngầm tự động trong môi trường làm việc của bạn:
- **Backend:** `http://localhost:3747`
- **Frontend:** `http://localhost:5743`

Bạn có thể chạy tệp tin `start.cmd` trong thư mục project để khởi chạy thủ công (chạy ngầm trên Windows và macOS/Linux):
```cmd
start.cmd
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

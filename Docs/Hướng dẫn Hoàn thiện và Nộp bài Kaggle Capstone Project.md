**Tiêu chí đánh giá Capstone Project:**

Đại diện từ đội ngũ Kaggle nhấn mạnh rằng mục tiêu cốt lõi của họ là xem xét cách bạn **áp dụng và tích hợp các ý tưởng, khái niệm và công nghệ** đã được học trong suốt 5 ngày (thông qua whitepapers và codelabs) vào dự án thực tế của mình.

Bên cạnh đó, dựa trên tài liệu hướng dẫn lên ý tưởng của khóa học, bạn có thể tham khảo thang điểm tự đánh giá (Selection Criteria) sau để tối ưu hóa dự án:

- **Giá trị học tập (Learning Value):** Mức độ bao quát kiến thức từ cả 5 ngày học (30%).
- **Tính khả thi kỹ thuật (Technical Feasibility):** Khả năng có thể xây dựng và hoàn thiện dự án nhanh chóng (25%).
- **Tác động tới Portfolio (Portfolio Impact):** 20%.
- **Sự hào hứng cá nhân (Personal Excitement):** 15%.
- **Tính độc đáo (Uniqueness):** 10%.

**Cách nộp bài Capstone Project trên Kaggle:**

- **Đường link nộp bài:** Link nộp bài chính thức sẽ được gửi trực tiếp qua **email** mà bạn dùng để đăng ký khóa học, đồng thời cũng sẽ được chia sẻ trên máy chủ **Discord** của Kaggle.
- **Quy định nộp:** Bạn có thể làm việc cá nhân hoặc theo nhóm tối đa 4 người. Mỗi cá nhân hoặc nhóm chỉ được chọn nộp bài cho **một hạng mục duy nhất** trong 4 danh mục (Agents for good, Agents for business, Concierge agent, hoặc Open-ended).
- **Hạn chót:** Deadline nộp bài là trước nửa đêm ngày 6 tháng 7 (Giờ Thái Bình Dương - PT). Bạn nên nộp sớm đề phòng sự cố kỹ thuật, vì khi cổng nộp bài đóng lại, bạn sẽ không còn cơ hội nhận chứng chỉ và huy hiệu.

**Cách tích hợp MCP và A2A vào dự án:**

Trong thiết kế hệ thống agentic, MCP đóng vai trò kết nối với công cụ, còn A2A đóng vai trò kết nối với các agent khác. Dưới đây là cách bạn triển khai chúng:

**1. Tích hợp MCP (Model Context Protocol):** MCP đóng vai trò là "đôi tay" của agent, giúp cung cấp kết nối và quyền truy cập vào các hệ thống bên ngoài (như GitHub, PostgreSQL, hoặc API của bạn) thay vì để agent tự đoán cách thao tác.

- **Cấu hình cục bộ / từ xa:** Để tích hợp, bạn khai báo các server MCP vào file cấu hình tại `~/.gemini/config/mcp_config.json`. Nếu bạn dùng Antigravity IDE, bạn cũng có thể cài đặt thông qua giao diện bằng cách vào **Settings -&gt; Customizations -&gt; Add MCP+**.
- **Giao thức truyền tải (Transport):** Bạn nên sử dụng `stdio` cho các công cụ backend chạy trên máy cục bộ (local) của bạn và sử dụng `SSE` (Server-Sent Events) cho các dịch vụ kết nối từ xa (remote).

**2. Tích hợp A2A (Agent-to-Agent):** A2A là giao thức giúp các agent giao tiếp, thương lượng và ủy thác công việc cho nhau. Nó cực kỳ hữu ích khi bạn phân chia dự án thành nhiều agent chuyên nghiệp làm việc cùng nhau, ví dụ: một agent đánh giá Code PR (Pull Request) ủy thác cho một agent khác kiểm tra tính tuân thủ (Compliance).

- **Khai báo danh tính (Agent Card):** Bạn cần tạo một file JSON gọi là Agent Card chứa metadata khai báo các kỹ năng (skills), quyền xác thực (auth) và điểm kết nối (endpoints) của agent. File này thường được host tại endpoint `/.well-known/agent-card.json`.
- **Cơ chế giao tiếp:** Các agent sẽ sử dụng chuẩn JSON-RPC 2.0 qua HTTP để khám phá lẫn nhau thông qua các danh bạ agent (registries) và thực hiện ủy thác công việc (Tasks).
- **Xử lý bất đồng bộ:** Đối với các tác vụ yêu cầu chạy trong thời gian dài, hãy thiết lập Webhook (Push Notifications) để agent gửi/nhận cập nhật trạng thái (pending/running/completed) mà không cần chờ phản hồi liên tục gây nghẽn hệ thống.

**Lưu ý thiết kế:** Để thiết lập ranh giới rõ ràng, nếu bạn chỉ cần gọi một hành động đơn lẻ để nhận dữ liệu (như đọc một dòng trong DB, gọi API), hãy dùng **MCP**. Nhưng nếu bạn cần giao trách nhiệm giải quyết một vấn đề phức tạp cho một AI chuyên gia khác và đợi kết quả cộng tác, hãy dùng **A2A**.
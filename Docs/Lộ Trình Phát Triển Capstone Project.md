Để xây dựng một Capstone Project cá nhân hoàn chỉnh cho khóa học AI Agent của Google x Kaggle, bạn cần chọn một chủ đề và thực hiện theo lộ trình kết hợp các kiến thức từ Ngày 1 đến Ngày 5.

Dưới đây là lộ trình và to-do-list chi tiết dựa trên tài liệu khóa học:

**1. Chọn chủ đề dự án (Định hướng mục tiêu)** Bạn có thể làm việc cá nhân (hoặc nhóm tối đa 4 người) và cần chọn **một trong bốn danh mục** sau đây để phát triển:

- **Agents for good:** Giải quyết các vấn đề vì nhân loại như tối ưu hóa nông nghiệp, y tế công cộng, giáo dục, hoặc hỗ trợ nghệ thuật.
- **Agents for business:** Giải quyết các vấn đề của doanh nghiệp như tự động hóa quy trình, quản lý chi tiêu hoặc tạo sản phẩm mới có ảnh hưởng tới chi phí/doanh thu.
- **Concierge agent:** Trợ lý AI cá nhân giúp đơn giản hóa cuộc sống (quản lý lời mời, lịch trình, y tế) với yêu cầu bảo mật thông tin cá nhân cao.
- **Open-ended (Tự do):** Thể hiện sự sáng tạo không giới hạn với bất kỳ vấn đề nào bạn quan tâm.

**2. Lộ trình và To-do-list chi tiết (Tích hợp 5 Ngày học)**

**Giai đoạn 1: Khởi tạo và thiết kế (Dựa trên Day 1)**

- **Định nghĩa mục tiêu:** Xác định rõ mục tiêu của agent và các ranh giới của khung làm việc (harness boundaries).
- **Lựa chọn mô hình:** Quyết định xem dự án sẽ là một nguyên mẫu đơn giản (vibe-style prototype) hay một sản phẩm hoàn chỉnh có tính kỷ luật (agentic production artifact).
- **Xác định bộ công cụ tối thiểu:** Lên danh sách các công cụ (tool set) tối thiểu cần thiết và các tiêu chí để đánh giá độ thành công của agent.
- **Brainstorm ý tưởng:** Đề xuất 3 ý tưởng và chọn ra ý tưởng khả thi nhất.

**Giai đoạn 2: Kết nối công cụ và Giao thức (Dựa trên Day 2)**

- **Ánh xạ công cụ:** Chuyển đổi các hành động (ví dụ: hành động trên trình duyệt) thành các công cụ định dạng theo chuẩn Model Context Protocol (MCP).
- **Thiết kế Schema:** Thiết kế input và output của các công cụ dưới dạng JSON schemas.
- **Thiết lập kết nối:** Bắt đầu với giao thức truyền tải `stdio` cho việc thực thi công cụ ở backend cục bộ (local).

**Giai đoạn 3: Tích hợp Kỹ năng - Agent Skills (Dựa trên Day 3)**

- **Xây dựng kỹ năng:** Viết các `SKILL.md` (metadata và hướng dẫn) để agent có bộ nhớ thủ tục (procedural memory). Đặc biệt cần thêm skill cho việc lập kế hoạch tác vụ (task planning) và chuyển giao cho con người (human handoff/resume).
- **Áp dụng Progressive Disclosure:** Thiết lập để mô hình chỉ tải các bước liên quan khi cần thiết, giúp tiết kiệm token và tránh nhiễu ngữ cảnh.
- **Tách biệt logic:** Đảm bảo giữ các logic thủ tục mang tính chất xác định (deterministic execution) trong thư mục `scripts/` thay vì để LLM tự đoán trong text prompt.

**Giai đoạn 4: Bảo mật và Đánh giá (Dựa trên Day 4)**

- **Bảo vệ hệ thống:** Thêm các middleware bảo mật để bảo vệ API-key và thiết lập danh sách tên miền được phép truy cập (domain allowlists).
- **Thiết lập theo dõi (Observability):** Ghi log mọi lệnh gọi công cụ (tool call), lỗi, và sự can thiệp của người dùng để phục vụ cho việc đánh giá.
- **Tích hợp Human-in-the-Loop (HITL):** Thiết kế các điểm kiểm tra (checkpoints) bảo mật bắt buộc sự phê duyệt của con người trước khi thực hiện các hành động rủi ro cao hoặc phá hủy (destructive actions).

**Giai đoạn 5: Hoàn thiện chuẩn Production theo Spec-Driven (Dựa trên Day 5)**

- **Viết Spec:** Sử dụng cú pháp Gherkin (Given-When-Then) để viết các hành vi đặc tả (behavior specs) cho các hành động của agent.
- **Quản lý phiên bản:** Đặt các file spec vào thư mục `docs/spec/` và coi spec là tài sản chính. Code phải có khả năng tái tạo (regenerable) từ các spec này.
- **Kiến trúc Zero-trust:** Củng cố agent bằng cách áp dụng sandbox, server chính sách (policy server) và gỡ lỗi dựa trên bằng chứng (forensic debugging).
- **Đóng gói triển khai:** Sử dụng Docker kết hợp với health checks để đảm bảo dự án có thể được deploy lặp lại một cách ổn định.

**3. Lưu ý khi nộp bài**

- **Hạn chót:** Đảm bảo hoàn thành và nộp dự án trước nửa đêm ngày 6 tháng 7 (Giờ Thái Bình Dương - PT).
- Bạn nên nộp bài sớm để phòng ngừa các sự cố kỹ thuật có thể phát sinh, vì khi cổng nộp bài đóng lại, cơ hội nhận chứng chỉ và huy hiệu Kaggle sẽ kết thúc.
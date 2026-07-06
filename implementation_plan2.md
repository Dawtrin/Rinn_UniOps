# Club Management System — Kế hoạch Triển khai Business Logic

Chúng ta đã hoàn thiện phần **Khung sườn kiến trúc (Architecture Foundation)**. Bước tiếp theo là "đắp thịt" — tức là viết code chi tiết xử lý nghiệp vụ (Business Logic) cho từng chức năng.

Dưới đây là lộ trình triển khai chi tiết cho phần cốt lõi của dự án:

## 1. Event & Session Management (Quản lý Sự kiện & Buổi tập)
- **Tính năng:** Trưởng ban (Manager) tạo sự kiện, lên lịch các buổi tập (Sessions).
- **Business Logic:** 
  - Quy tắc chuyển trạng thái Event: `DRAFT` → `PLANNING` → `APPROVED` (chỉ Admin) → `ONGOING` → `COMPLETED`.
  - Không cho phép lùi trạng thái.
  - Tự động sinh `Notification` cho các thành viên trong ban khi có sự kiện mới.

## 2. Task Management (Quản lý Công việc)
- **Tính năng:** Manager giao việc cho Member (có deadline, priority).
- **Business Logic:**
  - Quy tắc trạng thái Task: `TODO` → `IN_PROGRESS` → `REVIEW` → `DONE`.
  - Manager có quyền duyệt (`DONE`) hoặc từ chối (`REJECTED` kèm lý do).
  - Tự động sinh `Notification` gửi cho Member khi được giao Task hoặc Task bị từ chối.

## 3. Attendance System (Hệ thống Điểm danh)
- **Tính năng:** Member điểm danh (Check-in / Check-out) tại các buổi tập.
- **Business Logic:**
  - Chỉ cho phép điểm danh vào đúng ngày diễn ra session.
  - Manager/Admin có quyền sửa điểm danh thủ công (ví dụ: đổi từ Vắng mặt sang Có phép).
  - API thống kê tỷ lệ chuyên cần của từng Member.

## 4. Evaluation System (Đánh giá hiệu suất)
- **Tính năng:** Đánh giá KPI hàng tháng của thành viên.
- **Business Logic:**
  - Member nộp Tự đánh giá (`SelfEvaluation`) tối đa 1 bản/tháng.
  - Manager chấm điểm (`ManagerEvaluation`) từ 0-100 và tự động xếp loại (EXCELLENT, GOOD, PASS, FAIL).
  - Tự động sinh `Notification` báo cho Member khi đã có kết quả chấm điểm.

## 5. Dashboard & Reports (Báo cáo & Thống kê)
- **Tính năng:** Màn hình tổng quan cho Admin và Manager.
- **Business Logic:**
  - Đếm tổng số lượng (Events, Tasks, Members).
  - Biểu đồ hiệu suất theo Ban.

---

## User Review Required

> [!IMPORTANT]
> Đây là các chức năng rất nhiều logic phức tạp. Bạn muốn triển khai chức năng nào trước? 
> 
> Lời khuyên của tôi: Hãy ưu tiên làm **Quản lý Sự kiện (Event)** và **Công việc (Task)** trước vì đây là xương sống của hệ thống Câu lạc bộ. Bạn có đồng ý bắt đầu với **Event & Task** không?

# Hướng dẫn Chạy dự án Club Management (UniOps)

Tài liệu này hướng dẫn chi tiết cách thiết lập và khởi chạy dự án Club Management trên môi trường máy tính cục bộ (Local). Dự án bao gồm 3 thành phần chính: Cơ sở dữ liệu (MySQL), Backend (Spring Boot) và Frontend (ReactJS/Vite).

## 1. Yêu cầu Hệ thống (Prerequisites)
Để chạy được toàn bộ dự án, máy tính của bạn cần cài đặt sẵn:
- **Java 17+**: Dành cho Backend Spring Boot.
- **Node.js (phiên bản 18+)**: Dành cho Frontend React/Vite.
- **MySQL (XAMPP / WAMP / MySQL Workbench)**: Quản trị cơ sở dữ liệu.

---

## 2. Thiết lập Cơ sở dữ liệu (MySQL)
1. Mở XAMPP hoặc công cụ MySQL tương tự và bật dịch vụ **MySQL**.
2. Truy cập vào MySQL (ví dụ qua http://localhost/phpmyadmin hoặc chạy lệnh mysql) và tạo một database mới, trống hoàn toàn với tên:
   ```sql
   CREATE DATABASE club_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Nạp dữ liệu mẫu bằng cách chạy lệnh sau trong Terminal (CMD/PowerShell) trên Windows:
   ```bash
   C:\xampp\mysql\bin\mysql.exe -u root --default-character-set=utf8mb4 club_management < f:\Rin_UniOps\club-management\club-management\src\main\resources\data.sql
   ```
   *Lưu ý: Bắt buộc sử dụng tùy chọn `--default-character-set=utf8mb4` khi nạp SQL để hiển thị đúng toàn bộ ký tự Tiếng Việt trên giao diện.*

---

## 3. Khởi chạy Backend (Spring Boot)
1. Mở Terminal (Command Prompt hoặc PowerShell).
2. Di chuyển vào thư mục của Backend:
   ```bash
   cd f:\Rin_UniOps\club-management\club-management
   ```
3. Chạy lệnh khởi động Spring Boot:
   ```bash
   # Nếu dùng CMD / PowerShell trên Windows:
   .\mvnw spring-boot:run
   ```
4. Đợi một chút để Maven tải thư viện. Nếu thấy dòng `Started ClubManagementApplication in ... seconds` tức là Backend đã chạy thành công ở địa chỉ: **http://localhost:8080**.

---

## 4. Khởi chạy Frontend (React / Vite)
1. Mở thêm một Terminal thứ hai.
2. Di chuyển vào thư mục Frontend:
   ```bash
   cd f:\Rin_UniOps\club-management-fe
   ```
3. Cài đặt các thư viện Node.js (chỉ cần chạy lần đầu tiên):
   ```bash
   npm install
   # Hoặc nếu PowerShell chặn script, dùng: npm.cmd install
   ```
4. Khởi động Frontend Server:
   ```bash
   npm run dev
   # Hoặc: npm.cmd run dev
   ```
5. Frontend sẽ khởi chạy, thường ở địa chỉ: **http://localhost:5173**. Hãy mở link này trên trình duyệt để sử dụng ứng dụng.

---

## 5. Tài khoản Đăng nhập (Mẫu)
Trong dự án đã cấu hình sẵn 3 phân quyền. Bạn có thể dùng các tài khoản dưới đây để test toàn bộ tính năng:

| Vai trò       | Email đăng nhập       | Mật khẩu   |
|---------------|-----------------------|------------|
| **Chủ nhiệm (Admin)**| `admin@club.com`    | `password123` |
| **Trưởng ban (Manager)**| `son.tran@club.com` | `password123` |
| **Thành viên (Member)** | `anh.pham@club.com`   | `password123` |

---

## 6. Các tính năng mở rộng (API Keys)
Dự án đã được tích hợp một số API của bên thứ ba, bạn có thể thay đổi cấu hình tại file `application.properties` của Backend nếu cần:
- **Tích hợp Google Gemini AI**: (Gợi ý phân công task, tóm tắt cuộc họp). API Key được lưu ở biến `ai.api.key`.
- **Thanh toán VNPay Sandbox**: Hỗ trợ test thanh toán quỹ, hội phí. Tham số Merchant được lưu ở biến `vnpay.tmn-code` và `vnpay.hash-secret`. Đã cấu hình luồng Callback để hệ thống tự động cập nhật khi thanh toán thành công.

*Chúc bạn trải nghiệm và phát triển ứng dụng thật thành công!*

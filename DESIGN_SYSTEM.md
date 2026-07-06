# ĐẶC TẢ HỆ THỐNG THIẾT KẾ (DESIGN SYSTEM) & TRẢI NGHIỆM NGƯỜI DÙNG (UX)
## Dự án: Hệ thống Quản lý Câu lạc bộ nghệ thuật & Sự kiện (Rin_UniOps)

Tài liệu này định nghĩa chi tiết toàn bộ ngôn ngữ thiết kế **Bento Grid lai Neo-brutalism** trên nền **Dark Mode** nghệ thuật dành cho Frontend ứng dụng. Hướng thiết kế này nhằm mục đích mang lại cảm giác trẻ trung, đậm chất Gen Z, phù hợp với tính chất năng động của các câu lạc bộ nghệ thuật và sự kiện sinh viên.

---

## 1. TRIẾT LÝ THIẾT KẾ (DESIGN PHILOSOPHY)

Sự kết hợp giữa hai trường phái thiết kế hiện đại tạo nên bản sắc độc nhất:

* **Modern Bento Grid (Bố cục cấu trúc):** Lấy cảm hứng từ cách sắp đặt của Apple và các trang web công nghệ cao cấp. Giao diện được chia thành các ô hộp (bento) bo tròn có kích thước khác nhau. Mỗi ô là một chức năng/thông tin độc lập, giúp giao diện có tính mô-đun hóa cao, gọn gàng và dễ theo dõi chỉ bằng một ánh nhìn (At-a-glance).
* **Soft Neo-brutalism (Điểm nhấn cá tính):** Mang tinh thần nổi loạn của phong cách thiết kế thô mộc nhưng được làm mềm hóa (soft version). Thay vì các đổ bóng mờ ảo (soft blur shadows) truyền thống, phong cách này sử dụng **đường viền đen mỏng sắc nét** kết hợp **hiệu ứng đổ bóng phẳng, cứng (Flat/Hard Offset Shadows)** bằng các màu Neon rực rỡ để tạo chiều sâu thị giác mạnh mẽ.

---

## 2. BẢNG MÀU CHỦ ĐẠO (COLOR PALETTE)

Hệ màu được thiết kế tối ưu cho nền Dark Mode giúp các gam màu neon nổi bật mà không gây nhức mắt người dùng trong thời gian dài sử dụng.

| Tên màu | Mã HEX | Phân vùng áp dụng | Ý nghĩa thị giác |
| :--- | :--- | :--- | :--- |
| **Main Background** | `#121214` | Nền chính của toàn trang web | Đen xám sâu, giảm mỏi mắt |
| **Bento Surface** | `#1a1a1e` | Nền của các ô Bento, Card, Form | Xám đậm tinh tế, tạo chiều sâu |
| **Border Color** | `#2d2d34` | Đường viền của các ô Bento, nút bấm | Viền mỏng phân chia cấu trúc rõ nét |
| **Text Primary** | `#f3f4f6` | Tiêu đề, văn bản chính | Trắng ấm, độ tương phản cao |
| **Text Secondary** | `#9ca3af` | Nhãn, chú thích, thông tin phụ | Xám nhẹ |
| **Neon Blue** | `#00f0ff` | Trạng thái `TODO`, điểm danh, link | Công nghệ, hiện đại, tươi trẻ |
| **Neon Purple** | `#bd00ff` | Trạng thái `IN_PROGRESS`, nút nhấn chính | Nghệ thuật, sáng tạo, độc đáo |
| **Neon Emerald** | `#00ff66` | Trạng thái `DONE`/`APPROVED`, cộng XP | Thành công, chuyên cần, năng lượng |
| **Neon Orange** | `#ff5c00` | Trạng thái `REJECTED`, thông tin khẩn cấp | Sự kiện biểu diễn, chú ý |

---

## 3. TYPOGRAPHY (FONT CHỮ & CHỮ VIẾT)

* **Font chữ chủ đạo:** **Outfit** (Google Fonts) hoặc **Inter** làm font chữ phụ trợ.
* **Đặc điểm:** Font Outfit có các nét bo tròn hiện đại và khoảng giãn chữ tự nhiên tạo cảm giác công nghệ, cao cấp.
* **Cấu trúc cỡ chữ (Scale):**
  * `H1 (Page Title):` `32px` | Bold (`700`) | `letter-spacing: -0.02em`
  * `H2 (Bento Title):` `20px` | Semi-Bold (`600`)
  * `Body Text:` `14px` | Regular (`400`)
  * `Micro Text/Tags:` `12px` | Medium (`500`)

---

## 4. CHI TIẾT HIỆU ỨNG CSS & HOVER (EFFECTS)

### 4.1 Đổ bóng cứng Neo-brutalism (Hard Shadows)
Các ô bento, nút bấm và thẻ công việc sẽ không sử dụng hiệu ứng đổ bóng mờ ảo (`box-shadow: 0 4px 10px rgba(...)`). Thay vào đó là đổ bóng phẳng, cứng có màu sắc:
```css
/* Đổ bóng phẳng cho ô Bento bình thường */
.bento-card {
    border: 1px solid #2d2d34;
    box-shadow: 4px 4px 0px #2d2d34;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Hiệu ứng Hover: Nổi bật hẳn lên với đổ bóng màu Neon */
.bento-card:hover {
    transform: translate(-2px, -2px);
    box-shadow: 6px 6px 0px var(--accent-neon-color);
    border-color: var(--accent-neon-color);
}
```

### 4.2 Nút bấm (Buttons)
Các nút tương tác chính (Call to Action) sẽ áp dụng bóng màu **Neon Purple**:
```css
.btn-primary {
    background-color: #121214;
    color: #f3f4f6;
    border: 2px solid #bd00ff;
    box-shadow: 3px 3px 0px #bd00ff;
    font-weight: 600;
}
.btn-primary:hover {
    transform: translate(-1px, -1px);
    box-shadow: 5px 5px 0px #bd00ff;
}
.btn-primary:active {
    transform: translate(2px, 2px);
    box-shadow: 0px 0px 0px #bd00ff;
}
```

---

## 5. CHI TIẾT BỐ CỤC & UX CÁC TRANG CHÍNH (PAGE LAYOUT SPECIFICATIONS)

### 5.1 Trang Dashboard: Bố cục Bento Grid
Áp dụng lưới bất đối xứng (Grid Layout) để nhóm các khối thông tin quan trọng của một thành viên hoặc ban chủ nhiệm.

```
+-------------------------------------------------------+
|  [Khối 1: User Profile]     | [Khối 2: Lịch tập hôm nay] |
|  - Avatar, Cấp độ, XP bar   | - 18h30 - Tổng duyệt 1  |
|  - Thứ hạng hiện tại        | - Địa điểm: Hội trường   |
|                             | - Nút: [Check-in nhanh] |
+-----------------------------+-------------------------+
|  [Khối 3: Biểu đồ KPI]      | [Khối 4: Task chưa làm]  |
|  - Biểu đồ hình tròn        | - Số việc: 03 Tasks     |
|  - Tỷ lệ hoàn thành nhiệm vụ| - Deadline gần nhất: 1/6|
|  - Chart.js trực quan       | - Xem nhanh việc gấp    |
+-----------------------------+-------------------------+
|  [Khối 5: Vinh danh Top Performer]                     |
|  - Banner vinh danh Member xuất sắc nhất tháng         |
+-------------------------------------------------------+
```

### 5.2 Trang Lịch trình (Timeline View)
* **UX Flow:** Thay vì danh sách đơn điệu, lịch trình hiển thị dạng **Trục thời gian hàng tuần/hàng tháng (Timeline)**.
* **Nhãn danh mục trực quan:**
  * 🔵 Buổi tập luyện thông thường (`PRACTICE`): Viền xanh dương, bóng phẳng xanh dương.
  * 🟣 Buổi tổng duyệt chương trình (`REHEARSAL`): Viền tím, bóng phẳng tím.
  * 🟠 Đêm biểu diễn chính thức (`PERFORMANCE`): Viền cam, bóng phẳng cam phát sáng.
* **Tương tác:** Thành viên click vào một buổi trên Timeline sẽ hiển thị chi tiết (Địa điểm, Hạn check-in, Ghi chú ban nhạc) ở cửa sổ phụ trượt ra từ bên phải (Drawer Panel).

### 5.3 Trang Quản lý Công việc: Kéo thả Kanban Board
* **UX Flow:**
  * Chia thành 3 cột chính: **Cần làm (To Do)**, **Đang làm (In Progress)**, và **Đang duyệt (Review/Done)**.
  * Các thẻ công việc (Task Cards) có viền màu sắc tương ứng với mức độ ưu tiên (`HIGH` = Đỏ cam, `MEDIUM` = Tím, `LOW` = Xanh dương).
* **Kỹ thuật Kéo thả (HTML5 Drag & Drop):**
  * Người dùng giữ chuột kéo thẻ từ cột này sang cột khác.
  * Khi thả thẻ vào cột mới, hệ thống tự động đổi viền cột thành màu Neon và gửi API ngầm cập nhật trạng thái lên Server.
  * Khi thả thẻ vào cột **Done/Review**, thẻ sẽ hiện icon chờ duyệt từ Trưởng ban.

### 5.4 Trang Đánh giá Hiệu suất (Performance Review)
* **UX Flow:** Giao diện chia làm hai phần song song (2-Column Split View).
  * **Cột Trái (Dữ liệu thống kê tự động):** Hiển thị các Widget nhỏ dạng Bento thống kê trực tiếp kết quả làm việc của cá nhân đó trong tháng:
    * Chỉ số chuyên cần (`% Attendance`).
    * Tỷ lệ hoàn thành công việc (`% Tasks Completed`).
    * Số điểm XP tích lũy trong tháng.
  * **Cột Phải (Bản tự đánh giá & Nhận xét):**
    * Đối với **Member:** Form nhập văn bản tự sự (Thành tựu, Điểm cần sửa đổi) và nút nộp.
    * Đối với **Manager/Admin:** Màn hình chấm điểm (thanh trượt từ 0-100), hộp nhập nhận xét và hiển thị xếp loại KPI tương ứng tức thì dựa trên số điểm đã chọn.

### 5.5 Trang Bảng xếp hạng (Leaderboard)
* **UX Flow:** Danh sách Top 10 cá nhân có điểm XP cao nhất.
  * Top 1, 2, 3 được đặt riêng trong 3 khối Bento đặc biệt nổi bật ở đầu trang (Màu Vàng Gold, Bạc Silver, và Đồng Bronze).
  * Mỗi thành viên có một thanh đo XP (XP Progress Bar) có hiệu ứng chuyển động tăng dần từ trái sang phải khi tải trang.
  * Có biểu tượng huy hiệu (Level Badge) bên cạnh tên mỗi thành viên.

---

## 6. CSS VARIABLES CHEAT SHEET (`src/index.css`)

Để đảm bảo tính đồng bộ trên toàn dự án Frontend, tệp tin `src/index.css` sẽ được khai báo các biến CSS cơ bản như sau:

```css
:root {
  /* Fonts */
  --font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  /* Theme Backgrounds */
  --bg-main: #121214;
  --bg-surface: #1a1a1e;
  --border-color: #2d2d34;

  /* Text Colors */
  --text-primary: #f3f4f6;
  --text-secondary: #9ca3af;

  /* Neon Colors */
  --neon-blue: #00f0ff;
  --neon-purple: #bd00ff;
  --neon-green: #00ff66;
  --neon-orange: #ff5c00;
  --neon-red: #ff3e3e;

  /* Neo-brutalism Shadow Styles */
  --shadow-flat: 4px 4px 0px var(--border-color);
  --shadow-blue: 4px 4px 0px var(--neon-blue);
  --shadow-purple: 4px 4px 0px var(--neon-purple);
  --shadow-green: 4px 4px 0px var(--neon-green);
  --shadow-orange: 4px 4px 0px var(--neon-orange);

  /* Transitions */
  --transition-smooth: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

*Tài liệu này đóng vai trò là "Sách hướng dẫn Thiết kế" (Design Guidebook) đồng nhất cho mọi thành phần giao diện Frontend của hệ thống quản lý câu lạc bộ.*

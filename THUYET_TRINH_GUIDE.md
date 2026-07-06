# Kịch Bản Thuyết Trình & Hướng Dẫn Demo Dự Án: Rin_UniOps (Club OS V2)

Tài liệu này được biên soạn chi tiết giúp bạn thuyết trình, báo cáo và thực hiện demo dự án **Hệ thống Quản lý Câu lạc bộ nghệ thuật/sự kiện (Rin_UniOps / Club OS V2)** trước Hội đồng nghiệm thu.

---

## PHẦN 1: TỔNG QUAN DỰ ÁN (Mở đầu & Bối cảnh)
*(Thời gian dự kiến: 2 - 3 phút)*

### 1. Kịch bản nói (Speech Script)
> *"Kính thưa Hội đồng nghiệm thu và các bạn, việc quản lý các câu lạc bộ nghệ thuật, vũ đạo, hay sự kiện hiện nay gặp rất nhiều khó khăn do số lượng thành viên đông, phân chia nhiều ban ngành chuyên biệt (như truyền thông, hậu cần, chuyên môn). Các lịch tập, thời khóa biểu, tiến độ công việc và dòng tiền thu chi thường bị phân mảnh trên các ứng dụng như Zalo, Messenger, Excel... điều dẫn đến tình trạng trễ tiến độ, mất mát trang thiết bị và thiếu minh bạch về tài chính.
> 
> Chính vì lý do đó, chúng em đã phát triển dự án **Rin_UniOps (Club OS V2)** - một nền tảng quản lý câu lạc bộ toàn diện. Hệ thống không chỉ giải quyết các bài toán cơ bản như Quản lý lịch tập, Giao việc (Task), Điểm danh chuyên cần và Đánh giá KPI hàng tháng; mà còn mở rộng **6 phân hệ nâng cao** bao gồm: Tuyển dụng ứng viên mới, Quản lý kho mượn trả đạo cụ, Sổ quỹ tài chính & đóng hội phí online qua VNPay, Biểu quyết dân chủ, Thư viện tài nguyên chuyên môn, và Đăng ký vé QR code cho các sự kiện công chúng."*

### 2. Các điểm sáng công nghệ (Key Features & Tech Stack)
* **Backend:** Spring Boot 3.x, Spring Security (đăng nhập JWT, phân quyền bảo mật chặt chẽ), JPA Hibernate (truy vấn dữ liệu thông minh), H2 database (cho môi trường test) và MySQL (cho môi trường chạy thật).
* **Frontend:** ReactJS + Vite, Tailwind CSS kết hợp Custom Vanilla CSS, hệ thống icon chuyên nghiệp từ Lucide React.
* **Thời gian thực (Real-time):** Giao thức WebSocket (STOMP) phục vụ chat nhóm và thông báo tức thời.
* **Tích hợp bên thứ ba:**
  * **VNPay Sandbox:** Hỗ trợ cổng thanh toán hội phí online giả lập.
  * **Google Gemini AI:** Tích hợp trí tuệ nhân tạo hỗ trợ gợi ý phân công công việc, tóm tắt nội dung họp.
  * **Hệ thống Vé QR Code:** Tự động sinh mã vạch QR dạng hình ảnh cho khách tham dự sự kiện và tích hợp camera soát vé tại cửa.

---

## PHẦN 2: CHI TIẾT 6 KỊCH BẢN DEMO TÍNH NĂNG NÂNG CAO
*(Thời gian dự kiến: 7 - 10 phút)*

Để demo mượt mà nhất, hãy chuẩn bị sẵn 2 trình duyệt:
* **Trình duyệt 1 (Chính):** Đã đăng nhập tài khoản Admin (`admin@club.com` / `password123`).
* **Trình duyệt 2 (Ẩn danh):** Dùng để truy cập các đường dẫn công khai (không cần đăng nhập).

---

### KỊCH BẢN 1: TUYỂN DỤNG THÀNH VIÊN MỚI (Recruitment)
* **Ý nghĩa:** Số hóa luồng thu nhận nhân sự mới thay vì dùng Google Form thủ công.

| Bước | Người thực hiện (Role) | Hành động trên màn hình (Click & Type) | Lời thoại thuyết trình |
| :--- | :--- | :--- | :--- |
| **Bước 1.1** | Ứng viên (Khách ngoài) | 1. Mở tab ẩn danh, truy cập `http://localhost:5173/apply`. <br>2. Xem danh sách giới thiệu các ban.<br>3. Điền Form đăng ký: Họ tên, Email (ví dụ: `nguyenvana@gmail.com`), Ban ứng tuyển, Link CV, Giới thiệu.<br>4. Click **Nộp Đơn**. | *"Đầu tiên, đây là trang tuyển dụng công khai của CLB. Ứng viên có thể đọc mô tả công việc của từng ban chuyên môn và trực tiếp nộp hồ sơ cùng link CV cá nhân."* |
| **Bước 1.2** | Trưởng ban / Admin | 1. Quay lại trình duyệt chính (tài khoản Admin).<br>2. Vào menu **Quản lý tuyển dụng** (`/recruitment`).<br>3. Tìm ứng viên Nguyễn Văn A vừa nộp đơn.<br>4. Nhập điểm phỏng vấn (ví dụ: `85`), nhập nhận xét.<br>5. Bấm **Phê duyệt ứng viên**. | *"Khi ứng viên nộp đơn, hệ thống sẽ lưu thông tin. Ban chủ nhiệm sẽ tiến hành phỏng vấn, nhập điểm đánh giá và đưa ra quyết định phê duyệt."* |
| **Bước 1.3** | Hệ thống | 1. Hiển thị thông báo thành công.<br>2. Tạo mới một tài khoản User loại `MEMBER` trong database với email của ứng viên.<br>3. Gửi/Hiển thị mật khẩu mặc định của tài khoản mới. | *"Điểm đặc biệt ở đây là ngay khi bấm Phê duyệt, hệ thống sẽ tự động khởi tạo tài khoản Member mới cho ứng viên, đồng thời cấp mật khẩu tạm để họ đăng nhập ngay lập tức."* |

---

### KỊCH BẢN 2: THỜI KHÓA BIỂU & ĐIỂM DANH (Schedule & Attendance)
* **Ý nghĩa:** Quản lý lịch tập luyện của từng ban/đội và tự động hóa điểm danh chuyên cần bằng QR code hoặc check-in một chạm.

| Bước | Người thực hiện (Role) | Hành động trên màn hình (Click & Type) | Lời thoại thuyết trình |
| :--- | :--- | :--- | :--- |
| **Bước 2.1** | Trưởng ban / Admin | 1. Vào menu **Thời khóa biểu** (`/schedule`).<br>2. Xem lịch tuần hiện tại dạng Grid trực quan.<br>3. Bấm **Thêm Lịch** $\rightarrow$ chọn Loại (Tập luyện/Họp/Biểu diễn), chọn đối tượng áp dụng (Đội A/Ban Chuyên môn/Toàn CLB), chọn giờ $\rightarrow$ Bấm **Tạo**. | *"Phân hệ Thời khóa biểu cho phép Trưởng ban thiết lập lịch sinh hoạt tuần cho toàn CLB hoặc cho từng đội con. Lịch được mã hóa màu sắc để các thành viên dễ dàng theo dõi tránh bị trùng lịch học."* |
| **Bước 2.2** | Thành viên (Member) | 1. Đăng nhập tài khoản Member (`anh.pham@club.com` / `password123`).<br>2. Xem giao diện thời khóa biểu của đội mình (ví dụ: Đội Popping A).<br>3. Click **Check-in** trên slot buổi tập đang diễn ra. | *"Về phía thành viên, họ chỉ nhìn thấy lịch tập thuộc đội của mình để tránh nhiễu thông tin. Thành viên có thể thực hiện check-in trực tuyến ngay trên giao diện khi đến buổi tập."* |
| **Bước 2.3** | Trưởng ban / Admin | 1. Trở lại tài khoản Admin/Manager.<br>2. Vào lịch sử điểm danh của buổi tập để kiểm tra trạng thái và điều chỉnh thủ công nếu thành viên quên điện thoại. | *"Trưởng ban có thể giám sát danh sách điểm danh real-time, chỉnh sửa thủ công và hệ thống sẽ tự động tính toán tỷ lệ chuyên cần (%) để phục vụ đánh giá KPI cuối tháng."* |

---

### KỊCH BẢN 3: KHO THIẾT BỊ & MƯỢN TRẢ ĐẠO CỤ (Inventory)
* **Ý nghĩa:** Quản lý tài sản CLB, giải quyết triệt để tình trạng thất lạc đạo cụ, trang phục biểu diễn.

| Bước | Người thực hiện (Role) | Hành động trên màn hình (Click & Type) | Lời thoại thuyết trình |
| :--- | :--- | :--- | :--- |
| **Bước 3.1** | Trưởng ban / Admin | 1. Vào menu **Kho thiết bị** (`/inventory`).<br>2. Xem danh sách thiết bị hiện có (hình ảnh, tổng số lượng, số lượng sẵn có, vị trí lưu kho).<br>3. (Tùy chọn) Thêm một thiết bị mới (ví dụ: Loa kéo JBL, số lượng: `2`). | *"Hệ thống cung cấp một trang quản lý kho vật tư rõ ràng. Trưởng ban hậu cần có thể quản lý số lượng tổng, vị trí tủ đồ và trạng thái đạo cụ (tốt, hỏng, đang sửa)."* |
| **Bước 3.2** | Thành viên (Member) | 1. Đăng nhập tài khoản Member.<br>2. Vào **Kho thiết bị** $\rightarrow$ Click **Đăng ký mượn** trên thiết bị Loa kéo JBL.<br>3. Điền số lượng mượn (`1`), chọn ngày mượn, ngày trả dự kiến và lý do mượn $\rightarrow$ Bấm gửi. | *"Thành viên khi cần mượn đồ đi diễn sẽ lập một phiếu yêu cầu mượn trực tuyến, nêu rõ thời gian dự kiến và lý do sử dụng."* |
| **Bước 3.3** | Trưởng ban / Admin | 1. Vào tab **Đơn Mượn Trả**.<br>2. Tìm đơn của thành viên $\rightarrow$ Bấm **Phê duyệt (Duyệt xuất kho)**.<br>3. Kiểm tra số lượng sẵn có của Loa kéo JBL (đã tự động giảm đi `1`). | *"Trưởng ban sau khi kiểm tra hiện trạng sẽ bấm Duyệt xuất kho. Ngay lập tức số lượng Loa kéo khả dụng trong kho sẽ bị trừ đi 1 để tránh việc mượn trùng lặp."* |
| **Bước 3.4** | Trưởng ban / Admin | 1. Khi thành viên mang trả đạo cụ $\rightarrow$ Trưởng ban click vào nút **Nhận lại**.<br>2. Kiểm tra số lượng sẵn có (đã tự động cộng trở lại). | *"Khi thành viên hoàn trả đồ, Trưởng ban bấm Nhận lại, hệ thống tự động hoàn số lượng khả dụng về ban đầu và ghi nhận ngày giờ trả thực tế."* |

---

### KỊCH BẢN 4: TÀI CHÍNH & ĐÓNG HỘI PHÍ ONLINE (Finance & VNPay)
* **Ý nghĩa:** Minh bạch thu chi quỹ câu lạc bộ, tích hợp cổng thanh toán hiện đại.

| Bước | Người thực hiện (Role) | Hành động trên màn hình (Click & Type) | Lời thoại thuyết trình |
| :--- | :--- | :--- | :--- |
| **Bước 4.1** | Trưởng ban (Manager) | 1. Vào menu **Tài chính & Quỹ** $\rightarrow$ Tab **Đề xuất kinh phí** (`/finance`).<br>2. Lập đề xuất: Chọn sự kiện "Festival Mùa Hè 2026", Nhập tiêu đề "Mua đạo cụ múa", Số tiền `50,000`đ, giải trình $\rightarrow$ Gửi. | *"Mỗi khi tổ chức sự kiện, các trưởng ban sẽ gửi đề xuất kinh phí dự trù lên Ban chủ nhiệm phê duyệt."* |
| **Bước 4.2** | Chủ nhiệm (Admin) | 1. Vào tab **Đề xuất kinh phí** $\rightarrow$ Tìm đề xuất vừa lập $\rightarrow$ Bấm **Phê duyệt & Giải ngân**.<br>2. Kiểm tra số dư quỹ CLB (đã bị trừ đi `50,000`đ) và lịch sử dòng CHI tự động ở tab **Sổ Quỹ CLB**. | *"Chủ nhiệm duyệt đề xuất. Ngay khi bấm Phê duyệt, hệ thống sẽ tự động giải ngân, trừ số dư quỹ câu lạc bộ và tự động ghi một dòng lịch sử CHI vào sổ quỹ mà không cần nhập tay."* |
| **Bước 4.3** | Thành viên (Member) | 1. Vào tab **Nộp Hội phí & Quỹ**.<br>2. Chọn mức đóng gợi ý `100,000`đ.<br>3. Bấm **Tạo Link Thanh toán VNPay** $\rightarrow$ Click **Mở Trang VNPay**.<br>4. Sử dụng thông tin thẻ Test giả lập (ở cột bên cạnh) để thanh toán.<br>5. Báo giao dịch thành công $\rightarrow$ Quay lại hệ thống. | *"Thành viên cũng có thể đóng hội phí online qua cổng VNPay Sandbox. Sau khi thanh toán thành công, hệ thống tự động nhận kết quả callback, cộng tiền vào số dư quỹ và ghi dòng lịch sử THU."* |
| **Bước 4.4** | Chủ nhiệm (Admin) | 1. Bấm nút **Xuất PDF hội phí** ở góc trên màn hình. | *"Đồng thời, Admin có thể xuất báo cáo PDF danh sách đóng hội phí của tháng chỉ bằng một click để báo cáo với nhà trường."* |

---

### KỊCH BẢN 5: SỰ KIỆN CÔNG KHAI & VÉ QR CODE (Public Event & Ticketing)
* **Ý nghĩa:** Tổ chức bán vé/đăng ký vé cho khán giả ngoài câu lạc bộ, quét mã QR soát vé chuyên nghiệp tại cửa.

| Bước | Người thực hiện (Role) | Hành động trên màn hình (Click & Type) | Lời thoại thuyết trình |
| :--- | :--- | :--- | :--- |
| **Bước 5.1** | Khách mời (Công chúng) | 1. Mở tab ẩn danh, truy cập `http://localhost:5173/public/events/1`.<br>2. Xem thông tin sự kiện "Festival Nghệ thuật Mùa hè 2026".<br>3. Điền Form đăng ký vé: Họ tên, Email, SĐT $\rightarrow$ Bấm **Đăng ký vé tham gia**. | *"Đối với các chương trình biểu diễn lớn, CLB sẽ mở đăng ký vé công khai. Khán giả chỉ cần truy cập vào đường dẫn sự kiện công khai và đăng ký vé mà không cần tài khoản đăng nhập."* |
| **Bước 5.2** | Hệ thống | 1. Sinh mã vé UUID và hiển thị **Mã QR Code** đại diện cho vé của khách mời ngay trên màn hình. | *"Ngay lập tức, hệ thống sẽ sinh ra một mã vé duy nhất kèm theo hình ảnh mã QR Code để khán giả lưu lại mang tới sự kiện."* |
| **Bước 5.3** | Trưởng ban soát vé | 1. Trên trình duyệt chính (Admin), vào menu **Lịch & Sự kiện** $\rightarrow$ chọn sự kiện $\rightarrow$ Mở tính năng **Soát Vé**.<br>2. Nhập mã vé UUID (hoặc dùng camera quét mã QR).<br>3. Hệ thống báo: "Check-in vé thành công".<br>4. Thử quét/nhập lại mã vé đó lần thứ 2 $\rightarrow$ Báo lỗi: "Vé đã được sử dụng!". | *"Tại cửa sự kiện, trưởng ban sử dụng chức năng soát vé để quét mã QR của khách mời. Hệ thống sẽ kiểm tra tính hợp lệ của vé trong database. Nếu quét lần thứ hai, hệ thống sẽ báo lỗi trùng lặp để ngăn chặn gian lận vé."* |

---

### KỊCH BẢN 6: BIỂU QUYẾT & KHẢO SÁT NỘI BỘ (Polls)
* **Ý nghĩa:** Lấy ý kiến biểu quyết dân chủ, thống kê số liệu minh bạch trong câu lạc bộ.

| Bước | Người thực hiện (Role) | Hành động trên màn hình (Click & Type) | Lời thoại thuyết trình |
| :--- | :--- | :--- | :--- |
| **Bước 6.1** | Trưởng ban / Admin | 1. Vào menu **Biểu quyết nội bộ** (`/polls`).<br>2. Nhập tiêu đề: "Lựa chọn địa điểm đi dã ngoại CLB", chọn nhiều đáp án, hạn chót.<br>3. Thêm các đáp án: "Đà Lạt", "Vũng Tàu", "Nha Trang" $\rightarrow$ Click **Tạo Biểu Quyết**. | *"Để lấy ý kiến biểu quyết, Ban chủ nhiệm có thể tạo cuộc khảo sát nội bộ với nhiều đáp án tùy chọn."* |
| **Bước 6.2** | Thành viên (Member) | 1. Vào trang Biểu quyết, mở rộng cuộc khảo sát vừa tạo.<br>2. Tích chọn "Đà Lạt" $\rightarrow$ Bấm **Gửi bình chọn**. | *"Mọi thành viên đều có thể tham gia bỏ phiếu. Hệ thống cho phép thành viên thay đổi quyết định bỏ phiếu trước khi cuộc bình chọn kết thúc."* |
| **Bước 6.3** | Hệ thống | 1. Hiển thị phần trăm (%) bình chọn thay đổi ngay lập tức trên biểu đồ thanh tiến trình ở bên cạnh. | *"Kết quả bỏ phiếu được tính toán trực tiếp và hiển thị dưới dạng biểu đồ phần trăm real-time, đảm bảo tính công bằng và nhanh chóng."* |

---

## PHẦN 3: BỘ CÂU HỎI PHẢN BIỆN (Q&A) THƯỜNG GẶP
*(Chuẩn bị trước để trả lời câu hỏi của Hội đồng phản biện)*

### Câu 1: Làm thế nào để giải quyết vấn đề bảo mật và phân quyền trong hệ thống?
* **Trả lời:**
  * Hệ thống sử dụng **Spring Security kết hợp với JWT (JSON Web Token)** để bảo mật API. Mỗi request từ frontend gửi lên bắt buộc phải kèm theo JWT Token trong Header `Authorization`.
  * Tại Backend, các API được bảo vệ bằng annotation `@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'MEMBER')")` để kiểm tra vai trò tại tầng controller trước khi xử lý logic.
  * Cấu hình chi tiết nằm tại file `SecurityConfig.java`.

### Câu 2: Làm sao để đảm bảo dữ liệu của các Ban/Đội không bị lẫn lộn hoặc rò rỉ chéo?
* **Trả lời:**
  * Chúng em áp dụng nguyên tắc **Data Isolation (Cô lập dữ liệu)**.
  * Trong SQL, mỗi `user` đều liên kết với một `department_id` và `team_id`.
  * Ở tầng Service (Backend), các câu lệnh truy vấn dữ liệu (như xem Lịch tập, xem Task) luôn đi kèm điều kiện `WHERE department_id = :deptId` hoặc `WHERE team_id = :teamId` dựa trên thông tin của người dùng đang đăng nhập (được lấy từ JWT context). Member của Đội A tuyệt đối không thể gọi API xem lịch hay chat của Đội B.

### Câu 3: Cơ chế cập nhật số dư quỹ khi duyệt đề xuất tài chính được xử lý như thế nào để đảm bảo tính nhất quán dữ liệu (Data Consistency)?
* **Trả lời:**
  * Khi Admin bấm duyệt đề xuất kinh phí, Backend xử lý trong một phương thức được đánh dấu `@Transactional` ở `FinanceService.java`.
  * Việc này đảm bảo cả 3 thao tác: cập nhật trạng thái đề xuất thành `APPROVED`, tạo dòng giao dịch CHI (`EXPENSE`), và trừ số dư quỹ của CLB đều được thực thi thành công dưới dạng một **Atomic Transaction (Giao dịch nguyên tố)**. Nếu có bất kỳ lỗi nào xảy ra ở giữa, toàn bộ quy trình sẽ được rollback để tránh mất mát, sai lệch tiền quỹ.

### Câu 4: Hãy giải thích luồng hoạt động real-time của Chat nhóm và Thông báo?
* **Trả lời:**
  * Hệ thống sử dụng **WebSocket dựa trên giao thức STOMP và SockJS** (cấu hình tại `WebSocketConfig.java`).
  * Khi người dùng gửi tin nhắn, tin nhắn đó được gửi qua một WebSocket endpoint `/app/chat/send`, Backend nhận được sẽ lưu vào database, sau đó broadcast (phát quảng bá) đến kênh đăng ký `/topic/chat/{roomId}` của phòng đó. Tất cả thành viên đang subscribe (lắng nghe) kênh này sẽ nhận được tin nhắn tức thời mà không cần reload trang.
  * Các thông báo hệ thống (giao việc mới, duyệt phép...) cũng được đẩy trực tiếp tới kênh riêng của từng user thông qua `/user/queue/notifications`.

### Câu 5: Hệ thống xử lý thế nào khi người dùng F5 hoặc mất kết nối mạng?
* **Trả lời:**
  * Token truy cập (`accessToken`) và thông tin người dùng được lưu trữ an toàn trong `localStorage` của trình duyệt. Khi người dùng bấm F5, React sẽ đọc lại token này để khôi phục trạng thái đăng nhập của ứng dụng mà không bắt đăng nhập lại.
  * Nếu token hết hạn, hệ thống sử dụng cơ chế **Silent Refresh** (được viết trong interceptor của `api.js`), tự động gửi `refreshToken` lên backend để lấy `accessToken` mới mà không làm gián đoạn trải nghiệm của người dùng.

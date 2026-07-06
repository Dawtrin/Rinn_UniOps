# BÁO CÁO CHUYÊN ĐỀ 1: JAVA WEB

TRƯỜNG ĐẠI HỌC CÔNG NGHỆ THÔNG TIN VÀ TRUYỀN THÔNG VIỆT – HÀN  
Khoa Khoa Học Máy Tính  

---
  
## ĐỀ TÀI: RIN_UNIOPS – XÂY DỰNG NỀN TẢNG WEB TƯƠNG TÁC REAL-TIME HỖ TRỢ QUẢN LÝ SỰ KIỆN VÀ NHÂN SỰ CÂU LẠC BỘ

Giảng viên hướng dẫn: ThS. Nguyễn Đỗ Công Pháp  
Sinh viên thực hiện: [Tên của bạn] - [Mã sinh viên]  
Đà Nẵng, tháng 6 năm 2026


---

## LỜI CẢM ƠN

Lời đầu tiên, em xin được gửi lời cảm ơn chân thành và sâu sắc nhất đến giảng viên hướng dẫn – ThS. Nguyễn Đỗ Công Pháp. Trong suốt quá trình thực hiện đề tài Chuyên đề 1: Java Web, thầy đã luôn dành thời gian định hướng khoa học và tận tình hướng dẫn em từ những bước thiết kế cơ sở dữ liệu ban đầu cho đến khi hoàn thiện lập trình các tính năng tương tác thời gian thực WebSockets và tích hợp cổng thanh toán VNPay Sandbox. Những lời khuyên chuyên môn quý báu của thầy đã giúp em tháo gỡ nhiều khó khăn kỹ thuật phức tạp để hoàn thành sản phẩm đúng hạn.

Em cũng xin trân trọng cảm ơn quý Thầy Cô thuộc Khoa Khoa học Máy tính, Trường Đại học Công nghệ Thông tin và Truyền thông Việt – Hàn (VKU) đã truyền đạt cho em những tri thức chuyên ngành bổ ích, đồng thời tạo điều kiện cơ sở vật chất tốt nhất để em nghiên cứu và thực hiện đề tài này.

Cuối cùng, em xin gửi lời cảm ơn tới gia đình, bạn bè cùng các thành viên câu lạc bộ đã hỗ trợ cung cấp thông tin thực tế và nhiệt tình tham gia dùng thử nghiệm để giúp em tối ưu hóa trải nghiệm hệ thống.

Do giới hạn về mặt thời gian và kinh nghiệm thực tiễn, chuyên đề chắc chắn không tránh khỏi những thiếu sót. Em rất mong nhận được những nhận xét, đánh giá đóng góp từ quý Thầy Cô để sản phẩm tiếp tục được hoàn thiện tốt hơn.

Em xin chân thành cảm ơn!

---

## MỤC LỤC
- MỞ ĐẦU
- CHƯƠNG 1: NGHIÊN CỨU TỔNG QUAN
  - 1.1. Giới thiệu đề tài
  - 1.2. Lý do chọn đề tài
  - 1.3. Mục tiêu và phạm vi hệ thống
  - 1.4. Đối tượng sử dụng hệ thống
  - 1.5. Nghiệp vụ cốt lõi của đề tài
- CHƯƠNG 2: CƠ SỞ LÝ THUYẾT VÀ CÔNG NGHỆ SỬ DỤNG
  - 2.1. Lập trình giao diện với ReactJS và Vite
  - 2.2. Lập trình nghiệp vụ với Spring Boot 3 và Spring Security
  - 2.3. Cơ sở dữ liệu quan hệ MySQL và tầng ORM JPA/Hibernate
  - 2.4. Giao thức tương tác thời gian thực WebSockets và STOMP
  - 2.5. Công nghệ tích hợp nâng cao (VNPay Sandbox và Google Gemini AI)
- CHƯƠNG 3: PHÂN TÍCH & THIẾT KẾ HỆ THỐNG
  - 3.1. Mô hình kiến trúc tổng quan (Client-Server)
  - 3.2. Khảo sát & đặc tả yêu cầu chức năng
  - 3.3. Yêu cầu phi chức năng
  - 3.4. Thiết kế Use Case chi tiết
  - 3.5. Thiết kế Cơ sở dữ liệu (MySQL Schema)
  - 3.6. Biểu đồ Tuần tự (Sequence Diagram)
  - 3.7. Biểu đồ Hoạt động (Activity Diagram)
  - 3.8. Thiết kế Sơ đồ lớp (Class Diagram)
- CHƯNG 4: XÂY DỰNG GIAO DIỆN HỆ THỐNG
  - 4.1. Phân hệ Giao diện chung (Công khai & Đăng nhập)
  - 4.2. Phân hệ Giao diện Quản trị viên (Admin & Manager Dashboards)
  - 4.3. Phân hệ Giao diện Thành viên (Member Dashboard & Interactions)
- CHƯƠNG 5: KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN
  - 5.1. Kết quả đạt được
    - 5.1.1. Về mặt lý thuyết và công nghệ
    - 5.1.2. Về mặt ứng dụng thực tiễn
  - 5.2. Các mặt hạn chế còn tồn tại
  - 5.3. Đề xuất các ý tưởng mới (Sáng kiến sản phẩm)
  - 5.4. Hướng phát triển công nghệ của hệ thống
- TÀI LIỆU THAM KHẢO


## MỞ ĐẦU

Trong kỷ nguyên chuyển đổi số và cuộc Cách mạng công nghiệp 4.0, việc ứng dụng công nghệ thông tin vào công tác quản trị và tối ưu hóa quy trình đã trở thành xu hướng tất yếu trong mọi tổ chức. Tại các trường đại học, phong trào sinh viên và các hoạt động ngoại khóa là một phần không thể thiếu nhằm phát triển kỹ năng mềm. Tuy nhiên, công tác quản lý các câu lạc bộ (CLB) sinh viên hiện nay vẫn còn gặp nhiều khó khăn do số lượng thành viên đông, cơ cấu ban ngành phức tạp và lịch trình sinh hoạt biến động liên tục. Các phương thức quản lý truyền thống qua tin nhắn mạng xã hội hay bảng tính Excel rời rạc thường dẫn đến tình trạng trôi thông tin, thất lạc trang thiết bị và thiếu minh bạch về dòng tiền quỹ.

Nhận thức được thực trạng đó, em đã nghiên cứu và phát triển đề tài: "RIN_UNIOPS – XÂY DỰNG NỀN TẢNG WEB TƯƠNG TÁC REAL-TIME HỖ TRỢ QUẢN LÝ SỰ KIỆN VÀ NHÂN SỰ CÂU LẠC BỘ" trong học phần Chuyên đề 1: Java Web. Ứng dụng Rin_UniOps được xây dựng với mục tiêu trở thành một hệ thống quản lý tập trung, kết nối chặt chẽ giữa Ban chủ nhiệm, các Trưởng ban chuyên môn và toàn thể thành viên CLB. Hệ thống giải quyết các bài toán vận hành thực tế thông qua việc phân quyền rõ ràng, hỗ trợ tương tác thời gian thực (Real-time Chat & Notifications) qua giao thức WebSocket và số hóa các quy trình cốt lõi như lập thời khóa biểu, điểm danh, mượn trả đạo cụ, duyệt chi ngân sách sự kiện và đóng quỹ online qua VNPay Sandbox.

---

## CHƯƠNG 1: NGHIÊN CỨU TỔNG QUAN

### 1.1. Giới thiệu đề tài
Đề tài "RIN_UNIOPS – XÂY DỰNG NỀN TẢNG WEB TƯƠNG TÁC REAL-TIME HỖ TRỢ QUẢN LÝ SỰ KIỆN VÀ NHÂN SỰ CÂU LẠC BỘ" được phát triển nhằm tối ưu hóa quy trình quản lý hành chính, nhân sự, tài chính và sự kiện cho các Câu lạc bộ (CLB), Đội, Nhóm học thuật và nghệ thuật tại các trường đại học. Dự án Rin_UniOps đóng vai trò như một hệ điều hành CLB (Club OS) thông minh, hỗ trợ số hóa toàn diện quy trình vận hành và kết nối các thành viên nội bộ.

Hệ thống được phát triển trên kiến trúc Web Fullstack hiện đại bao gồm:
- Lớp giao diện (Frontend): Sử dụng ReactJS kết hợp công cụ Vite để xây dựng giao diện Single Page Application (SPA) mượt mà, phản hồi nhanh. Giao diện áp dụng thiết kế Dual UX gồm Bento Grid dark mode cho nhà quản trị và giao diện Story Dashboard light mode cho thành viên.
- Lớp nghiệp vụ (Backend): Sử dụng framework Spring Boot 3 kết hợp Spring Security để xây dựng hệ thống RESTful API bảo mật, xác thực qua cơ chế JWT không lưu trạng thái (stateless).
- Lớp dữ liệu (Database): Sử dụng MySQL kết hợp tầng ORM JPA/Hibernate nhằm đảm bảo tính nhất quán của dữ liệu.
- Tương tác thời gian thực (Real-time): Ứng dụng giao thức WebSockets (STOMP) để vận hành phòng chat nội bộ và đẩy thông báo tức thời.
- Tích hợp nâng cao: Tích hợp cổng thanh toán trực tuyến VNPay Sandbox phục vụ thu quỹ tự động; camera quét mã QR soát vé sự kiện công khai; và API Google Gemini AI (model gemini-2.5-flash) để gợi ý phân công nhân sự thông minh.

---

### 1.2. Lý do chọn đề tài
Khảo sát thực tế tại các câu lạc bộ nghệ thuật và đội nhóm sinh viên cho thấy công tác quản lý thủ công hiện gặp bốn khó khăn cốt lõi:
1. Trôi thông tin và giao tiếp thiếu đồng bộ: Việc liên lạc qua các nhóm chat mạng xã hội thông thường (Messenger, Zalo) khiến thông tin quan trọng như lịch tập, kế hoạch biểu diễn hay hạn chót công việc bị trôi đi nhanh chóng, gây chậm trễ tiến độ.
2. Thất thoát tài sản và đạo cụ biểu diễn: Các trang phục, loa đài có giá trị được mượn trả tự do không có lịch sử ghi nhận rõ ràng, dễ gây hư hỏng và thất lạc tài sản CLB mà không thể quy trách nhiệm cụ thể.
3. Tài chính thiếu minh bạch: Quỹ CLB được quản lý thủ công qua bảng tính Excel và đối chiếu hóa đơn chụp màn hình rất mất thời gian. Việc tạm ứng, phê duyệt ngân sách sự kiện rời rạc khiến ban chủ nhiệm khó cập nhật số dư tức thời.
4. Kiểm soát vé sự kiện thủ công dễ gian lận: Việc sử dụng vé giấy vừa tốn chi phí, vừa dễ bị làm giả. Soát vé thủ công bằng mắt thường tại cửa sự kiện sự kiện dễ gây tắc nghẽn và không thể ngăn chặn triệt để tình trạng một vé check-in nhiều lần.

Dự án Rin_UniOps được xây dựng nhằm giải quyết toàn diện các vấn đề trên, số hóa quy trình vận hành thủ công thành quy trình tự động, trực quan và minh bạch.

---

### 1.3. Mục tiêu và phạm vi hệ thống
#### 1.3.1. Mục tiêu hệ thống
- Về kỹ thuật: Làm chủ quy trình xây dựng dự án Web Fullstack; triển khai cơ chế xác thực phân quyền an toàn qua JWT; thiết lập kênh truyền tin WebSocket STOMP thời gian thực; tích hợp cổng thanh toán VNPay Sandbox và API Google Gemini AI; thiết kế giao diện Dual UX tương thích đa thiết bị.
- Về nghiệp vụ: Số hóa 100% tài liệu hành chính; tự động hóa luồng nghiệp vụ liên kết từ lịch hoạt động, điểm danh, công việc đến chấm điểm KPI và báo cáo sổ quỹ tài chính.

#### 1.3.2. Phạm vi hệ thống
- Đối tượng áp dụng: Mô hình hoạt động của một câu lạc bộ sinh viên nghệ thuật hoặc học thuật cấp trường đại học (quy mô dưới 200 thành viên).
- Môi trường hoạt động: Chạy thử nghiệm trên môi trường Localhost, hỗ trợ hiển thị tốt trên máy tính và điện thoại di động.
- Giới hạn kỹ thuật: Cổng thanh toán VNPay chạy trên môi trường Sandbox giả định; hệ thống email tự động cấu hình qua giao thức SMTP thử nghiệm; Gemini AI chạy bằng API Key kiểm thử.

---

### 1.4. Đối tượng sử dụng hệ thống
Hệ thống Rin_UniOps áp dụng cơ chế phân quyền nghiêm ngặt theo vai trò (RBAC) và cô lập dữ liệu giữa các ban ngành, đội nhóm. Có 4 đối tượng sử dụng chính:

1. Chủ nhiệm CLB (Admin):
- Phạm vi dữ liệu: Quyền truy cập toàn bộ hệ thống (Global Access).
- Các chức năng chính: Quản lý danh mục ban ngành và các đội con; phân quyền và phê duyệt hoặc vô hiệu hóa tài khoản của các thành viên; giám sát dòng tiền quỹ CLB và trực tiếp phê duyệt các đề xuất kinh phí sự kiện; gửi thông báo khẩn cấp toàn CLB; xem báo cáo thống kê KPI và chuyên cần tổng hợp của tất cả các ban.

2. Trưởng/Phó ban (Manager):
- Phạm vi dữ liệu: Quyền truy cập trong phạm vi ban phụ trách (Department Access).
- Các chức năng chính: Quản lý thành viên và thiết lập đội con trong ban mình; tạo lịch tập luyện, lịch họp tuần cho ban/đội; giao việc và duyệt kết quả hoàn thành task của thành viên; chấm điểm đánh giá KPI tháng cho thành viên ban mình; đề xuất ngân sách sự kiện; thực hiện soát vé khách mời bằng camera quét mã QR.

3. Thành viên (Member):
- Phạm vi dữ liệu: Quyền truy cập cá nhân và đội nhóm của mình (Team và Personal Access).
- Các chức năng chính: Xem lịch tập hoặc lịch họp của đội mình và check-in điểm danh; nhận việc và cập nhật tiến độ công việc từ TODO sang IN_PROGRESS và gửi duyệt REVIEW; gửi yêu cầu mượn đạo cụ, thiết bị biểu diễn; đóng quỹ CLB trực tuyến qua VNPay; tham gia chat nhóm và biểu quyết các cuộc khảo sát ý kiến.

4. Ứng viên và Khách ngoài (Public):
- Phạm vi dữ liệu: Chỉ truy cập trang công khai (Public Interface).
- Các chức năng chính: Đăng ký tuyển dụng trực tuyến vào CLB; đăng ký nhận vé điện tử (mã QR gửi qua email) để tham dự các sự kiện công khai của CLB.

---

### 1.5. Nghiệp vụ cốt lõi của đề tài
Hệ thống liên kết dữ liệu nghiệp vụ chặt chẽ thông qua các luồng xử lý tự động:

- Nghiệp vụ Tuyển dụng và Onboarding: Ứng viên gửi hồ sơ trực tuyến -> Trưởng ban phỏng vấn, nhập điểm đánh giá -> Admin duyệt nhận -> Hệ thống tự động tạo tài khoản Member và gửi email thông tin đăng nhập -> Tự động gia nhập các nhóm chat WebSocket tương ứng.
- Nghiệp vụ Thời khóa biểu và Điểm danh: Trưởng ban tạo lịch tuần và các slot cụ thể -> Thành viên check-in đúng giờ trên Story Dashboard -> Hệ thống ghi nhận trạng thái điểm danh (PRESENT, LATE, ABSENT, EXCUSED) -> Tự động tính tỷ lệ chuyên cần làm căn cứ xếp loại đánh giá KPI tháng.
- Nghiệp vụ Quản lý Kho đồ: Ban hậu cần nhập danh mục vật tư -> Thành viên đăng ký phiếu mượn đồ -> Trưởng ban duyệt xuất kho (hệ thống tự động trừ số lượng khả dụng) -> Thành viên trả đồ -> Trưởng ban xác nhận nhận lại (hệ thống cộng hoàn số lượng khả dụng).
- Nghiệp vụ Tài chính (VNPay): Trưởng ban đề xuất chi kinh phí sự kiện -> Admin duyệt chi (quỹ tự động trừ và tạo giao dịch CHI). Đối với thu quỹ: Thành viên đóng tiền qua VNPay Sandbox -> Hệ thống nhận callback IPN -> Tự động cập nhật trạng thái đóng quỹ của thành viên và tạo giao dịch THU trong sổ quỹ CLB.
- Nghiệp vụ Phát hành và Soát vé QR: Khán giả đăng ký vé sự kiện -> Hệ thống tạo vé chứa mã UUID độc nhất và vẽ hình ảnh QR Code gửi qua email -> Khán giả xuất trình QR tại cửa -> Người soát vé dùng camera quét QR để xác thực trạng thái và check-in vé (ngăn ngừa tuyệt đối việc check-in trùng lặp).
- Nghiệp vụ Biểu quyết và Trợ lý gợi ý phân công AI: Ban chủ nhiệm tạo khảo sát ý kiến -> Thành viên vote -> Kết quả vote tự động cập nhật biểu đồ thời gian thực qua WebSocket. Khi phân công nhân sự sự kiện: Trưởng ban yêu cầu gợi ý -> Backend tổng hợp dữ liệu chuyên cần, lịch sử hoàn thành task của thành viên và gọi API Google Gemini AI để trả về danh sách nhân sự phù hợp nhất kèm đánh giá chi tiết.



## CHƯƠNG 2: CƠ SỞ LÝ THUYẾT VÀ CÔNG NGHỆ SỬ DỤNG

### 2.1. Lập trình giao diện với ReactJS và Vite
ReactJS là một thư viện JavaScript mã nguồn mở được phát triển bởi Facebook, chuyên dùng để xây dựng giao diện người dùng (UI) dạng Single Page Application (SPA). ReactJS hoạt động dựa trên kiến trúc hướng thành phần (Component-Based), cho phép chia nhỏ giao diện thành các khối độc lập, có khả năng tái sử dụng cao. Cơ chế Virtual DOM (DOM ảo) của ReactJS giúp tối ưu hóa hiệu năng hiển thị bằng cách chỉ cập nhật những phần thay đổi thay vì tải lại toàn bộ trang DOM vật lý. Hệ thống cũng tận dụng các React Hooks như useState để quản lý trạng thái động và useEffect để xử lý các tác vụ bất đồng bộ (side effects) như gọi API hoặc thiết lập kết nối WebSocket.

Vite là bộ công cụ xây dựng (build tool) thế hệ mới, thay thế cho Create React App truyền thống. Vite tận dụng cơ chế Native ESM (ES Modules) giúp máy chủ phát triển khởi động nhanh chóng và phản hồi lập tức các thay đổi mã nguồn thông qua tính năng Hot Module Replacement (HMR). Sự kết hợp giữa ReactJS và Vite giúp tăng hiệu suất lập trình và tối ưu hóa kích thước gói biên dịch khi triển khai ứng dụng.

### 2.2. Lập trình nghiệp vụ với Spring Boot 3 và Spring Security
Spring Boot 3 là một framework mạnh mẽ trong hệ sinh thái Java, hỗ trợ tối đa quy trình cấu hình và phát triển các ứng dụng RESTful API cấp doanh nghiệp. Spring Boot hoạt động trên nguyên lý IoC (Inversion of Control - Đảo ngược điều khiển) và DI (Dependency Injection - Tiêm phụ thuộc), giúp giảm thiểu sự phụ thuộc giữa các lớp đối tượng và nâng cao khả năng kiểm thử. Framework này tự động hóa việc cấu hình các thành phần hệ thống thông qua cơ chế Auto-Configuration và tích hợp sẵn máy chủ nhúng Tomcat, giúp triển khai ứng dụng dễ dàng.

Spring Security kết hợp với JSON Web Token (JWT) được lựa chọn làm giải pháp bảo mật chính cho hệ thống. Thay vì sử dụng cơ chế lưu trữ phiên làm việc truyền thống (session-based), hệ thống áp dụng cơ chế xác thực không lưu trạng thái (stateless). Khi người dùng đăng nhập thành công, máy chủ sẽ cấp một chuỗi token JWT chứa thông tin nhận diện và vai trò (role) của người dùng đã được ký số bằng thuật toán mã hóa HMAC-SHA256. Mọi yêu cầu gửi lên API sau đó đều phải đính kèm token này trong tiêu đề Authorization của HTTP Request. Spring Security sẽ chặn các yêu cầu, giải mã chữ ký JWT để xác thực và phân quyền truy cập cho người dùng một cách an toàn.

### 2.3. Cơ sở dữ liệu quan hệ MySQL và tầng ORM JPA/Hibernate
MySQL là hệ quản trị cơ sở dữ liệu quan hệ (RDBMS) mã nguồn mở phổ biến, đảm bảo tính toàn vẹn dữ liệu thông qua cơ chế ràng buộc khóa ngoại và hỗ trợ các giao dịch ACID (Atomicity, Consistency, Isolation, Durability) cần thiết cho các hoạt động tài chính trong CLB.

Để tương tác giữa mã nguồn Java và cơ sở dữ liệu MySQL, hệ thống sử dụng tầng trung gian JPA (Java Persistence API) thông qua Hibernate làm nhà cung cấp ORM (Object-Relational Mapping). JPA/Hibernate tự động ánh xạ các lớp thực thể (Entity Class) trong Java thành các bảng tương ứng trong MySQL, giúp lập trình viên thao tác với dữ liệu dưới dạng hướng đối tượng thay vì phải viết các câu lệnh SQL thuần phức tạp. Ngoài ra, việc sử dụng các repository kế thừa JpaRepository giúp tự động hóa các câu lệnh CRUD cơ bản và tối ưu hóa hiệu suất truy vấn. Cơ chế quản lý giao dịch Spring @Transactional đảm bảo tính nhất quán dữ liệu cho các nghiệp vụ phức tạp liên quan đến dòng tiền.

### 2.4. Giao thức tương tác thời gian thực WebSockets và STOMP
WebSockets là giao thức truyền thông hai chiều, song công (full-duplex) hoạt động trên một kết nối TCP duy nhất sau khi hoàn thành bắt tay HTTP Handshake ban đầu. Khác với giao thức HTTP truyền thống hoạt động theo mô hình Request-Response (Client gửi yêu cầu mới có phản hồi từ Server), WebSockets cho phép cả Client và Server chủ động gửi dữ liệu cho nhau bất kỳ lúc nào mà không cần gửi lại các tiêu đề HTTP lặp đi lặp lại. Điều này giúp giảm thiểu băng thông đường truyền và loại bỏ hoàn toàn cơ chế Polling (liên tục gửi yêu cầu để kiểm tra dữ liệu mới).

Hệ thống sử dụng giao thức STOMP (Simple Text Oriented Messaging Protocol) chạy trên nền WebSocket để định tuyến tin nhắn một cách chuyên nghiệp. STOMP cung cấp mô hình Publish-Subscribe (Xuất bản - Đăng ký) rất linh hoạt:
- Kênh truyền tin chat nhóm (Topic): Thành viên đăng ký nhận tin từ một phòng chat cụ thể (ví dụ: /topic/chat/1) sẽ nhận được tin nhắn tức thời khi có bất kỳ ai trong nhóm gửi tin.
- Kênh thông báo cá nhân (Queue): Hệ thống gửi các thông báo riêng biệt (như thông báo giao việc, thông báo duyệt mượn đồ) tới đích danh tài khoản người nhận (ví dụ: /queue/notifications) một cách bảo mật và an toàn.

### 2.5. Công nghệ tích hợp nâng cao (VNPay Sandbox và Google Gemini AI)
Để nâng cao trải nghiệm người dùng và chuyển đổi số quy trình vận hành CLB, hệ thống tích hợp hai dịch vụ nâng cao của bên thứ ba:
- Cổng thanh toán trực tuyến VNPay Sandbox: Quy trình thanh toán được thực hiện bằng cách khởi tạo yêu cầu từ Backend, mã hóa chuỗi truy vấn với chữ ký bảo mật SHA512 và chuyển hướng người dùng tới trang thanh toán giả định của VNPay. Khi người dùng thực hiện giao dịch, VNPay sẽ gửi kết quả trực tiếp về máy chủ qua cơ chế IPN (Instant Payment Notification) callback. Hệ thống sẽ kiểm tra chữ ký phản hồi để xác thực tính hợp lệ của giao dịch và tự động ghi nhận doanh thu vào sổ quỹ CLB.
- Trí tuệ nhân tạo Google Gemini AI API: Hệ thống gọi API kết nối đến model gemini-2.5-flash để hỗ trợ ban chủ nhiệm phân tích hiệu suất làm việc của thành viên. Dựa trên các chỉ số lịch sử được Backend tổng hợp như tỷ lệ chuyên cần điểm danh và tốc độ hoàn thành công việc, mô hình AI sẽ đưa ra các nhận xét khách quan và đề xuất nhân sự phù hợp nhất cho các vị trí quan trọng trong sự kiện.


## CHƯƠNG 3: PHÂN TÍCH & THIẾT KẾ HỆ THỐNG

### 3.1. Mô hình kiến trúc tổng quan (Client-Server)
Hệ thống Rin_UniOps áp dụng mô hình kiến trúc 3 lớp (3-tier Architecture) tách biệt, giúp nâng cao khả năng bảo trì, mở rộng và bảo mật. Mô hình này phân chia ứng dụng thành 3 thành phần độc lập hoạt động theo cơ chế Client-Server:
- Presentation Layer (Giao diện người dùng): Xây dựng trên ReactJS và Vite, chạy trực tiếp trên trình duyệt của người dùng cuối. Lớp này đảm nhận việc kết xuất giao diện, xử lý trải nghiệm tương tác (UX) và gửi yêu cầu (Request) dữ liệu tới máy chủ.
- Application Layer (Nghiệp vụ hệ thống): Triển khai trên nền tảng Spring Boot 3, đóng vai trò là REST API server. Lớp này chịu trách nhiệm điều phối toàn bộ luồng nghiệp vụ, xác thực phân quyền người dùng qua Spring Security JWT, xử lý logic thời gian thực WebSockets và giao tiếp với các dịch vụ bên thứ ba (VNPay Sandbox, Google Gemini AI API).
- Database Layer (Cơ sở dữ liệu): Hệ quản trị cơ sở dữ liệu quan hệ MySQL lưu trữ lâu dài toàn bộ dữ liệu nghiệp vụ của câu lạc bộ, được quản lý và tương tác thông qua tầng ORM JPA/Hibernate của Backend.

#### Sơ đồ kiến trúc tổng quan hệ thống Client-Server

### 3.2. Khảo sát & đặc tả yêu cầu chức năng
Hệ thống được phát triển nhằm tự động hóa các nghiệp vụ quản lý CLB, phân chia rõ ràng theo từng nhóm đối tượng sử dụng:

#### 3.2.1. Phân hệ Quản trị (Admin và Manager)
- Quản lý tuyển dụng thành viên: Tiếp nhận hồ sơ đăng ký từ trang công khai, cập nhật trạng thái tuyển dụng, chấm điểm phỏng vấn và phê duyệt ứng viên chính thức (tự động kích hoạt tài khoản).
- Điều phối thời khóa biểu: Thiết lập lịch tập luyện, lịch họp định kỳ của các ban ngành, theo dõi và kết xuất báo cáo điểm danh chuyên cần của thành viên.
- Quản lý kho thiết bị: Theo dõi danh mục đạo cụ, trang phục biểu diễn, phê duyệt các yêu cầu mượn đồ và ghi nhận trả đồ từ thành viên.
- Giám sát tài chính: Quản lý dòng tiền quỹ CLB, duyệt các yêu cầu chi tiêu sự kiện của các ban ngành và theo dõi nhật ký thu chi.

#### 3.2.2. Phân hệ Thành viên (Member)
- Theo dõi lịch hoạt động: Xem thời khóa biểu cá nhân và của ban/đội mình tham gia, thực hiện check-in điểm danh các buổi tập.
- Đăng ký mượn đạo cụ: Gửi phiếu yêu cầu mượn thiết bị trong kho phục vụ biểu diễn hoặc tập luyện.
- Đóng quỹ online: Thực hiện đóng hội phí trực tuyến thông qua cổng thanh toán VNPay Sandbox.
- Tương tác nội bộ: Gửi tin nhắn chat nhóm thời gian thực và tham gia bình chọn các cuộc khảo sát ý kiến do ban chủ nhiệm khởi tạo.

### 3.3. Yêu cầu phi chức năng
Để đảm bảo vận hành ổn định trong môi trường thực tế, hệ thống đáp ứng các tiêu chuẩn kỹ thuật phi chức năng sau:
- Cô lập dữ liệu và bảo mật (Data Isolation): Phân quyền chặt chẽ dựa trên vai trò (RBAC). Thành viên của ban ngành hoặc đội nhóm nào chỉ được phép tiếp cận tài nguyên và kênh chat của đơn vị đó, ngăn chặn rò rỉ thông tin nội bộ.
- Tính nhất quán của dữ liệu (Consistency): Tất cả các giao dịch thay đổi số dư quỹ hoặc cập nhật số lượng thiết bị trong kho đều được bảo vệ trong các giao dịch an toàn (Transaction), đảm bảo quy tắc ACID.
- Hiệu năng thời gian thực (Real-time Performance): Kênh truyền tin WebSocket STOMP phải phản hồi và phân phối thông báo, tin nhắn dưới 1 giây trong điều kiện kết nối mạng ổn định.

### 3.4. Thiết kế Use Case chi tiết
Để làm rõ các tương tác giữa người dùng và hệ thống, báo cáo phân tích thiết kế chi tiết thông qua 5 sơ đồ Use Case cho từng phân hệ nghiệp vụ cốt lõi:

#### 3.4.1 Sơ đồ Use Case tổng quát hệ thống
[Chèn ảnh chụp sơ đồ Use Case tổng quát tại đây]

- Mô tả sơ đồ: Sơ đồ Use Case tổng quát phác thảo toàn bộ chức năng của hệ thống Rin_UniOps tương ứng với 4 nhóm tác nhân sử dụng bao gồm: Khách ngoài (Public User), Thành viên (Member), Trưởng/Phó ban (Manager) và Chủ nhiệm CLB (Admin).
- Các luồng chính: Khách ngoài thực hiện nộp đơn tuyển dụng và đăng ký vé sự kiện. Thành viên check-in hoạt động, mượn đồ dùng, đóng quỹ và tham gia chat nhóm. Trưởng ban quản trị công việc nội bộ và duyệt mượn đồ. Admin nắm quyền phê duyệt tài chính, kiểm soát hệ thống và theo dõi báo cáo KPI tổng thể.

#### 3.4.2 Sơ đồ Use Case phân hệ Tuyển dụng
[Chèn ảnh chụp sơ đồ Use Case tuyển dụng tại đây]

- Mô tả sơ đồ: Sơ đồ này chi tiết hóa quy trình tuyển chọn ứng viên từ lúc nộp đơn trực tuyến cho đến khi trở thành thành viên chính thức và được cấp tài khoản hệ thống.
- Tác nhân tham gia: Ứng viên (Khách ngoài), Trưởng ban (Manager) và Chủ nhiệm CLB (Admin).
- Các luồng chính: Ứng viên nộp hồ sơ qua giao diện public. Trưởng ban quản lý danh sách ứng tuyển ban mình, lên lịch phỏng vấn và thực hiện chấm điểm đánh giá năng lực phỏng vấn. Admin là người đưa ra quyết định cuối cùng để phê duyệt nhận ứng viên, khi duyệt nhận hệ thống sẽ tự động kích hoạt tài khoản thành viên mới và gửi thông tin mật khẩu tạm qua email.

#### 3.4.3 Sơ đồ Use Case phân hệ Quản lý Tài chính
[Chèn ảnh chụp sơ đồ Use Case tài chính tại đây]

- Mô tả sơ đồ: Quy trình hóa các giao dịch đóng hội phí tự động và kiểm soát việc chi tiêu ngân sách sự kiện của câu lạc bộ nhằm đảm bảo tính minh bạch tối đa.
- Tác nhân tham gia: Thành viên (Member), Trưởng ban (Manager) và Chủ nhiệm CLB (Admin).
- Các luồng chính: Thành viên thực hiện đóng hội phí trực tuyến (qua cổng VNPay Sandbox) và theo dõi nhật ký thu chi. Trưởng ban lập đề xuất chi ngân sách cho sự kiện của ban phụ trách. Admin phê duyệt đề xuất chi, hệ thống tự động thực hiện trừ số dư quỹ và tạo bản ghi giao dịch chi trong sổ quỹ CLB.

#### 3.4.4 Sơ đồ Use Case phân hệ Quản lý Kho đồ
[Chèn ảnh chụp sơ đồ Use Case kho đồ tại đây]

- Mô tả sơ đồ: Quản lý vòng đời mượn và trả đạo cụ, trang phục biểu diễn, giảm thiểu tình trạng thất thoát tài sản chung của câu lạc bộ.
- Tác nhân tham gia: Thành viên (Member) và Trưởng ban/Admin (Manager).
- Các luồng chính: Thành viên xem danh sách thiết bị khả dụng trong kho và lập phiếu yêu cầu mượn đồ. Trưởng ban/Admin phê duyệt đơn mượn (kho tự động trừ số lượng sẵn có) và xác nhận đã nhận lại đồ khi thành viên trả (kho tự động cộng hoàn số lượng khả dụng).

#### 3.4.5 Sơ đồ Use Case phân hệ Bình chọn và Trợ lý AI
[Chèn ảnh chụp sơ đồ Use Case bình chọn và trợ lý AI tại đây]

- Mô tả sơ đồ: Chi tiết hóa tính năng biểu quyết ý kiến thời gian thực và gọi gợi ý nhân sự thông qua trí tuệ nhân tạo.
- Tác nhân tham gia: Thành viên (Member) và Trưởng ban/Admin (Manager).
- Các luồng chính: Trưởng ban/Admin tạo cuộc khảo sát hoặc yêu cầu gợi ý phân công nhân sự sự kiện. Thành viên tham gia bình chọn và xem biểu đồ kết quả cập nhật tức thời qua WebSocket. Hệ thống tiếp nhận yêu cầu gợi ý từ quản lý, tự động tổng hợp dữ liệu chuyên cần, lịch sử nhiệm vụ và gọi API Google Gemini AI để đưa ra đánh giá đề xuất nhân sự tối ưu.

### 3.5. Thiết kế Cơ sở dữ liệu (MySQL Schema)
Hệ thống sử dụng cơ sở dữ liệu quan hệ MySQL để lưu trữ dữ liệu. Cấu trúc các bảng cốt lõi được mô tả chi tiết qua ảnh chụp schema từ HeidiSQL như dưới đây:

#### 3.5.1 Bảng users (Thành viên CLB và Ban chủ nhiệm)
[Chèn ảnh chụp cấu trúc bảng users tại đây]

#### 3.5.2 Bảng schedules (Thời khóa biểu tuần)
[Chèn ảnh chụp cấu trúc bảng schedules tại đây]

#### 3.5.3 Bảng schedules_slots (Các buổi tập/buổi họp chi tiết trong tuần)
[Chèn ảnh chụp cấu trúc bảng schedules_slots tại đây]

#### 3.5.4 Bảng polls (Bình chọn nội bộ)
[Chèn ảnh chụp cấu trúc bảng polls tại đây]

#### 3.5.5 Bảng club_fund_transactions (Nhật ký thu chi quỹ)
[Chèn ảnh chụp cấu trúc bảng club_fund_transactions tại đây]

#### 3.5.6 Bảng events (Quản lý sự kiện)
[Chèn ảnh chụp cấu trúc bảng events tại đây]

#### 3.5.7 Bảng event_tickets (Quản lý vé)
[Chèn ảnh chụp cấu trúc bảng event_tickets tại đây]

#### 3.5.8 Các bảng dữ liệu phụ trợ khác
Để tối ưu hóa không gian hiển thị và tránh lặp lại cấu trúc, các bảng phụ trợ khác trong cơ sở dữ liệu được định nghĩa ngắn gọn như sau:
- Bảng departments: Lưu thông tin các ban ngành chuyên môn trực thuộc CLB.
- Bảng teams: Lưu thông tin các đội con trong từng ban chuyên môn.
- Bảng team_members: Liên kết nhiều-nhiều giữa thành viên và đội nhóm, ghi nhận thời điểm gia nhập đội.
- Bảng borrow_requests: Nhật ký mượn trả trang thiết bị, đạo cụ CLB.
- Bảng inventory_items: Danh mục trang thiết bị, số lượng hiện có và số lượng khả dụng trong kho CLB.
- Bảng budget_requests: Đề xuất ngân sách chi tiêu sự kiện của các ban ngành chờ phê duyệt.
- Bảng poll_options: Lưu trữ các phương án bình chọn của từng cuộc khảo sát ý kiến.
- Bảng poll_votes: Lưu trữ kết quả bình chọn của từng thành viên để tổng hợp phần trăm thời gian thực.
- Bảng resource_items: Lưu thông tin các tài nguyên, tệp tin và liên kết chia sẻ dùng chung.
- Bảng notifications: Lưu các thông báo đẩy nội bộ phục vụ tính năng gửi thông báo thời gian thực.
- Bảng chat_messages: Lưu trữ nội dung tin nhắn của các phòng chat nhóm và chat cá nhân.

---

### 3.6. Biểu đồ Tuần tự (Sequence Diagram)
Biểu đồ tuần tự mô tả sự tương tác động giữa các đối tượng trong hệ thống theo tiến trình thời gian của các nghiệp vụ phức tạp:

#### 3.6.1 Sơ đồ tuần tự nghiệp vụ duyệt chi quỹ CLB
[Chèn ảnh chụp sơ đồ tuần tự nghiệp vụ duyệt chi quỹ tại đây]

- Mô tả sơ đồ: Biểu đồ này mô tả các thông điệp trao đổi theo thời gian giữa Quản lý/Admin, Giao diện người dùng (Frontend), Bộ điều khiển nghiệp vụ (FinanceController), Dịch vụ xử lý tài chính (FinanceService) và Cơ sở dữ liệu MySQL khi thực hiện duyệt một khoản đề xuất chi tiêu sự kiện CLB.
- Tiến trình xử lý: Admin thực hiện click phê duyệt trên Frontend, yêu cầu HTTP PUT được gửi kèm token JWT xác thực lên FinanceController. Controller chuyển tiếp nghiệp vụ tới FinanceService. Dịch vụ thực hiện nạp đơn đề xuất từ database, chuyển trạng thái thành APPROVED, thực hiện tính toán trừ số dư quỹ, đồng thời tạo mới một bản ghi giao dịch CHI (EXPENSE) trong sổ quỹ CLB. Toàn bộ thao tác cập nhật dữ liệu được lưu trữ trong Database một cách đồng bộ trước khi trả về kết quả thành công cho giao diện người dùng.

#### 3.6.2 Sơ đồ tuần tự nghiệp vụ điểm danh thành viên bằng mã QR động
[Chèn ảnh chụp sơ đồ tuần tự nghiệp vụ điểm danh bằng mã QR động tại đây]

- Mô tả sơ đồ: Mô tả chuỗi tương tác thời gian thực khi thành viên sử dụng thiết bị cá nhân để điểm danh thông qua việc quét mã QR động có thời hạn hiệu lực 30 giây được chiếu trên màn hình quản lý.
- Tiến trình xử lý: Thành viên quét mã QR chứa mã token JWT mã hóa, ứng dụng Frontend gửi yêu cầu HTTP POST kèm token lên AttendanceController. Controller chuyển tiếp token sang QrAttendanceService để giải mã và kiểm tra tính hợp lệ chữ ký bảo mật HS512 và thời hạn hết hạn 30 giây. Nếu token hợp lệ, hệ thống trả về mã buổi tập (sessionId) cho Controller để gọi tiếp AttendanceService thực hiện lưu bản ghi điểm danh (status = PRESENT) vào cơ sở dữ liệu và hiển thị kết quả thành công cho thành viên. Nếu token hết hạn hoặc chữ ký không khớp, hệ thống ném ngoại lệ BadRequestException và báo lỗi về giao diện người dùng.

---

### 3.7. Biểu đồ Hoạt động (Activity Diagram)
Biểu đồ hoạt động mô tả trình tự các bước thực hiện của người dùng và hệ thống khi xử lý một quy trình nghiệp vụ:

#### 3.7.1 Sơ đồ hoạt động nghiệp vụ đăng ký và mượn trả đạo cụ
[Chèn ảnh chụp sơ đồ hoạt động mượn trả đạo cụ tại đây]

- Mô tả sơ đồ: Sơ đồ hoạt động này chi tiết hóa tiến trình tương tác giữa thành viên và ban quản lý khi thực hiện quy trình mượn trang thiết bị, đạo cụ biểu diễn từ kho của CLB.
- Các bước xử lý chính: Quy trình bắt đầu khi thành viên gửi đơn mượn đồ. Hệ thống kiểm tra số lượng mượn so với số lượng sẵn có trong kho. Nếu đủ điều kiện, đơn được chuyển sang trạng thái chờ duyệt (PENDING). Quản lý kiểm tra và phê duyệt đơn mượn. Nếu được duyệt, đơn chuyển sang trạng thái BORROWED và kho tự động giảm đi số lượng tương ứng. Khi thành viên trả đồ, quản lý kiểm tra tình trạng vật lý và xác nhận, đơn chuyển sang trạng thái RETURNED và số lượng sẵn có trong kho tự động được cộng hoàn trả lại.

#### 3.7.2 Sơ đồ hoạt động nghiệp vụ đóng quỹ trực tuyến qua cổng VNPay
[Chèn ảnh chụp sơ đồ hoạt động đóng quỹ qua VNPay tại đây]

- Mô tả sơ đồ: Biểu diễn luồng giao dịch đóng góp hội phí trực tuyến an toàn thông qua sự kết hợp giữa máy chủ Rin_UniOps Backend và cổng thanh toán VNPay Sandbox.
- Các bước xử lý chính: Thành viên chọn mức đóng quỹ và gửi yêu cầu thanh toán. Backend khởi tạo đơn giao dịch ở trạng thái PENDING, ký số bảo mật SHA512 và chuyển hướng thành viên sang trang thanh toán của VNPay Sandbox. Sau khi thành viên hoàn tất nhập thông tin thẻ kiểm thử và OTP, VNPay gửi kết quả phản hồi (IPN callback) về Backend. Backend kiểm tra tính toàn vẹn của chữ ký bảo mật SHA512 phản hồi, nếu trùng khớp sẽ tự động cập nhật giao dịch thành PAID và tạo bản ghi thu (INCOME) vào Sổ quỹ CLB, đồng thời hiển thị thông báo thành công cho thành viên.

#### 3.7.3 Sơ đồ hoạt động nghiệp vụ tuyển dụng và kích hoạt tài khoản thành viên
[Chèn ảnh chụp sơ đồ hoạt động tuyển dụng và onboarding tại đây]

- Mô tả sơ đồ: Sơ đồ này biểu diễn quy trình xử lý đơn ứng tuyển trực tuyến, từ lúc ứng viên nộp hồ sơ, qua vòng phỏng vấn chuyên môn và được Admin duyệt kích hoạt tài khoản hệ thống.
- Các bước xử lý chính: Ứng viên nộp hồ sơ qua trang tuyển dụng. Trưởng ban duyệt hồ sơ và thiết lập lịch phỏng vấn, sau đó tiến hành phỏng vấn và nhập điểm đánh giá. Admin xem kết quả tổng hợp của ứng viên và thực hiện phê duyệt (Approve) hoặc từ chối (Reject). Nếu đồng ý, hệ thống đổi trạng thái đơn thành ACCEPTED, tự động tạo mới tài khoản thành viên trong database, tạo mật khẩu ngẫu nhiên đã mã hóa và tự động gửi email onboarding kèm thông tin đăng nhập cho ứng viên.

#### 3.7.4 Sơ đồ hoạt động nghiệp vụ điểm danh thành viên bằng mã QR động (chống gian lận)
[Chèn ảnh chụp sơ đồ hoạt động điểm danh bằng mã QR động tại đây]

- Mô tả sơ đồ: Biểu diễn quy trình tự động hóa điểm danh cho thành viên CLB khi tham gia các buổi sinh hoạt/tập luyện bằng mã QR động (dynamic QR) xoay vòng 30 giây để ngăn chặn tuyệt đối tình trạng điểm danh hộ (proxy check-in).
- Các bước xử lý chính: Quản lý chọn buổi tập và yêu cầu tạo mã QR. Backend khởi tạo một token JWT ngắn hạn chứa thông tin buổi tập, cài đặt thời gian hết hạn sau 30 giây và ký số bảo mật HS512. Frontend hiển thị mã QR động này lên màn hình lớn. Thành viên mở ứng dụng trên điện thoại di động và thực hiện quét mã QR. Ứng dụng gửi token này lên máy chủ Backend qua API check-in. Backend thực hiện giải mã JWT và xác thực chữ ký token. Nếu token hợp lệ và chưa hết hạn, hệ thống tự động ghi nhận trạng thái điểm danh là PRESENT cho thành viên đó và lưu vào cơ sở dữ liệu. Nếu token đã hết hạn hoặc không hợp lệ, hệ thống báo lỗi và yêu cầu thành viên quét lại mã QR mới vừa được reset.

### 3.8. Thiết kế Sơ đồ lớp (Class Diagram)
Hệ thống Rin_UniOps được xây dựng trên ngôn ngữ lập trình hướng đối tượng Java (Spring Boot). Cấu trúc các thực thể dữ liệu và mối quan hệ giữa chúng trong mã nguồn được thiết kế thông qua 2 sơ đồ lớp:

#### 3.8.1 Sơ đồ lớp phân hệ Nhân sự và Lịch trình
[Chèn ảnh chụp sơ đồ lớp Nhân sự và Lịch trình tại đây]

- Mô tả sơ đồ: Sơ đồ lớp này biểu diễn cấu trúc tổ chức và lịch trình hoạt động cốt lõi của câu lạc bộ. Các lớp thực thể bao gồm User (Thành viên), Department (Ban ngành), Team (Đội nhóm), TeamMember (Liên kết thành viên vào đội), Schedule (Lịch tuần) và ScheduleSlot (Chi tiết ca tập/họp).
- Quan hệ chính: Lớp User có mối quan hệ Many-to-One với Department. Team thuộc về Department. Để hỗ trợ một thành viên có thể tham gia nhiều đội nhóm, lớp trung gian TeamMember được thiết kế để liên kết giữa User và Team. Thực thể Schedule có quan hệ One-to-Many với các ScheduleSlot chi tiết và được tạo bởi một User có vai trò Admin hoặc Manager.

#### 3.8.2 Sơ đồ lớp các phân hệ nghiệp vụ nâng cao
[Chèn ảnh chụp sơ đồ lớp các phân hệ nghiệp vụ nâng cao tại đây]

- Mô tả sơ đồ: Sơ đồ lớp này tập trung biểu diễn các thực thể phục vụ 5 phân hệ tính năng nâng cao bao gồm: Tài chính (ClubFundTransaction, BudgetRequest), Mượn trả kho (InventoryItem, BorrowRequest), Khảo sát biểu quyết (Poll, PollOption, PollVote), Sự kiện & Vé (Event, EventTicket).
- Quan hệ chính: Một cuộc biểu quyết (Poll) chứa nhiều lựa chọn (PollOption). Thực thể PollVote ghi nhận lượt bình chọn liên kết giữa User, Poll và PollOption được chọn. Phiếu mượn đồ (BorrowRequest) liên kết một User với InventoryItem tương ứng trong kho. Các giao dịch dòng tiền (ClubFundTransaction) và đề xuất ngân sách (BudgetRequest) được theo dõi chặt chẽ và liên kết với User thực hiện. Khách ngoài đăng ký vé (EventTicket) sẽ được quản lý và liên kết với sự kiện (Event) tương ứng.

---

## CHƯƠNG 4: XÂY DỰNG GIAO DIỆN HỆ THỐNG

### 4.1. Phân hệ Giao diện chung (Công khai & Đăng nhập)

#### 4.1.1 Giao diện Đăng nhập (Login)
[Chèn ảnh chụp giao diện Đăng nhập tại đây]

- Mô tả giao diện: Trang đăng nhập được thiết kế theo phong cách tối giản công nghệ, sử dụng nền tối (Dark Theme) làm chủ đạo kết hợp hiệu ứng kính mờ (Glassmorphism) trên thẻ đăng nhập chính, tạo cảm giác hiện đại và bảo mật.
- Hướng dẫn chụp ảnh minh chứng: Chạy dự án Frontend (npm run dev), truy cập đường dẫn /login, nhập thử một tài khoản mẫu và chụp màn hình toàn bộ trang đăng nhập trên trình duyệt.

#### 4.1.2 Giao diện Đăng ký Tuyển dụng (/apply)
[Chèn ảnh chụp giao diện Đăng ký Tuyển dụng tại đây]

- Mô tả giao diện: Biểu mẫu điền đơn ứng tuyển được thiết kế chia bước (Step-by-step) trực quan. Cho phép ứng viên điền thông tin cá nhân, đính kèm link CV, chọn ban chuyên môn nguyện vọng và gửi đơn trực tuyến.
- Hướng dẫn chụp ảnh minh chứng: Truy cập đường dẫn /apply trên trình duyệt ở chế độ công khai (chưa đăng nhập), điền các thông tin thử nghiệm để form hiển thị đầy đủ trạng thái và thực hiện chụp màn hình.

#### 4.1.3 Giao diện Đăng ký Vé sự kiện công khai (/public/events/:id)
[Chèn ảnh chụp giao diện Đăng ký Vé tại đây]

- Mô tả giao diện: Trang chi tiết sự kiện dành cho công chúng, hiển thị các thông tin giới thiệu về sự kiện (liveshow, workshop...) của CLB và tích hợp biểu mẫu đăng ký nhận vé điện tử. Sau khi đăng ký, giao diện hiển thị thông báo thành công kèm mã QR Code chứa mã vé UUID độc nhất.
- Hướng dẫn chụp ảnh minh chứng: Truy cập đường dẫn /public/events/1 (hoặc ID sự kiện bất kỳ), điền thông tin email để nhận vé, nhấn Đăng ký để hệ thống tạo vé thành công và hiển thị mã QR Code trên màn hình, sau đó chụp lại giao diện này.

---

### 4.2. Phân hệ Giao diện Quản trị viên (Admin & Manager Dashboards)

#### 4.2.1 Giao diện Bảng điều khiển của Chủ nhiệm (Admin Dashboard)
[Chèn ảnh chụp giao diện Bảng điều khiển Admin tại đây]

- Mô tả giao diện: Thiết kế theo dạng Bento Grid nền tối chuyên nghiệp (Bloomberg-style). Hiển thị trực quan các thẻ chỉ số tổng thể của CLB (tổng số lượng thành viên, số dư quỹ, số lượng thiết bị đang mượn...) và tích hợp các biểu đồ phân tích dữ liệu chuyên cần, biểu đồ tròn phân tích xếp loại đánh giá KPI cuối tháng của toàn CLB.
- Hướng dẫn chụp ảnh minh chứng: Đăng nhập bằng tài khoản Chủ nhiệm (Admin), truy cập trang chủ Dashboard và chụp màn hình giao diện Bento Grid hiển thị đầy đủ các biểu đồ thống kê trực quan.

#### 4.2.2 Giao diện Bảng điều khiển của Trưởng ban (Manager Dashboard)
[Chèn ảnh chụp giao diện Bảng điều khiển Manager tại đây]

- Mô tả giao diện: Bảng điều khiển dành riêng cho các trưởng ban chuyên môn, hiển thị các thông số hoạt động và công việc trong phạm vi ban phụ trách, cùng các liên kết nhanh để quản lý thành viên, chấm điểm và duyệt yêu cầu.
- Hướng dẫn chụp ảnh minh chứng: Đăng nhập bằng tài khoản Trưởng ban (Manager), truy cập trang chủ Dashboard và chụp màn hình giao diện bảng điều khiển đặc thù của ban chuyên môn đó.

#### 4.2.3 Giao diện Quản lý Tuyển dụng & Duyệt hồ sơ (/recruitment)
[Chèn ảnh chụp giao diện Quản lý Tuyển dụng tại đây]

- Mô tả giao diện: Trang quản lý hồ sơ ứng viên dành cho Admin/Manager. Hiển thị danh sách các đơn ứng tuyển dưới dạng bảng (Table), tích hợp bộ lọc theo ban chuyên môn và trạng thái. Cho phép quản lý nhấp vào đơn để chấm điểm phỏng vấn, viết nhận xét và nhấp Phê duyệt (Approve) để kích hoạt tài khoản thành viên tự động.
- Hướng dẫn chụp ảnh minh chứng: Truy cập menu Quản lý Tuyển dụng (/recruitment), mở một bản ghi ứng viên để hiện popup chấm điểm và duyệt đơn, sau đó chụp màn hình.

#### 4.2.4 Giao diện Trợ lý phân công nhân sự thông minh AI (/ai-assistant)
[Chèn ảnh chụp giao diện Trợ lý AI tại đây]

- Mô tả giao diện: Tích hợp trợ lý AI thông minh kết nối với mô hình Google Gemini AI. Quản lý nhập mô tả yêu cầu công việc cho sự kiện, AI sẽ tự động phân tích dữ liệu chuyên cần, KPI lịch sử của thành viên trong database để đề xuất ra danh sách nhân sự tối ưu nhất kèm theo lý do chi tiết.
- Hướng dẫn chụp ảnh minh chứng: Truy cập trang Trợ lý AI (/ai-assistant), nhập một yêu cầu phân công (ví dụ: Cần tìm 3 nhân sự hỗ trợ ban hậu cần sự kiện âm nhạc), nhấn Gửi để Gemini trả về kết quả gợi ý trực quan, sau đó chụp màn hình.

---

### 4.3. Phân hệ Giao diện Thành viên (Member Dashboard & Interactions)

#### 4.3.1 Giao diện Bảng điều khiển của Thành viên (Member Dashboard)
[Chèn ảnh chụp giao diện Bảng điều khiển Thành viên tại đây]

- Mô tả giao diện: Thiết kế theo phong cách giao diện cá nhân hóa sáng màu (Pastel Light Mode). Điểm nhấn là thẻ hoạt động hôm nay kèm nút Check-in một chạm điểm danh nhanh, các thẻ hiển thị chuỗi ngày tham gia liên tục (Streak), thanh hiển thị XP/Level tích lũy và danh sách công việc cá nhân.
- Hướng dẫn chụp ảnh minh chứng: Đăng nhập bằng tài khoản Thành viên (Member), truy cập trang chủ Dashboard ở chế độ Light Mode và chụp màn hình bảng điều khiển cá nhân hóa này.

#### 4.3.2 Giao diện Phòng chat nhóm nội bộ thời gian thực (/chat)
[Chèn ảnh chụp giao diện Phòng chat tại đây]

- Mô tả giao diện: Tích hợp phòng chat nhóm WebSocket cho phép thành viên giao tiếp thời gian thực. Cột bên trái hiển thị danh sách các phòng chat của ban/đội nhóm mà thành viên trực thuộc, cột bên phải là khung chat hiển thị tin nhắn thời gian thực và danh sách thành viên đang trực tuyến.
- Hướng dẫn chụp ảnh minh chứng: Truy cập đường dẫn /chat, gửi thử một vài tin nhắn giao tiếp trong nhóm chat ban/đội để hiển thị hội thoại động và chụp lại màn hình.

#### 4.3.3 Giao diện Bảng công việc Kanban (/tasks)
[Chèn ảnh chụp giao diện Bảng công việc tại đây]

- Mô tả giao diện: Bảng quản lý công việc thiết kế theo dạng thẻ Kanban với 4 cột trạng thái: To-do, In-progress, Review và Done. Cho phép thành viên theo dõi nhiệm vụ cá nhân và cập nhật tiến độ công việc trực quan bằng thao tác kéo thả.
- Hướng dẫn chụp ảnh minh chứng: Truy cập đường dẫn /tasks, thực hiện kéo thả một thẻ công việc hoặc click mở chi tiết một task để hiện popup cập nhật tiến độ, sau đó chụp lại màn hình.

#### 4.3.4 Giao diện Thời khóa biểu & Lịch hoạt động tuần (/schedule)
[Chèn ảnh chụp giao diện Lịch tuần tại đây]

- Mô tả giao diện: Hiển thị thời khóa biểu hoạt động, tập luyện hàng tuần dưới dạng bảng lịch biểu 7 ngày trực quan, phân biệt các loại ca hoạt động bằng mã màu sắc sinh động (Lịch tập, Lịch họp, Lịch biểu diễn).
- Hướng dẫn chụp ảnh minh chứng: Truy cập đường dẫn /schedule, chọn xem lịch biểu của tuần hiện tại có chứa các ca hoạt động và thực hiện chụp màn hình.

#### 4.3.5 Giao diện Đóng hội phí & Tài chính (/finance)
[Chèn ảnh chụp giao diện Đóng hội phí tại đây]

- Mô tả giao diện: Thành viên xem lịch sử đóng hội phí của bản thân. Tích hợp nút Đóng quỹ trực tuyến, khi click sẽ tạo liên kết và điều hướng thành viên sang cổng thanh toán trực tuyến VNPay Sandbox.
- Hướng dẫn chụp ảnh minh chứng: Đăng nhập tài khoản Member, truy cập trang Tài chính (/finance), click chọn đợt đóng quỹ để mở biểu mẫu xác nhận thanh toán trước khi chuyển sang VNPay, thực hiện chụp màn hình.

#### 4.3.6 Giao diện Kho thiết bị & Đăng ký Mượn đồ (/inventory)
[Chèn ảnh chụp giao diện Kho thiết bị tại đây]

- Mô tả giao diện: Catalog danh mục các thiết bị, đạo cụ hiện có của CLB kèm số lượng sẵn có trong kho. Thành viên chọn thiết bị và click Đăng ký mượn để hiện form điền số lượng, ngày mượn/trả và mục đích sử dụng.
- Hướng dẫn chụp ảnh minh chứng: Truy cập đường dẫn /inventory, click chọn mượn một thiết bị (ví dụ: Loa kéo hoặc Trang phục biểu diễn) để hiển thị form đăng ký mượn, sau đó chụp màn hình.

#### 4.3.7 Giao diện Khảo sát & Biểu quyết ý kiến (/polls)
[Chèn ảnh chụp giao diện Bình chọn tại đây]

- Mô tả giao diện: Hiển thị danh sách các cuộc bình chọn ý kiến nội bộ CLB. Khi thành viên click bình chọn, kết quả phần trăm tỷ lệ phiếu bầu của các phương án lập tức được cập nhật trực quan bằng các thanh tiến trình (Progress Bar) nhiều màu sắc qua WebSocket.
- Hướng dẫn chụp ảnh minh chứng: Truy cập đường dẫn /polls, thực hiện click chọn một phương án bình chọn để hệ thống gửi vote thành công và hiển thị các thanh tỷ lệ phần trăm kết quả biểu quyết trực quan, thực hiện chụp màn hình.

#### 4.3.8 Giao diện Thư mục Tài nguyên dùng chung (/resources)
[Chèn ảnh chụp giao diện Thư mục tài nguyên tại đây]

- Mô tả giao diện: Kho lưu trữ tài liệu, quy chế, hình ảnh và liên kết dùng chung của CLB dưới dạng các thư mục (folders) chia theo danh mục (Bylaws, Design Assets, Training Videos...), hỗ trợ tải xuống nhanh chóng.
- Hướng dẫn chụp ảnh minh chứng: Truy cập đường dẫn /resources, mở một danh mục tài liệu để hiển thị danh sách các tệp tin và liên kết đính kèm, thực hiện chụp màn hình.

---

## CHƯƠNG 5: KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN

### 5.1. Kết quả đạt được

Trải qua quá trình nghiên cứu lý thuyết và thực thi xây dựng đồ án Chuyên đề 1: Java Web với đề tài Rin_UniOps, em đã hoàn thành các mục tiêu đề ra ban đầu, đạt được nhiều kết quả quan trọng về cả mặt nhận thức khoa học lẫn thực tiễn ứng dụng.

#### 5.1.1. Về mặt lý thuyết và công nghệ

Hệ thống đã xây dựng được một nền tảng kiến thức vững chắc thông qua các nội dung nghiên cứu sau:
- Nghiên cứu và làm chủ kiến trúc hệ thống Client-Server phân tầng, phương pháp tổ chức mã nguồn độc lập giữa giao diện người dùng ReactJS và dịch vụ nghiệp vụ Spring Boot 3.
- Tiếp cận và hiện thực hóa thành công cơ chế bảo mật phân quyền đa cấp độ thông qua cấu hình Spring Security kết hợp mã xác thực JWT không lưu trạng thái (stateless), đảm bảo an toàn thông tin truy cập.
- Tìm hiểu sâu sắc và tối ưu hóa luồng giao tiếp thời gian thực WebSockets bằng việc áp dụng giao thức STOMP, làm nền tảng cho việc truyền tải thông tin tức thời mà không cần tải lại trang.
- Nghiên cứu cơ chế tích hợp dịch vụ nâng cao từ bên thứ ba bao gồm kết nối thanh toán trực tuyến qua cổng VNPay Sandbox và tương tác xử lý ngôn ngữ tự nhiên thông qua API Google Gemini AI.

#### 5.1.2. Về mặt ứng dụng thực tiễn

Trên phương diện vận hành và sử dụng thực tế, đồ án đã giải quyết được các bài toán sau:
- Xây dựng hoàn chỉnh hệ sinh thái web Rin_UniOps với cấu trúc Dual UX độc đáo, cung cấp giao diện Bento Grid tối giản với chế độ tối (dark mode) dành cho Ban quản trị và giao diện Story Dashboard trực quan với chế độ sáng (light mode) dành cho Thành viên câu lạc bộ.
- Triển khai thành công 6 phân hệ chức năng nâng cao bao gồm: tuyển dụng và tự động tạo tài khoản thành viên, quản lý tài chính hỗ trợ đóng quỹ trực tuyến qua VNPay, quản lý kho thiết bị với quy trình duyệt mượn trả minh bạch, chia sẻ kho tài nguyên dùng chung, hệ thống khảo sát bình chọn cập nhật kết quả thời gian thực qua WebSocket, và cơ chế soát vé sự kiện tự động bằng mã QR xoay vòng bảo mật.
- Tích hợp mô hình trí tuệ nhân tạo Gemini AI (phiên bản gemini-2.5-flash) làm trợ lý ảo hỗ trợ Ban chủ nhiệm phân tích hồ sơ ứng viên và tự động đề xuất phân chia công việc tối ưu nhất dựa trên mô tả năng lực cá nhân.
- Góp phần số hóa quy trình quản lý hành chính nội bộ của câu lạc bộ, nâng cao tính minh bạch tài chính, lưu trữ thiết bị khoa học và thúc đẩy sự tương tác gắn kết giữa các thành viên.

### 5.2. Các mặt hạn chế còn tồn tại

Mặc dù hệ thống đã hoạt động ổn định và đáp ứng cơ bản các yêu cầu đặt ra, Rin_UniOps vẫn tồn tại một số hạn chế kỹ thuật và trải nghiệm người dùng cần tiếp tục khắc phục:
- Kênh giao tiếp thời gian thực hiện tại mới chỉ hỗ trợ nhắn tin văn bản nội bộ, chưa tích hợp được công nghệ truyền thông đa phương tiện để hỗ trợ cuộc gọi thoại hoặc gọi video trực tuyến giữa các thành viên.
- Phân hệ soát vé sự kiện công khai và điểm danh bằng mã QR động phụ thuộc nhiều vào chất lượng camera cũng như hiệu năng phần cứng của thiết bị di động mà người soát vé sử dụng. Trong môi trường thiếu sáng hoặc trên các thiết bị đời cũ, tốc độ nhận diện mã QR có thể bị ảnh hưởng.
- Hệ thống thông báo trực tiếp chỉ hoạt động khi người dùng đang mở trình duyệt web (Web Push Notification), chưa hỗ trợ cơ chế gửi thông báo đẩy ngoại tuyến (Offline Push Notification) hoặc liên kết gửi tin nhắn tự động qua SMS hay Zalo để nhắc nhở các lịch họp đột xuất.

### 5.3. Đề xuất các ý tưởng mới (Sáng kiến sản phẩm)

Để nâng cao hiệu quả hoạt động và tăng cường trải nghiệm người dùng trên hệ thống Rin_UniOps, em đề xuất một số sáng kiến sản phẩm sáng tạo như sau:
- Game hóa (Gamification) hoạt động câu lạc bộ: Tích hợp hệ thống điểm thưởng tích lũy khi thành viên hoàn thành công việc đúng hạn hoặc đạt điểm chuyên cần cao. Điểm thưởng này có thể quy đổi sang các phần quà nhỏ từ quỹ câu lạc bộ hoặc hiển thị bảng xếp hạng thành viên xuất sắc theo tuần/tháng.
- Hệ thống thi trắc nghiệm đầu vào tự động: Trong cổng tuyển dụng thành viên mới, bổ sung phân hệ thi trắc nghiệm năng lực trực tuyến (ví dụ: các câu hỏi về kiến thức chuyên môn của ban truyền thông, ban sự kiện hoặc ban kỹ thuật) được chấm điểm tự động để sàng lọc hồ sơ ứng viên nhanh chóng trước khi bước vào vòng phỏng vấn trực tiếp.
- Kiểm kê kho thiết bị bằng nhãn dán mã QR: Tạo và in các mã QR định danh cho từng đạo cụ, trang thiết bị vật lý của câu lạc bộ. Khi thành viên mượn hoặc trả đồ, người quản lý kho chỉ cần dùng camera quét mã QR dán trên sản phẩm để xác nhận trạng thái mượn trả thay vì nhập tên thủ công trên ứng dụng.

### 5.4. Hướng phát triển công nghệ của hệ thống

Trên cơ sở khắc phục các hạn chế hiện có và đón đầu các xu hướng công nghệ mới, hệ thống sẽ tập trung nâng cấp theo các hướng sau:
- 5.4.1. Tích hợp nền tảng họp trực tuyến từ xa (WebRTC): Nghiên cứu và tích hợp giao thức truyền phát WebRTC trực tiếp vào phân hệ chat nhóm để hỗ trợ tổ chức các cuộc họp trực tuyến chất lượng cao, gọi thoại hoặc gọi video trực tiếp ngay trên trình duyệt mà không cần sử dụng các công cụ phụ trợ bên ngoài.
- 5.4.2. Ứng dụng Trí tuệ Nhân tạo chuyên sâu (AI/ML): Nâng cấp phân hệ AI để tự động phân tích sâu các chỉ số chuyên cần, tần suất hoạt động, và hiệu quả công việc của thành viên nhằm dự báo sớm nguy cơ giảm tương tác hoặc rời nhóm của thành viên, từ đó đưa ra đề xuất điều phối nhân lực và hỗ trợ kịp thời cho Ban chủ nhiệm.
- 5.4.3. Phát triển ứng dụng di động đa nền tảng (React Native): Xây dựng ứng dụng di động tương thích cho cả hai nền tảng Android và iOS để tối ưu hóa tính năng quét mã QR check-in, đồng thời tận dụng cơ chế gửi thông báo đẩy trực tiếp đến điện thoại của thành viên ở bất kỳ thời điểm nào.
- 5.4.4. Tối ưu hóa quy trình thanh toán và cổng dịch vụ: Nghiên cứu kết nối thêm phương thức tạo mã thanh toán VietQR động cho từng giao dịch đóng quỹ câu lạc bộ, cho phép hệ thống tự động kiểm tra biến động số dư qua API ngân hàng và gạch nợ tự động trong thời gian thực mà không cần xác nhận thủ công từ thủ quỹ.
- 5.4.5. Nâng cấp kiến trúc phần mềm và triển khai đám mây (Multi-tenant SaaS): Tái cấu trúc hệ thống sang mô hình kiến trúc SaaS đa người thuê (Multi-tenant) để hệ thống có thể mở rộng cung cấp dịch vụ quản lý cho nhiều câu lạc bộ, tổ chức hoặc đội nhóm khác nhau đăng ký và hoạt động độc lập trên cùng một nền tảng hạ tầng đám mây dùng chung.

---

## TÀI LIỆU THAM KHẢO

1. Spring Boot Documentation. Truy cập tại: https://spring.io/projects/spring-boot
Tài liệu chính thức từ Spring team, cung cấp các hướng dẫn xây dựng dịch vụ web RESTful API, cấu hình bảo mật phân quyền với Spring Security, và kết nối cơ sở dữ liệu JPA/Hibernate cho tầng lưu trữ.

2. ReactJS Documentation. Truy cập tại: https://react.dev/reference/react
Tài liệu chính thức từ Meta, hướng dẫn xây dựng giao diện người dùng dựa trên thành phần (component-based), quản lý trạng thái (state management), và tối ưu hóa hiệu năng render cho ứng dụng Single Page Application.

3. WebSockets and STOMP Protocol. Truy cập tại: https://spring.io/guides/gs/messaging-stomp-websocket
Tài liệu hướng dẫn từ Spring, cung cấp giải pháp thiết lập kênh truyền thông điệp hai chiều thời gian thực (WebSocket) kết hợp giao thức STOMP để xây dựng các tính năng chat nhóm và cập nhật biểu quyết trực tiếp.

4. VNPay Developer Portal. Truy cập tại: https://sandbox.vnpayment.vn/apis/docs
Tài liệu kỹ thuật tích hợp cổng thanh toán trực tuyến VNPay Sandbox, hướng dẫn quy trình tạo mã thanh toán, mã hóa chữ ký số bảo mật, và xử lý phản hồi giao dịch tự động qua IPN.

5. Google Gemini AI API Documentation. Truy cập tại: https://ai.google.dev/gemini-api/docs
Tài liệu hướng dẫn tích hợp mô hình ngôn ngữ lớn Gemini AI, cung cấp các hướng dẫn xây dựng prompt, gọi API xử lý văn bản, và tối ưu hóa trợ lý phân công nhân sự thông minh.

6. Vite Tooling Guide. Truy cập tại: https://vite.dev/guide
Tài liệu hướng dẫn sử dụng công cụ build Vite hỗ trợ khởi tạo dự án ReactJS nhanh chóng, quản lý môi trường phát triển cục bộ và tối ưu hóa mã nguồn khi đóng gói sản phẩm.

7. MySQL Reference Manual. Truy cập tại: https://dev.mysql.com/doc
Tài liệu đặc tả hệ quản trị cơ sở dữ liệu quan hệ MySQL, hướng dẫn thiết kế bảng, quản lý khóa ngoại, thiết lập các chỉ mục (indexes) và tối ưu hóa các câu lệnh truy vấn SQL.


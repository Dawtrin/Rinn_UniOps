# CLUB MANAGEMENT SYSTEM — PROJECT SPECIFICATION
> **Dành cho AI/Developer đọc và implement toàn bộ dự án**
> Stack: **Spring Boot + MySQL + Java Web (JSP/Thymeleaf)**
> Mục đích: Quản lý sự kiện, nhân sự, công việc và đánh giá hiệu suất cho Câu lạc bộ nghệ thuật/sự kiện

---

## 1. TỔNG QUAN DỰ ÁN

### 1.1 Bối cảnh
Hệ thống được xây dựng để số hóa việc quản lý một câu lạc bộ nghệ thuật/nhảy (ví dụ: CLB Nhảy Xung Kích). Các vấn đề cần giải quyết:
- Quản lý nhân sự đông, chia nhiều ban chuyên môn
- Lịch trình biến động liên tục (tập luyện, tổng duyệt, biểu diễn)
- Theo dõi tiến độ công việc theo từng sự kiện
- Đánh giá hiệu suất thành viên định kỳ hàng tháng
- Thay thế quản lý thủ công qua Messenger/Zalo

### 1.2 Tech Stack
| Layer | Technology |
|-------|-----------|
| Backend | Spring Boot 3.x |
| Database | MySQL 8.x (local: Laragon) |
| Frontend | JSP / Thymeleaf + Bootstrap 5 |
| Security | Spring Security + JWT |
| Real-time | WebSocket (STOMP + SockJS) |
| Build tool | Maven |
| Java version | Java 17+ |

### 1.3 Roles & Quyền hạn
| Role | Mô tả |
|------|-------|
| `ADMIN` | Chủ nhiệm CLB — quản lý tổng thể, xem báo cáo toàn CLB, phê duyệt sự kiện lớn |
| `MANAGER` | Trưởng/Phó ban — tạo sự kiện, giao task, chấm điểm đánh giá thành viên ban mình |
| `MEMBER` | Thành viên — xem lịch, check-in/out, nhận task, nộp tự đánh giá |

---

## 2. DATABASE SCHEMA (MySQL)

> **Quy ước đặt tên:** snake_case, PK luôn là `id BIGINT AUTO_INCREMENT`, timestamps dùng `DATETIME DEFAULT CURRENT_TIMESTAMP`

### 2.1 Bảng `departments` — Ban/Bộ phận
```sql
CREATE TABLE departments (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,           -- "Ban Chuyên môn", "Ban Truyền thông"
    description TEXT,
    manager_id  BIGINT,                          -- FK → users (Trưởng ban hiện tại)
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2.2 Bảng `users` — Tài khoản người dùng
```sql
CREATE TABLE users (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    phone           VARCHAR(20),
    avatar_url      VARCHAR(500),
    role            ENUM('ADMIN','MANAGER','MEMBER') NOT NULL DEFAULT 'MEMBER',
    department_id   BIGINT,                      -- FK → departments
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- Sau khi tạo bảng users, thêm FK cho departments.manager_id
ALTER TABLE departments
    ADD CONSTRAINT fk_dept_manager FOREIGN KEY (manager_id) REFERENCES users(id);
```

### 2.3 Bảng `events` — Sự kiện
```sql
CREATE TABLE events (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,       -- "Biểu diễn Khai mạc Festival"
    description     TEXT,
    location        VARCHAR(255),
    start_time      DATETIME NOT NULL,
    end_time        DATETIME NOT NULL,
    status          ENUM('DRAFT','PLANNING','APPROVED','ONGOING','COMPLETED') NOT NULL DEFAULT 'DRAFT',
    department_id   BIGINT NOT NULL,             -- FK → departments
    created_by      BIGINT NOT NULL,             -- FK → users (Manager tạo)
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

**Luồng trạng thái Event:**
```
DRAFT → PLANNING → APPROVED → ONGOING → COMPLETED
```
- `DRAFT`: Manager vừa tạo, chưa công bố
- `PLANNING`: Đang lên kế hoạch, có thể chỉnh sửa
- `APPROVED`: Admin/Manager cấp cao đã duyệt
- `ONGOING`: Đang diễn ra
- `COMPLETED`: Đã hoàn thành

### 2.4 Bảng `event_sessions` — Buổi tập/Buổi diễn con
```sql
CREATE TABLE event_sessions (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_id     BIGINT NOT NULL,               -- FK → events
    title        VARCHAR(255) NOT NULL,          -- "Buổi tập 1", "Tổng duyệt", "Biểu diễn chính thức"
    session_date DATE NOT NULL,
    start_time   TIME NOT NULL,
    end_time     TIME NOT NULL,
    location     VARCHAR(255),
    type         ENUM('PRACTICE','REHEARSAL','PERFORMANCE') NOT NULL DEFAULT 'PRACTICE',
    notes        TEXT,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);
```

### 2.5 Bảng `attendances` — Điểm danh
```sql
CREATE TABLE attendances (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id      BIGINT NOT NULL,            -- FK → event_sessions
    user_id         BIGINT NOT NULL,            -- FK → users
    check_in_time   DATETIME,
    check_out_time  DATETIME,
    status          ENUM('PRESENT','ABSENT','LATE','EXCUSED') NOT NULL DEFAULT 'ABSENT',
    note            VARCHAR(500),               -- Lý do vắng, muộn...
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_attendance (session_id, user_id),
    FOREIGN KEY (session_id) REFERENCES event_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 2.6 Bảng `tasks` — Công việc
```sql
CREATE TABLE tasks (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_id        BIGINT NOT NULL,            -- FK → events
    title           VARCHAR(255) NOT NULL,       -- "Biên bài nhảy", "Chuẩn bị trang phục"
    description     TEXT,
    deadline        DATETIME NOT NULL,
    status          ENUM('TODO','IN_PROGRESS','REVIEW','DONE','REJECTED') NOT NULL DEFAULT 'TODO',
    priority        ENUM('LOW','MEDIUM','HIGH') NOT NULL DEFAULT 'MEDIUM',
    assigned_by     BIGINT NOT NULL,            -- FK → users (Manager giao)
    reject_reason   TEXT,                       -- Lý do từ chối (khi status = REJECTED)
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id)
);
```

**Luồng trạng thái Task:**
```
TODO → IN_PROGRESS → REVIEW → DONE
                  ↑        ↓
                  └← REJECTED ←┘
```

### 2.7 Bảng `task_assignees` — Task được giao cho ai
```sql
CREATE TABLE task_assignees (
    id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    task_id  BIGINT NOT NULL,                  -- FK → tasks
    user_id  BIGINT NOT NULL,                  -- FK → users
    UNIQUE KEY uq_task_user (task_id, user_id),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 2.8 Bảng `self_evaluations` — Tự đánh giá của Member
```sql
CREATE TABLE self_evaluations (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL,            -- FK → users
    eval_month      VARCHAR(7) NOT NULL,        -- Format: "2025-06"
    content         TEXT NOT NULL,              -- Nội dung tự đánh giá
    achievements    TEXT,                       -- Điểm làm tốt trong tháng
    improvements    TEXT,                       -- Điểm cần cải thiện
    status          ENUM('DRAFT','SUBMITTED') NOT NULL DEFAULT 'DRAFT',
    submitted_at    DATETIME,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_month (user_id, eval_month),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 2.9 Bảng `manager_evaluations` — Đánh giá từ Manager
```sql
CREATE TABLE manager_evaluations (
    id                   BIGINT AUTO_INCREMENT PRIMARY KEY,
    self_evaluation_id   BIGINT NOT NULL UNIQUE, -- FK → self_evaluations (1-1)
    manager_id           BIGINT NOT NULL,         -- FK → users
    score                INT NOT NULL,            -- 0-100
    grade                ENUM('EXCELLENT','GOOD','PASS','FAIL') NOT NULL,
    comment              TEXT,
    evaluated_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (self_evaluation_id) REFERENCES self_evaluations(id),
    FOREIGN KEY (manager_id) REFERENCES users(id)
);
```

**Quy đổi điểm → xếp loại (gợi ý):**
| Điểm | Xếp loại |
|------|---------|
| 90–100 | EXCELLENT (Xuất sắc) |
| 75–89 | GOOD (Tốt) |
| 50–74 | PASS (Đạt) |
| 0–49 | FAIL (Không đạt) |

### 2.10 Bảng `notifications` — Thông báo
```sql
CREATE TABLE notifications (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL,            -- FK → users (người nhận)
    type            ENUM('NEW_EVENT','EVENT_UPDATED','TASK_ASSIGNED','TASK_REJECTED','EVALUATION_DONE') NOT NULL,
    title           VARCHAR(255) NOT NULL,
    message         TEXT NOT NULL,
    reference_id    BIGINT,                     -- ID của event/task/evaluation liên quan
    reference_type  VARCHAR(50),                -- "EVENT", "TASK", "EVALUATION"
    is_read         BOOLEAN DEFAULT FALSE,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 3. JPA ENTITY CLASSES (Spring Boot)

> **Package structure:** `com.clubmanagement`

### 3.1 Entity `User`
```java
@Entity
@Table(name = "users")
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    private String phone;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;  // ADMIN, MANAGER, MEMBER

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // enum Role nằm trong cùng file hoặc file riêng
    public enum Role { ADMIN, MANAGER, MEMBER }
}
```

### 3.2 Entity `Event`
```java
@Entity
@Table(name = "events")
public class Event {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String description;
    private String location;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventStatus status = EventStatus.DRAFT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EventSession> sessions = new ArrayList<>();

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Task> tasks = new ArrayList<>();

    // timestamps...

    public enum EventStatus { DRAFT, PLANNING, APPROVED, ONGOING, COMPLETED }
}
```

### 3.3 Entity `Task`
```java
@Entity
@Table(name = "tasks")
public class Task {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(nullable = false)
    private String title;

    private String description;

    @Column(nullable = false)
    private LocalDateTime deadline;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskStatus status = TaskStatus.TODO;

    @Enumerated(EnumType.STRING)
    private Priority priority = Priority.MEDIUM;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by", nullable = false)
    private User assignedBy;

    @Column(name = "reject_reason")
    private String rejectReason;

    @ManyToMany
    @JoinTable(
        name = "task_assignees",
        joinColumns = @JoinColumn(name = "task_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private List<User> assignees = new ArrayList<>();

    // timestamps...

    public enum TaskStatus { TODO, IN_PROGRESS, REVIEW, DONE, REJECTED }
    public enum Priority { LOW, MEDIUM, HIGH }
}
```

---

## 4. API ENDPOINTS (Spring Boot REST)

> **Base URL:** `/api`
> **Auth header:** `Authorization: Bearer <JWT_TOKEN>`

### 4.1 Authentication
| Method | Endpoint | Role | Mô tả |
|--------|----------|------|-------|
| POST | `/api/auth/login` | Public | Đăng nhập, trả về JWT |
| POST | `/api/auth/logout` | Any | Đăng xuất |
| GET | `/api/auth/me` | Any | Lấy thông tin user hiện tại |

**Request Login:**
```json
{
  "email": "manager@club.com",
  "password": "password123"
}
```
**Response Login:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "fullName": "Nguyễn Văn A",
    "role": "MANAGER",
    "department": "Ban Chuyên môn"
  }
}
```

---

### 4.2 Users
| Method | Endpoint | Role | Mô tả |
|--------|----------|------|-------|
| GET | `/api/users` | ADMIN, MANAGER | Danh sách tất cả users (filter: role, department, isActive) |
| GET | `/api/users/{id}` | Any | Chi tiết 1 user |
| POST | `/api/users` | ADMIN | Tạo tài khoản mới |
| PUT | `/api/users/{id}` | ADMIN, self | Cập nhật thông tin |
| DELETE | `/api/users/{id}` | ADMIN | Vô hiệu hóa tài khoản (set isActive = false) |

---

### 4.3 Departments
| Method | Endpoint | Role | Mô tả |
|--------|----------|------|-------|
| GET | `/api/departments` | Any | Danh sách tất cả ban |
| GET | `/api/departments/{id}` | Any | Chi tiết 1 ban |
| GET | `/api/departments/{id}/members` | ADMIN, MANAGER | DS thành viên của ban |
| POST | `/api/departments` | ADMIN | Tạo ban mới |
| PUT | `/api/departments/{id}` | ADMIN | Cập nhật ban |

---

### 4.4 Events
| Method | Endpoint | Role | Mô tả |
|--------|----------|------|-------|
| GET | `/api/events` | Any | Danh sách sự kiện (filter: status, departmentId, startDate, endDate) |
| GET | `/api/events/{id}` | Any | Chi tiết sự kiện |
| POST | `/api/events` | MANAGER, ADMIN | Tạo sự kiện mới |
| PUT | `/api/events/{id}` | MANAGER (owner), ADMIN | Cập nhật sự kiện |
| PUT | `/api/events/{id}/status` | MANAGER, ADMIN | Chuyển trạng thái sự kiện |
| DELETE | `/api/events/{id}` | ADMIN | Xóa sự kiện (chỉ khi DRAFT) |

**Request tạo Event:**
```json
{
  "title": "Biểu diễn Khai mạc Festival 2025",
  "description": "Biểu diễn khai mạc festival văn hóa trường",
  "location": "Sân khấu chính - Khu A",
  "startTime": "2025-11-15T18:00:00",
  "endTime": "2025-11-15T21:00:00",
  "departmentId": 1
}
```

**Request chuyển trạng thái:**
```json
{
  "status": "PLANNING",
  "note": "Bắt đầu lên kế hoạch chi tiết"
}
```

---

### 4.5 Event Sessions (Buổi tập/diễn)
| Method | Endpoint | Role | Mô tả |
|--------|----------|------|-------|
| GET | `/api/events/{eventId}/sessions` | Any | DS buổi tập của sự kiện |
| POST | `/api/events/{eventId}/sessions` | MANAGER, ADMIN | Tạo buổi tập mới |
| PUT | `/api/sessions/{id}` | MANAGER, ADMIN | Cập nhật buổi tập |
| DELETE | `/api/sessions/{id}` | MANAGER, ADMIN | Xóa buổi tập |

---

### 4.6 Attendance (Điểm danh)
| Method | Endpoint | Role | Mô tả |
|--------|----------|------|-------|
| POST | `/api/sessions/{id}/check-in` | MEMBER | Check-in buổi tập |
| POST | `/api/sessions/{id}/check-out` | MEMBER | Check-out buổi tập |
| GET | `/api/sessions/{id}/attendance` | MANAGER, ADMIN | Xem điểm danh của 1 buổi |
| PUT | `/api/sessions/{sessionId}/attendance/{userId}` | MANAGER, ADMIN | Manager sửa điểm danh thủ công |
| GET | `/api/users/{id}/attendance` | MANAGER, ADMIN, self | Lịch sử điểm danh của 1 user |
| GET | `/api/users/{id}/attendance/stats` | MANAGER, ADMIN | Thống kê % chuyên cần theo tháng |

---

### 4.7 Tasks (Công việc)
| Method | Endpoint | Role | Mô tả |
|--------|----------|------|-------|
| GET | `/api/events/{eventId}/tasks` | Any | DS task của sự kiện |
| POST | `/api/events/{eventId}/tasks` | MANAGER, ADMIN | Tạo task mới |
| GET | `/api/tasks/{id}` | Any | Chi tiết task |
| PUT | `/api/tasks/{id}` | MANAGER (owner) | Cập nhật thông tin task |
| DELETE | `/api/tasks/{id}` | MANAGER (owner), ADMIN | Xóa task |
| PUT | `/api/tasks/{id}/status` | MEMBER (assignee) | Member cập nhật trạng thái |
| PUT | `/api/tasks/{id}/approve` | MANAGER | Duyệt task (REVIEW → DONE) |
| PUT | `/api/tasks/{id}/reject` | MANAGER | Từ chối task (REVIEW → REJECTED) |
| GET | `/api/users/me/tasks` | MEMBER | Xem task được giao cho bản thân |

**Request tạo Task:**
```json
{
  "title": "Biên bài nhảy tiết mục khai mạc",
  "description": "Cần hoàn thành choreo 3 phút theo nhạc đã chọn",
  "deadline": "2025-11-01T23:59:00",
  "priority": "HIGH",
  "assigneeIds": [5, 8, 12]
}
```

**Request từ chối Task:**
```json
{
  "rejectReason": "Choreo chưa đúng theo concept, cần chỉnh lại đoạn bridge"
}
```

---

### 4.8 Self Evaluations (Tự đánh giá)
| Method | Endpoint | Role | Mô tả |
|--------|----------|------|-------|
| GET | `/api/evaluations/me` | MEMBER | Xem tự đánh giá của bản thân (filter: month) |
| POST | `/api/evaluations` | MEMBER | Tạo bản tự đánh giá |
| PUT | `/api/evaluations/{id}` | MEMBER (owner) | Cập nhật (chỉ khi còn DRAFT) |
| PUT | `/api/evaluations/{id}/submit` | MEMBER | Nộp bản đánh giá (DRAFT → SUBMITTED) |
| GET | `/api/manager/evaluations` | MANAGER, ADMIN | DS tự đánh giá cần duyệt (filter: month, departmentId) |
| POST | `/api/manager/evaluations/{id}/review` | MANAGER | Chấm điểm và nhận xét |

**Request tạo Self Evaluation:**
```json
{
  "evalMonth": "2025-10",
  "content": "Trong tháng 10, tôi đã hoàn thành 5/5 task được giao...",
  "achievements": "Hoàn thành choreo đúng deadline, đi tập đầy đủ",
  "improvements": "Cần cải thiện kỹ năng edit nhạc, đến sớm hơn"
}
```

**Request Manager chấm điểm:**
```json
{
  "score": 85,
  "grade": "GOOD",
  "comment": "Thành viên tích cực, hoàn thành tốt các nhiệm vụ. Cần chủ động hơn trong việc hỗ trợ các bạn khác."
}
```

---

### 4.9 Notifications
| Method | Endpoint | Role | Mô tả |
|--------|----------|------|-------|
| GET | `/api/notifications` | Any | Lấy thông báo của user hiện tại (phân trang) |
| GET | `/api/notifications/unread-count` | Any | Số thông báo chưa đọc |
| PUT | `/api/notifications/{id}/read` | Any | Đánh dấu đã đọc |
| PUT | `/api/notifications/read-all` | Any | Đánh dấu tất cả đã đọc |

---

### 4.10 Reports / Dashboard (ADMIN & MANAGER)
| Method | Endpoint | Role | Mô tả |
|--------|----------|------|-------|
| GET | `/api/reports/dashboard` | ADMIN, MANAGER | Tổng quan: tổng event, task, member |
| GET | `/api/reports/department/{id}/performance` | ADMIN, MANAGER | Hiệu suất theo ban (theo tháng) |
| GET | `/api/reports/events/summary` | ADMIN, MANAGER | Tóm tắt các sự kiện |
| GET | `/api/reports/members/attendance` | ADMIN, MANAGER | Bảng xếp hạng chuyên cần |

---

## 5. CẤU TRÚC PROJECT (Spring Boot)

```
src/
├── main/
│   ├── java/com/clubmanagement/
│   │   ├── ClubManagementApplication.java
│   │   ├── config/
│   │   │   ├── SecurityConfig.java          -- Spring Security + JWT
│   │   │   ├── WebSocketConfig.java         -- STOMP WebSocket
│   │   │   └── CorsConfig.java
│   │   ├── controller/
│   │   │   ├── AuthController.java
│   │   │   ├── UserController.java
│   │   │   ├── DepartmentController.java
│   │   │   ├── EventController.java
│   │   │   ├── EventSessionController.java
│   │   │   ├── AttendanceController.java
│   │   │   ├── TaskController.java
│   │   │   ├── EvaluationController.java
│   │   │   ├── NotificationController.java
│   │   │   └── ReportController.java
│   │   ├── service/
│   │   │   ├── AuthService.java
│   │   │   ├── UserService.java
│   │   │   ├── EventService.java
│   │   │   ├── TaskService.java
│   │   │   ├── AttendanceService.java
│   │   │   ├── EvaluationService.java
│   │   │   └── NotificationService.java     -- Gửi thông báo real-time
│   │   ├── repository/
│   │   │   ├── UserRepository.java
│   │   │   ├── DepartmentRepository.java
│   │   │   ├── EventRepository.java
│   │   │   ├── EventSessionRepository.java
│   │   │   ├── AttendanceRepository.java
│   │   │   ├── TaskRepository.java
│   │   │   ├── SelfEvaluationRepository.java
│   │   │   ├── ManagerEvaluationRepository.java
│   │   │   └── NotificationRepository.java
│   │   ├── entity/
│   │   │   ├── User.java
│   │   │   ├── Department.java
│   │   │   ├── Event.java
│   │   │   ├── EventSession.java
│   │   │   ├── Attendance.java
│   │   │   ├── Task.java
│   │   │   ├── SelfEvaluation.java
│   │   │   ├── ManagerEvaluation.java
│   │   │   └── Notification.java
│   │   ├── dto/                             -- Request/Response DTOs
│   │   │   ├── request/
│   │   │   └── response/
│   │   ├── security/
│   │   │   ├── JwtUtil.java
│   │   │   ├── JwtFilter.java
│   │   │   └── UserDetailsServiceImpl.java
│   │   └── exception/
│   │       ├── GlobalExceptionHandler.java
│   │       └── ResourceNotFoundException.java
│   └── resources/
│       ├── application.properties
│       └── db/
│           └── init.sql                     -- Script khởi tạo database
└── test/
```

---

## 6. BUSINESS RULES QUAN TRỌNG

### 6.1 Phân quyền dữ liệu
- **MANAGER** chỉ xem và quản lý dữ liệu của **ban mình** (`department_id` trùng khớp)
- **ADMIN** xem được toàn bộ dữ liệu của mọi ban
- **MEMBER** chỉ xem task được giao cho mình, lịch của ban mình

### 6.2 Quy tắc chuyển trạng thái Event
- Chỉ MANAGER (người tạo) hoặc ADMIN mới được chuyển trạng thái
- Không thể quay lui trạng thái (APPROVED → PLANNING là không hợp lệ)
- Chỉ ADMIN mới có quyền chuyển sang `APPROVED`

### 6.3 Quy tắc Task
- Member chỉ chuyển được: `TODO → IN_PROGRESS`, `IN_PROGRESS → REVIEW`
- Manager chuyển: `REVIEW → DONE` (approve), `REVIEW → REJECTED` (reject)
- Khi task bị `REJECTED`, Member được phép chuyển lại sang `IN_PROGRESS`
- Một task bị REJECTED phải có `rejectReason`

### 6.4 Quy tắc Đánh giá
- Mỗi Member chỉ có **1 bản tự đánh giá** mỗi tháng (ràng buộc UNIQUE KEY)
- Chỉ nộp được khi `status = SUBMITTED`; ở trạng thái `DRAFT` có thể sửa thoải mái
- Manager chỉ chấm điểm được các thành viên **trong ban mình**
- Sau khi Manager đã chấm (`manager_evaluations` tồn tại), không thể sửa lại

### 6.5 Real-time Notification — Khi nào gửi
| Sự kiện xảy ra | Gửi cho ai |
|---------------|-----------|
| Event mới được tạo/cập nhật trong ban | Tất cả thành viên của ban đó |
| Task được giao | Các member trong `task_assignees` |
| Task bị từ chối | Các member trong `task_assignees` |
| Manager đã chấm điểm tháng | Member được chấm |

---

## 7. CẤU HÌNH APPLICATION.PROPERTIES

```properties
# Database
spring.datasource.url=jdbc:mysql://localhost:3306/club_management?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh
spring.datasource.username=root
spring.datasource.password=
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect

# JWT
app.jwt.secret=clubmanagement_super_secret_key_2025_change_this_in_production
app.jwt.expiration=86400000

# Server
server.port=8080
spring.application.name=club-management

# WebSocket
spring.websocket.enabled=true
```

---

## 8. MAVEN DEPENDENCIES (pom.xml)

```xml
<dependencies>
    <!-- Spring Boot Starters -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-websocket</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>

    <!-- MySQL -->
    <dependency>
        <groupId>com.mysql</groupId>
        <artifactId>mysql-connector-j</artifactId>
        <scope>runtime</scope>
    </dependency>

    <!-- JWT -->
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-api</artifactId>
        <version>0.11.5</version>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-impl</artifactId>
        <version>0.11.5</version>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-jackson</artifactId>
        <version>0.11.5</version>
        <scope>runtime</scope>
    </dependency>

    <!-- Lombok -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>

    <!-- Dev Tools -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-devtools</artifactId>
        <scope>runtime</scope>
        <optional>true</optional>
    </dependency>
</dependencies>
```

---

## 9. STANDARD API RESPONSE FORMAT

Tất cả API trả về cùng cấu trúc:

```json
// Thành công
{
  "success": true,
  "message": "Tạo sự kiện thành công",
  "data": { ... },
  "timestamp": "2025-06-01T10:30:00"
}

// Lỗi
{
  "success": false,
  "message": "Không tìm thấy sự kiện với ID: 99",
  "data": null,
  "timestamp": "2025-06-01T10:30:00"
}
```

**Java wrapper class:**
```java
@Data
@AllArgsConstructor
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private LocalDateTime timestamp;

    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(true, message, data, LocalDateTime.now());
    }

    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, message, null, LocalDateTime.now());
    }
}
```

---

## 10. WEBSOCKET — REAL-TIME NOTIFICATION

### Config
```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws").withSockJS();
    }
}
```

### Gửi notification từ Service
```java
@Service
public class NotificationService {
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void sendToUser(Long userId, NotificationDTO notification) {
        // Lưu vào DB
        saveNotification(notification);
        // Push real-time
        messagingTemplate.convertAndSendToUser(
            userId.toString(),
            "/queue/notifications",
            notification
        );
    }
}
```

### Frontend subscribe (JavaScript)
```javascript
const stompClient = Stomp.over(new SockJS('/ws'));
stompClient.connect({}, function(frame) {
    stompClient.subscribe('/user/queue/notifications', function(message) {
        const notification = JSON.parse(message.body);
        showNotificationToast(notification);
    });
});
```

---

## 11. SEED DATA (Dữ liệu mẫu để test)

```sql
-- Departments
INSERT INTO departments (name, description) VALUES
('Ban Chuyên môn', 'Phụ trách kỹ thuật nhảy và biên đạo'),
('Ban Truyền thông', 'Phụ trách mạng xã hội, ảnh, video'),
('Ban Đối ngoại', 'Phụ trách liên hệ đối tác, tài trợ'),
('Ban Hậu cần', 'Phụ trách trang phục, đạo cụ, hậu trường');

-- Users (password = "password123" đã hash bcrypt)
INSERT INTO users (full_name, email, password_hash, role, department_id, is_active) VALUES
('Nguyễn Văn Admin', 'admin@club.com', '$2a$10$...', 'ADMIN', NULL, true),
('Trần Thị Manager', 'manager1@club.com', '$2a$10$...', 'MANAGER', 1, true),
('Lê Văn Member1', 'member1@club.com', '$2a$10$...', 'MEMBER', 1, true),
('Phạm Thị Member2', 'member2@club.com', '$2a$10$...', 'MEMBER', 1, true);

-- Gán manager cho department
UPDATE departments SET manager_id = 2 WHERE id = 1;
```

---

*File này được tạo tự động. Cập nhật lần cuối: 2025-05-27*
*Liên hệ: Sinh viên capstone — Vietnam-Korea University of Information and Communication Technology*

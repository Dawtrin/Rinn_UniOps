# CLUB OS V2 — COMPLETE REDESIGN SPECIFICATION
> Dual UX Strategy + New Features: Schedule, Internal Messaging, HR Management
> Version: 2.0 | Rebuilt from scratch
> Stack: Spring Boot + MySQL + React + WebSocket (STOMP)

---

## 0. TRIẾT LÝ THIẾT KẾ V2 — TẠI SAO PHẢI TÁCH BIỆT HOÀN TOÀN

### Admin/Manager — "Command Center"
> *Cảm giác như Bloomberg Terminal gặp Linear.app*
- Người dùng: ngồi bàn, màn hình lớn, cần xử lý nhiều dữ liệu nhanh
- Tông: Power, precision, data-dense — tối màu, nhiều thông tin trên màn hình
- Layout: Bento Grid 12 cột, sidebar cố định, nhiều panel
- Cảm xúc: **Tôi đang kiểm soát mọi thứ**

### Member — "Story Dashboard"
> *Cảm giác như Duolingo gặp Notion gặp Instagram Stories*
- Người dùng: dùng mobile hoặc laptop casual, cần xem nhanh việc của mình
- Tông: Dynamic, playful, storytelling — màu sắc hơn, animation nhiều hơn
- Layout: Scroll dọc, card lớn, visual-first
- Cảm xúc: **Hôm nay tôi cần làm gì, tôi đang đứng ở đâu**

---

## 1. HỆ THỐNG ROLES & PHÂN QUYỀN V2

```
ADMIN (Chủ nhiệm CLB)
├── Quản lý toàn bộ CLB
├── Tạo/xóa/sửa Department (Ban)
├── Tạo/xóa/sửa Team (Đội con trong ban)
├── Phân công Member vào Team
├── Xem tất cả chat groups (readonly)
├── Broadcast thông báo toàn CLB
└── Xem báo cáo tổng hợp tất cả ban

MANAGER (Trưởng/Phó ban)
├── Quản lý nhân sự TRONG BAN MÌNH
├── Tạo/xóa Team trong ban mình
├── Phân công Member vào Team trong ban
├── Tạo sự kiện, thời khóa biểu cho ban/đội
├── Giao task cho member trong ban
├── Chat với member trong ban + đội của ban
├── Đánh giá KPI member trong ban
└── Xem báo cáo của ban mình

MEMBER (Thành viên)
├── Xem lịch của ĐỘI MÌNH (không thấy ban khác)
├── Nhận và cập nhật task được giao
├── Check-in/Check-out buổi tập
├── Chat trong nhóm đội mình + nhắn tin riêng
├── Nộp tự đánh giá hàng tháng
├── Xem KPI cá nhân
└── KHÔNG thấy dữ liệu ngoài đội mình
```

---

## 2. DATABASE SCHEMA V2 — CẬP NHẬT

### 2.1 Bảng mới: `teams` (Đội con)

```sql
CREATE TABLE teams (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,       -- "Đội Nhảy A", "Đội Nhảy B"
    description     TEXT,
    department_id   BIGINT NOT NULL,             -- FK → departments
    leader_id       BIGINT,                      -- FK → users (Đội trưởng)
    avatar_color    VARCHAR(7) DEFAULT '#6366f1', -- Màu đại diện team
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (leader_id) REFERENCES users(id)
);
```

### 2.2 Bảng mới: `team_members` (Thành viên đội)

```sql
CREATE TABLE team_members (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    team_id     BIGINT NOT NULL,
    user_id     BIGINT NOT NULL,
    joined_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_team_user (team_id, user_id),
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 2.3 Bảng mới: `schedules` (Thời khóa biểu)

```sql
CREATE TABLE schedules (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,       -- "Lịch tập tuần 22"
    scope_type      ENUM('CLB','DEPARTMENT','TEAM') NOT NULL,
    scope_id        BIGINT NOT NULL,             -- ID của CLB(1)/department/team
    week_start      DATE NOT NULL,               -- Ngày thứ 2 của tuần
    week_end        DATE NOT NULL,               -- Ngày chủ nhật
    status          ENUM('DRAFT','PUBLISHED') DEFAULT 'DRAFT',
    created_by      BIGINT NOT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE schedule_slots (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    schedule_id     BIGINT NOT NULL,
    day_of_week     TINYINT NOT NULL,            -- 1=Thứ 2, 7=Chủ nhật
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    title           VARCHAR(200) NOT NULL,       -- "Tập Popping", "Họp ban"
    location        VARCHAR(200),
    type            ENUM('PRACTICE','MEETING','PERFORMANCE','OTHER') DEFAULT 'PRACTICE',
    color           VARCHAR(7) DEFAULT '#6366f1',
    notes           TEXT,
    FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
);
```

### 2.4 Bảng mới: `chat_rooms` (Phòng chat)

```sql
CREATE TABLE chat_rooms (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100),
    type            ENUM('CLB','DEPARTMENT','TEAM','DIRECT') NOT NULL,
    scope_id        BIGINT,                      -- ID department/team (null nếu DIRECT)
    avatar_url      VARCHAR(500),
    created_by      BIGINT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE chat_room_members (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    room_id     BIGINT NOT NULL,
    user_id     BIGINT NOT NULL,
    joined_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_read   DATETIME,                        -- Dùng để tính unread count
    UNIQUE KEY uq_room_user (room_id, user_id),
    FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE chat_messages (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    room_id         BIGINT NOT NULL,
    sender_id       BIGINT NOT NULL,
    content         TEXT NOT NULL,
    type            ENUM('TEXT','IMAGE','FILE','SYSTEM') DEFAULT 'TEXT',
    reply_to_id     BIGINT,                      -- FK → chat_messages (reply)
    is_deleted      BOOLEAN DEFAULT FALSE,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (reply_to_id) REFERENCES chat_messages(id)
);
```

### 2.5 Cập nhật bảng `users`

```sql
-- Thêm cột team_id (member thuộc đội nào)
ALTER TABLE users ADD COLUMN team_id BIGINT AFTER department_id;
ALTER TABLE users ADD CONSTRAINT fk_user_team FOREIGN KEY (team_id) REFERENCES teams(id);

-- Thêm avatar và bio
ALTER TABLE users ADD COLUMN bio VARCHAR(300) AFTER avatar_url;
ALTER TABLE users ADD COLUMN join_date DATE AFTER bio;
```

---

## 3. API ENDPOINTS V2 — BỔ SUNG

### 3.1 Team Management (Admin + Manager)

```
GET    /api/teams                              -- Admin: all teams; Manager: teams trong ban
POST   /api/teams                              -- Tạo team mới
GET    /api/teams/{id}
PUT    /api/teams/{id}
DELETE /api/teams/{id}

GET    /api/teams/{id}/members                 -- DS thành viên team
POST   /api/teams/{id}/members                 -- Thêm member vào team
DELETE /api/teams/{id}/members/{userId}        -- Xóa member khỏi team
PUT    /api/teams/{id}/leader                  -- Đổi đội trưởng

-- HR Management
GET    /api/hr/unassigned-members              -- Members chưa có team
PUT    /api/hr/assign                          -- { userId, teamId } — phân công
PUT    /api/hr/bulk-assign                     -- [{ userId, teamId }] — phân công hàng loạt
GET    /api/hr/org-chart                       -- Sơ đồ tổ chức CLB
```

### 3.2 Schedule (Thời khóa biểu)

```
GET    /api/schedules?scopeType=TEAM&scopeId=1&week=2025-06-02
POST   /api/schedules                          -- Tạo lịch mới (Manager)
PUT    /api/schedules/{id}
DELETE /api/schedules/{id}
PUT    /api/schedules/{id}/publish             -- DRAFT → PUBLISHED

GET    /api/schedules/{id}/slots               -- DS slot trong tuần
POST   /api/schedules/{id}/slots               -- Thêm slot
PUT    /api/schedules/slots/{slotId}
DELETE /api/schedules/slots/{slotId}

-- Member view
GET    /api/schedules/my-week?week=2025-06-02  -- Lịch tuần của member hiện tại
```

### 3.3 Chat & Messaging

```
GET    /api/chat/rooms                         -- DS phòng chat của user hiện tại
POST   /api/chat/rooms/direct                  -- Tạo DM với user khác { targetUserId }
GET    /api/chat/rooms/{id}/messages?page=0&size=50
POST   /api/chat/rooms/{id}/messages           -- Gửi tin nhắn (REST fallback)
DELETE /api/chat/messages/{id}                 -- Xóa tin nhắn (chỉ của mình)
GET    /api/chat/rooms/{id}/members
GET    /api/chat/unread-count                  -- Tổng unread across all rooms

-- WebSocket endpoints (STOMP)
SUBSCRIBE /topic/chat/{roomId}                 -- Nhận tin nhắn room
SUBSCRIBE /user/queue/chat-notifications       -- Nhận thông báo tin nhắn mới
SEND      /app/chat/send                       -- Gửi tin nhắn qua WS
SEND      /app/chat/typing                     -- Typing indicator
```

### 3.4 HR Management (Admin)

```
GET    /api/admin/org-chart                    -- Full org chart JSON
GET    /api/admin/members                      -- Tất cả members với team/dept info
POST   /api/admin/members/import               -- Import từ CSV (optional)
GET    /api/admin/members/export               -- Export danh sách

PUT    /api/admin/members/{id}/role            -- Đổi role
PUT    /api/admin/members/{id}/department      -- Chuyển ban
PUT    /api/admin/members/{id}/team            -- Chuyển đội
POST   /api/admin/members/{id}/deactivate      -- Vô hiệu hóa
```

---

## 4. WEBSOCKET ARCHITECTURE — CHAT + NOTIFICATIONS

### 4.1 WebSocket Config

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Simple in-memory broker cho dev
        // Production: dùng RabbitMQ hoặc Redis
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("http://localhost:*")
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // JWT auth cho WebSocket
        registration.interceptors(new WebSocketAuthInterceptor());
    }
}
```

### 4.2 Chat Message Flow

```
Frontend                    Backend                     Other users
    │                           │                           │
    ├──STOMP SEND /app/chat/send─→                          │
    │  { roomId, content }      │                           │
    │                           ├── Validate user in room   │
    │                           ├── Save to DB              │
    │                           ├── BROADCAST /topic/chat/{roomId}
    │                           │                           ←─┤
    │  ←─── ACK với message ID ─┤                           │
    │                           │                           │
    │  (nếu offline)            ├── Save notification to DB │
    │                           ├── Push FCM/email (optional)
```

### 4.3 Chat Room Auto-creation Logic

```
Khi tạo DEPARTMENT → tự động tạo chat_room type=DEPARTMENT
Khi tạo TEAM       → tự động tạo chat_room type=TEAM
Khi Admin login    → join tất cả rooms (readonly observer)
Khi Manager login  → join rooms của ban mình
Khi Member login   → join room của đội mình + có thể DM trong đội

DIRECT MESSAGE:
  Member A muốn DM Member B:
  - Chỉ được DM nếu cùng team_id
  - Manager có thể DM bất kỳ member trong department
  - Admin có thể DM bất kỳ ai
```

---

## 5. DUAL UX DESIGN SYSTEM

### 5.1 ADMIN/MANAGER INTERFACE — "Command Center"

#### Tham khảo
- **Layout**: Linear.app issues view + Vercel analytics
- **Data density**: Bloomberg Terminal tư duy (nhiều info, không rối)
- **Charts**: Grafana + Stripe Dashboard style
- **Typography**: Sau + DM Sans — professional, không cảm xúc

#### Color Tokens (Admin/Manager)

```css
/* DARK MODE — mặc định cho Admin/Manager */
--am-bg:           #070710;     /* Gần như pure dark */
--am-surface-1:    #0d0d1c;     /* Cards */
--am-surface-2:    #12122a;     /* Elevated panels */
--am-border:       rgba(255,255,255,0.07);
--am-border-hover: rgba(255,255,255,0.14);
--am-accent:       #6366f1;     /* Indigo — power, control */
--am-accent-2:     #8b5cf6;     /* Violet */
--am-success:      #10b981;
--am-warning:      #f59e0b;
--am-danger:       #ef4444;

/* Glassmorphism */
--am-glass:        rgba(255,255,255,0.04);
--am-glass-hover:  rgba(255,255,255,0.07);

/* LIGHT MODE toggle */
--am-bg-light:     #f4f4f8;
--am-surface-light: #ffffff;
--am-border-light: rgba(0,0,0,0.08);
```

#### Layout Structure Admin Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│ SIDEBAR (240px fixed)          MAIN CONTENT                     │
│ ┌──────────────────────┐       ┌──────────────────────────────┐ │
│ │ 🔷 Club OS           │       │ HEADER (sticky)              │ │
│ │ ─────────────────── │       │ Breadcrumb | Search | Alerts  │ │
│ │ OVERVIEW             │       ├──────────────────────────────┤ │
│ │ • Dashboard          │       │                              │ │
│ │ • Org Chart    NEW   │       │  BENTO GRID CONTENT          │ │
│ │ • Analytics          │       │                              │ │
│ │                      │       │  [Metric][Metric][Chart    ] │ │
│ │ NHÂN SỰ              │       │  [Metric][    Chart large  ] │ │
│ │ • Quản lý thành viên │       │  [HR Panel              ]   │ │
│ │ • Phân công đội      │       │  [Activity Feed          ]  │ │
│ │ • Đánh giá KPI       │       │                              │ │
│ │                      │       └──────────────────────────────┘ │
│ │ SỰ KIỆN              │                                        │
│ │ • Lịch & Sự kiện     │                                        │
│ │ • Thời khóa biểu NEW │                                        │
│ │ • Điểm danh          │                                        │
│ │                      │                                        │
│ │ CÔNG VIỆC            │                                        │
│ │ • Task board         │                                        │
│ │ • Báo cáo            │                                        │
│ │                      │                                        │
│ │ TRAO ĐỔI             │                                        │
│ │ • Nhắn tin      NEW  │                                        │
│ │ • Thông báo          │                                        │
│ │                      │                                        │
│ │ HỆ THỐNG             │                                        │
│ │ • Hội phí            │                                        │
│ │ • Trợ lý AI          │                                        │
│ │ ─────────────────── │                                        │
│ │ [Avatar] Nguyễn Admin│                                        │
│ │ Chủ nhiệm CLB        │                                        │
│ └──────────────────────┘                                        │
└─────────────────────────────────────────────────────────────────┘
```

#### Admin Dashboard Bento Layout (12 cols)

```
ROW 1: KPI tổng quan (height: 140px)
├── col-3: Tổng thành viên    [Hero number: "24"]
├── col-3: Đang hoạt động     [Hero number: "21" + trend]
├── col-3: Sự kiện tháng này  [Hero number: "3"]
└── col-3: Task hoàn thành    [Hero number: "67%" + circular]

ROW 2: Charts (height: 280px)
├── col-8: Biểu đồ chuyên cần theo tháng [Line chart]
│          Filter: All / Theo ban / Theo đội
└── col-4: Phân bố KPI xếp loại [Donut chart]
           Xuất sắc / Tốt / Đạt / Không đạt

ROW 3: HR Quick View (height: 200px)
├── col-6: Sơ đồ tổ chức mini   [Tree view]
│          Click → mở full org chart
└── col-6: Members cần chú ý    [List]
           - Chưa được phân đội (badge warning)
           - KPI tháng dưới 50
           - Vắng nhiều buổi

ROW 4: Activity + Schedule (height: 240px)
├── col-4: Hoạt động gần đây    [Timeline feed]
├── col-4: Lịch tuần này        [Mini calendar]
└── col-4: Task sắp đến hạn     [List với countdown]
```

#### HR Management Page — Org Chart View

```
Layout: 2 panel
LEFT (col-4): Tree sidebar
  - CLB (root)
    ├── Ban Chuyên môn
    │   ├── Đội A (6 members)
    │   └── Đội B (5 members)
    ├── Ban Truyền thông
    │   └── Đội Media (4 members)
    └── Chưa phân công (3)   ← badge warning

RIGHT (col-8): Detail panel
  Khi click vào Đội → hiện:
  - Header: tên đội + avatar màu + edit button
  - Grid member cards (3 cols):
    [Avatar][Tên][Role badge][KPI badge][Action: Transfer/Remove]
  - Bottom: "Thêm thành viên" → Modal search + assign

DRAG & DROP:
  - Kéo member card từ "Chưa phân công" → thả vào đội
  - Animation: card shrinks, flies, drops with spring
  - Confirm modal nếu chuyển từ đội này sang đội khác
```

#### Schedule Page (Admin/Manager)

```
Layout: Full-width calendar view

HEADER:
  [← Tuần trước] [Tuần 22: 26/05 - 01/06/2025] [Tuần sau →]
  Filter: [CLB ▼] [Tất cả ban ▼] [Tất cả đội ▼]
  [+ Thêm lịch] [Xuất PDF]

CALENDAR GRID:
       T2    T3    T4    T5    T6    T7    CN
06:00  │     │     │     │     │     │     │
07:00  │     │     │     │     │ ████│     │
       │     │     │     │     │Tập A│     │ ← Slot card
08:00  │████ │     │████ │     │ ████│     │
       │Họp  │     │Tập B│     │     │     │
09:00  │     │     │ ████│     │     │     │
...

SLOT CARD design:
  - Rounded pill shape
  - Màu theo type (PRACTICE=indigo, MEETING=amber, PERF=pink)
  - Hiển thị: title, time, location (nếu đủ chỗ)
  - Click → popup detail
  - Drag to reschedule (Manager only)

THÊM SLOT MODAL:
  - Tiêu đề *
  - Loại: Practice / Meeting / Performance / Other
  - Ngày trong tuần (multi-select cho recurring)
  - Giờ bắt đầu / kết thúc
  - Địa điểm
  - Áp dụng cho: CLB / Ban X / Đội Y
  - Màu sắc picker
  - Ghi chú
  - [Lưu nháp] [Xuất bản ngay]
```

---

### 5.2 MEMBER INTERFACE — "Story Dashboard"

#### Tham khảo
- **Storytelling**: Duolingo streak system + Notion aesthetic
- **Mobile-first**: Instagram/TikTok card feel
- **Progress**: Fitness app (Nike Run Club, Strava) kiểu track progress
- **Vibe**: Năng động, colorful, personal — "đây là hành trình của TÔI"

#### Color Tokens (Member)

```css
/* Member dùng LIGHT MODE làm mặc định */
--mb-bg: linear-gradient(160deg, #f0f9ff 0%, #fdf4ff 50%, #fff7ed 100%);
--mb-card: rgba(255,255,255,0.75);
--mb-card-hover: rgba(255,255,255,0.92);
--mb-border: rgba(255,255,255,0.8);

/* Energy colors — sống động hơn Admin */
--mb-primary: #6366f1;
--mb-energy: #f59e0b;      /* Streak, achievement */
--mb-growth: #10b981;      /* Progress, done */
--mb-alert:  #f43f5e;      /* Deadline gấp */
--mb-social: #8b5cf6;      /* Chat, community */

/* Gradient accents */
--mb-grad-hero: linear-gradient(135deg, #6366f1, #8b5cf6);
--mb-grad-energy: linear-gradient(135deg, #f59e0b, #ef4444);
--mb-grad-growth: linear-gradient(135deg, #10b981, #06b6d4);
```

#### Member Dashboard Layout (Scroll vertical)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STICKY HEADER
[≡ Menu]  Club OS  [🔔 3] [👤]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HERO SECTION (full-width card, gradient bg)
"Xin chào, Minh! 👋"
"Thứ 4, 28/05/2025"
[🔥 Streak 7 ngày liên tiếp!]  ← Gamification
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"HÔM NAY CỦA BẠN"
┌─────────────────────────────┐
│ 🕐 Buổi tập 19:00 - 21:00  │  ← Card lớn, visual priority
│ Phòng tập Tầng 2 - Đội A    │
│ [Check-in ngay] countdown  │
└─────────────────────────────┘

"TIẾN ĐỘ THÁNG NÀY"
┌──────────┐ ┌──────────┐
│ Chuyên   │ │ Tasks    │  ← 2 card nhỏ hơn
│ cần      │ │ 4/6 done │
│ 85% ████ │ │ ████░░   │
└──────────┘ └──────────┘

"CÔNG VIỆC CẦN LÀM"
[Task card 1 - deadline hôm nay! 🔴]
[Task card 2 - còn 2 ngày]
[Task card 3 - đang làm]
[Xem tất cả →]

"LỊCH TUẦN NÀY"
┌─ T2 ─┬─ T3 ─┬─ T4 ─┬─ T5 ─┬─ T6 ─┐
│      │      │  🟣  │      │  🟣  │  ← Dot = có buổi
│      │      │ 19h  │      │ 19h  │
└──────┴──────┴──────┴──────┴──────┘

"ĐỘI CỦA BẠN — Đội A"
[Avatars 6 members]  [Chat nhóm →]

"THÀNH TÍCH"
[Badge: Chuyên cần tháng 4 ⭐]
[Badge: Task Master 🎯]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BOTTOM NAV (mobile):
[🏠 Home] [📅 Lịch] [✅ Tasks] [💬 Chat] [👤 Tôi]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### Member Schedule View

```
"LỊCH CỦA ĐỘI A"
← Tuần 22  [Tháng 5]  Tuần 23 →

KHÔNG PHẢI grid khô khan — dùng card flow:

Thứ Tư, 28/05
┌──────────────────────────────┐
│ 🟣 19:00 – 21:00             │
│ Tập Popping                  │
│ 📍 Phòng tập Tầng 2          │
│ [Check-in] [Chi tiết]        │
└──────────────────────────────┘

Thứ Sáu, 30/05
┌──────────────────────────────┐
│ 🔵 14:00 – 16:00             │
│ Tổng duyệt Festival          │
│ 📍 Sân khấu chính            │
│ 🔴 Bắt buộc có mặt           │
└──────────────────────────────┘
```

#### Member Chat View

```
LEFT PANEL (col-3) — Room list:
  🔷 Đội A        [3 unread]
  🏢 Ban Chuyên môn
  ── Tin nhắn riêng ──
  👤 Nguyễn Văn B  [1 unread]
  👤 Trần Thị C

  (Không thấy ban/đội khác)

RIGHT PANEL (col-9) — Chat:
  Header: Tên room + members
  Messages: bubble style
  - User own: right, indigo bubble
  - Others: left, glass bubble + avatar
  Reply: quote block màu muted
  Typing indicator: 3 dots animation

Input bar (sticky bottom):
  [📎] [Gõ tin nhắn...          ] [➤]
```

---

## 6. WEBSOCKET EVENTS — ĐẦY ĐỦ

```javascript
// CLIENT SUBSCRIBE
stompClient.subscribe('/topic/chat/' + roomId, onMessage);
stompClient.subscribe('/user/queue/notifications', onNotification);
stompClient.subscribe('/topic/chat/' + roomId + '/typing', onTyping);

// CLIENT SEND
// Gửi tin nhắn
stompClient.send('/app/chat/send', {}, JSON.stringify({
  roomId: 1,
  content: "Hello team!",
  type: "TEXT",
  replyToId: null
}));

// Typing indicator
stompClient.send('/app/chat/typing', {}, JSON.stringify({
  roomId: 1,
  isTyping: true
}));

// SERVER BROADCAST
// Message mới → /topic/chat/{roomId}
{
  "id": 123,
  "roomId": 1,
  "sender": { "id": 5, "fullName": "Nguyễn Văn A", "avatarUrl": "..." },
  "content": "Hello team!",
  "type": "TEXT",
  "replyTo": null,
  "createdAt": "2025-05-28T19:30:00"
}

// Notification → /user/queue/notifications
{
  "type": "NEW_MESSAGE",
  "roomId": 1,
  "roomName": "Đội A",
  "preview": "Nguyễn Văn A: Hello team!",
  "unreadCount": 3
}
```

---

## 7. ADMIN — TÍNH NĂNG MỚI: QUẢN LÝ NHÂN SỰ LUỒNG NGHIỆP VỤ

### Luồng onboard thành viên mới:

```
1. Admin tạo tài khoản user (POST /api/users)
   - Điền thông tin cơ bản + role = MEMBER
   - Hệ thống gửi email với mật khẩu tạm

2. Admin vào "Phân công đội" (HR page)
   - Thấy user mới trong "Chưa phân công"
   - Kéo thả hoặc click "Phân công" → chọn Department → chọn Team
   - Hệ thống tự động:
     a. Update user.department_id + user.team_id
     b. Thêm vào team_members
     c. Thêm vào chat_room_members của room đội + room ban
     d. Gửi notification cho team leader
     e. Gửi welcome message vào chat đội

3. Member mới login thấy ngay:
   - Dashboard của đội mình
   - Lịch tập của đội
   - Chat group đội
```

### Luồng chuyển đội:

```
1. Admin/Manager click "Chuyển đội" trên member card
2. Modal: [Đội hiện tại] → [Chọn đội mới]
3. Confirm với lý do chuyển (optional)
4. Hệ thống:
   a. Update user.team_id
   b. Remove khỏi chat room đội cũ (vẫn giữ lịch sử)
   c. Add vào chat room đội mới
   d. Notification cho cả 2 team leader
   e. System message trong cả 2 chat: "Nguyễn A đã rời/gia nhập đội"
```

---

## 8. GAMIFICATION CHO MEMBER (tính năng phụ nhưng quan trọng cho UX)

```
STREAK SYSTEM:
  - Đến buổi tập liên tiếp → streak count tăng
  - 7 ngày: badge "Tích cực" 🔥
  - 30 ngày: badge "Kiên định" ⭐
  - Streak bị reset nếu vắng 1 buổi không phép

ACHIEVEMENT BADGES:
  - Task Master: hoàn thành 10 tasks đúng hạn
  - Team Player: nhắn tin trong group > 50 lần
  - Punctual: check-in đúng giờ 20 buổi liên tiếp
  - KPI Champion: đạt Xuất sắc 3 tháng liên tiếp

LEADERBOARD (trong đội):
  - Xếp hạng theo: chuyên cần / KPI / tasks hoàn thành
  - Chỉ thấy trong phạm vi đội — tính cạnh tranh lành mạnh
  - Reset mỗi tháng
```

---

## 9. CHECKLIST IMPLEMENT — THỨ TỰ ƯU TIÊN

### Phase 1 — Core fixes (làm ngay)
- [ ] Thêm bảng `teams` và `team_members`
- [ ] API Team CRUD
- [ ] HR page: phân công member vào team
- [ ] Data isolation: Member chỉ thấy dữ liệu đội mình

### Phase 2 — Schedule
- [ ] Bảng `schedules` và `schedule_slots`
- [ ] API Schedule CRUD
- [ ] Admin/Manager: tạo lịch drag-drop calendar
- [ ] Member: view lịch đội mình dạng card

### Phase 3 — Chat
- [ ] Bảng `chat_rooms`, `chat_room_members`, `chat_messages`
- [ ] WebSocket STOMP setup
- [ ] Auto-create rooms khi tạo team/dept
- [ ] Chat UI (full implementation)
- [ ] DM giữa members cùng đội

### Phase 4 — UI Redesign
- [ ] Admin/Manager: Command Center dark glass
- [ ] Member: Story Dashboard light pastel
- [ ] Theme toggle per role
- [ ] Mobile responsive Member view
- [ ] Animation system (stagger, spring, counter)

### Phase 5 — Polish
- [ ] Gamification badges
- [ ] Notification center
- [ ] Org chart visualization
- [ ] Analytics charts (recharts)
- [ ] VNPay + AI hoàn thiện

---

## 10. TECH STACK BỔ SUNG

```xml
<!-- Thêm vào pom.xml -->

<!-- WebSocket đã có -->

<!-- Email (để gửi mật khẩu tạm) -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-mail</artifactId>
</dependency>

<!-- Schedule/Job (xử lý streak calculation, monthly KPI reset) -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-quartz</artifactId>
</dependency>
```

```json
// Frontend — thêm vào package.json
{
  "recharts": "^2.x",          // Charts
  "framer-motion": "^11.x",   // Animation premium (thay CSS thuần)
  "@dnd-kit/core": "^6.x",    // Drag & drop (org chart, kanban, schedule)
  "date-fns": "^3.x",         // Date utilities cho schedule
  "canvas-confetti": "^1.x",  // Payment success celebration
  "react-intersection-observer": "^9.x"  // Scroll animations
}
```

---

*Club OS V2 — Rebuilt with dual UX strategy*
*Tham khảo: Linear.app, Vercel, Raycast, Duolingo, Strava, Bloomberg Terminal*

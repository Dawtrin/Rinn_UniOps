# CLUB OS — ULTRA DETAILED DESIGN PROMPT
> Dành cho AI (Cursor, Copilot, v0.dev, Claude) để redesign toàn bộ UI/UX
> Viết bởi: Senior UI/UX Designer perspective
> Cập nhật: 2025-05

---

## 0. TÀI LIỆU THAM KHẢO — BENCHMARK CÁC TRANG WEB THỰC TẾ

Trước khi implement, AI phải nghiên cứu và học từ các nguồn này:

| Tham khảo | URL | Học cái gì |
|-----------|-----|-----------|
| **Linear.app** | linear.app | Cách dùng dark glass card, typography mỏng nhẹ, sidebar minimal |
| **Vercel Dashboard** | vercel.com/dashboard | Bento grid bất đối xứng, metric card layout, data density |
| **Raycast** | raycast.com | Frosted glass + dark depth, animation spring, icon usage |
| **Craft.do** | craft.do | Light mode glass card tinh tế, whitespace breathing |
| **Stripe Dashboard** | stripe.com/docs | Professional data viz, chart styling, color system |
| **Apple Human Interface Guidelines iOS 17** | developer.apple.com/design | Glass material spec, vibrancy, blur layers |
| **Basement Studio** | basement.studio | Bento grid layout inspiration, Japanese minimalism |
| **Emil Kowalski animations** | emilkowal.ski | Spring animation reference, micro-interaction tuyệt hảo |

---

## 1. DESIGN PHILOSOPHY — TƯ TƯỞNG THIẾT KẾ

### Tagline của hệ thống
> *"Powerful like a dashboard. Calm like Japanese zen. Beautiful like iOS."*

### 3 nguyên tắc bất di bất dịch
1. **Depth over flat** — Mọi thứ phải có cảm giác có chiều sâu (z-layers) thông qua blur, opacity, và shadow — không bao giờ flat như PowerPoint
2. **Motion with purpose** — Mỗi animation phải có lý do tồn tại: hướng sự chú ý, báo trạng thái, hoặc tạo cảm giác responsive. Không animation trang trí vô nghĩa
3. **Information hierarchy** — Bento grid không phải để đẹp, mà để user scan được thông tin quan trọng nhất trong 3 giây đầu tiên

---

## 2. VISUAL LANGUAGE — NGÔN NGỮ HÌNH ẢNH

### 2.1 Material System (Học từ Apple iOS 17 Materials)

```
DARK MODE — 3 lớp vật liệu:
┌─────────────────────────────────────────┐
│ Layer 3 (top): Ultra-thin glass         │ backdrop-filter: blur(40px) saturate(180%)
│ rgba(255,255,255,0.04) + border 0.08    │ → Dùng cho: tooltip, popover, dropdown
├─────────────────────────────────────────┤
│ Layer 2 (mid): Regular glass            │ backdrop-filter: blur(20px) saturate(150%)
│ rgba(255,255,255,0.06) + border 0.12    │ → Dùng cho: main cards, sidebar
├─────────────────────────────────────────┤
│ Layer 1 (base): Thick glass             │ backdrop-filter: blur(60px)
│ rgba(255,255,255,0.03) + border 0.06    │ → Dùng cho: modal backdrop, page sections
├─────────────────────────────────────────┤
│ Layer 0 (bg): Deep space                │ background: #080810
│ + orb gradients                         │ + radial orbs indigo/violet
└─────────────────────────────────────────┘

LIGHT MODE — 3 lớp vật liệu:
┌─────────────────────────────────────────┐
│ Layer 3 (top): Frosted white            │ backdrop-filter: blur(30px) saturate(200%)
│ rgba(255,255,255,0.75) + border 0.9     │ → Dùng cho: tooltip, active card
├─────────────────────────────────────────┤
│ Layer 2 (mid): Semi-frosted             │ backdrop-filter: blur(16px) saturate(180%)
│ rgba(255,255,255,0.55) + border 0.75    │ → Dùng cho: main cards
├─────────────────────────────────────────┤
│ Layer 1 (base): Tinted glass            │ backdrop-filter: blur(8px)
│ rgba(255,255,255,0.35) + border 0.5     │ → Dùng cho: bento dark cells
├─────────────────────────────────────────┤
│ Layer 0 (bg): Pastel mesh gradient      │ background: mesh-gradient
│ #e0f2fe → #f0e6ff → #fce7f3            │ → Ambient light effect
└─────────────────────────────────────────┘
```

### 2.2 Color System — CSS Variables đầy đủ

```css
:root {
  /* === DARK MODE BASE === */
  --bg-canvas: #080810;
  --bg-deep: #0d0d1a;
  --bg-surface: #12121f;

  /* Glass materials */
  --glass-ultra: rgba(255,255,255,0.04);
  --glass-regular: rgba(255,255,255,0.06);
  --glass-thick: rgba(255,255,255,0.09);
  --glass-hover: rgba(255,255,255,0.12);

  /* Glass borders */
  --border-glass-subtle: rgba(255,255,255,0.06);
  --border-glass-default: rgba(255,255,255,0.10);
  --border-glass-strong: rgba(255,255,255,0.16);
  --border-glass-accent: rgba(99,102,241,0.4);

  /* Accent — Indigo brand color */
  --accent: #6366f1;
  --accent-light: #818cf8;
  --accent-dim: rgba(99,102,241,0.15);
  --accent-glow: rgba(99,102,241,0.3);

  /* Secondary accent — Violet */
  --accent-2: #8b5cf6;
  --accent-2-dim: rgba(139,92,246,0.12);

  /* Semantic */
  --success: #34d399;
  --success-dim: rgba(52,211,153,0.15);
  --warning: #fbbf24;
  --warning-dim: rgba(251,191,36,0.15);
  --danger: #f87171;
  --danger-dim: rgba(248,113,113,0.15);

  /* Text */
  --text-primary: rgba(255,255,255,0.95);
  --text-secondary: rgba(255,255,255,0.6);
  --text-muted: rgba(255,255,255,0.35);
  --text-ghost: rgba(255,255,255,0.18);

  /* Orb backgrounds (ambient light) */
  --orb-1-color: rgba(99,102,241,0.18);
  --orb-2-color: rgba(139,92,246,0.12);
  --orb-3-color: rgba(59,130,246,0.08);

  /* Bento cells (dark mode) */
  --bento-accent-cell: #1a1040; /* Cell nổi bật màu tím đậm */
  --bento-neutral-cell: var(--glass-regular);

  /* Transition */
  --spring: cubic-bezier(0.22, 0.68, 0, 1.2);
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
}

[data-theme="light"] {
  /* Background mesh */
  --bg-canvas: linear-gradient(135deg, #e0f2fe 0%, #ede9fe 40%, #fce7f3 100%);
  --bg-deep: rgba(255,255,255,0.3);
  --bg-surface: rgba(255,255,255,0.5);

  /* Glass materials */
  --glass-ultra: rgba(255,255,255,0.45);
  --glass-regular: rgba(255,255,255,0.60);
  --glass-thick: rgba(255,255,255,0.75);
  --glass-hover: rgba(255,255,255,0.88);

  /* Glass borders */
  --border-glass-subtle: rgba(255,255,255,0.5);
  --border-glass-default: rgba(255,255,255,0.75);
  --border-glass-strong: rgba(255,255,255,0.92);
  --border-glass-accent: rgba(99,102,241,0.35);

  /* Text */
  --text-primary: #0f0f1a;
  --text-secondary: #374151;
  --text-muted: #9ca3af;
  --text-ghost: #d1d5db;

  /* Bento cells (light mode) */
  --bento-accent-cell: #1a1a2e; /* Cell nổi bật vẫn giữ dark để tương phản */
  --bento-neutral-cell: rgba(255,255,255,0.6);
  --bento-warm-cell: #fff8f0;
  --bento-cool-cell: #f0f7ff;
  --bento-green-cell: #f0faf4;
}
```

### 2.3 Typography System (Học từ Linear + Vercel)

```css
/* Font pairing — KHÔNG dùng Inter hay Roboto */
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500&family=DM+Mono:wght@400;500&display=swap');

:root {
  --font-display: 'DM Sans', sans-serif;  /* Gần giống SF Pro của Apple */
  --font-mono: 'DM Mono', monospace;      /* Cho code, metric labels */
}

/* Type scale */
.t-hero    { font-size: 3rem;   font-weight: 300; letter-spacing: -2px; line-height: 1; }
.t-display { font-size: 2rem;   font-weight: 300; letter-spacing: -1px; line-height: 1.1; }
.t-title   { font-size: 1.25rem; font-weight: 400; letter-spacing: -0.3px; }
.t-body    { font-size: 0.875rem; font-weight: 400; line-height: 1.6; }
.t-label   { font-size: 0.625rem; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.5; }
.t-mono    { font-family: var(--font-mono); font-size: 0.75rem; }
```

---

## 3. LAYOUT SYSTEM — BENTO GRID CHI TIẾT

### 3.1 Grid Foundation (Học từ Basement Studio + Vercel)

```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-auto-rows: minmax(80px, auto);
  gap: 12px;
  padding: 20px;
}

/* Cell sizing classes */
.cell-1  { grid-column: span 1; }
.cell-2  { grid-column: span 2; }
.cell-3  { grid-column: span 3; }
.cell-4  { grid-column: span 4; }
.cell-5  { grid-column: span 5; }
.cell-6  { grid-column: span 6; }
.cell-8  { grid-column: span 8; }
.cell-12 { grid-column: span 12; }
.row-2   { grid-row: span 2; }
.row-3   { grid-row: span 3; }
```

### 3.2 Dashboard Layout Map (Admin view)

```
┌──────────────────────────────────────────────────────────┐
│ HEADER: Logo + "Club OS" + Theme toggle + Avatar         │ col-12
├────────────────────┬─────────────────────────────────────┤
│                    │ CHUYÊN CẦN CHART                    │
│  THÀNH VIÊN        │ Sparkline bars + % số               │ col-8
│  Hero: "6"         │                                     │
│  font-size 5rem    ├──────────────┬──────────────────────┤
│  weight 300        │ SỰ KIỆN      │ KPI THÁNG            │
│  col-4, row-2      │ Badge status │ Circular progress    │ col-4 + col-4
│                    │ col-4        │ col-4                │
├────────────┬───────┴──────────────┼──────────────────────┤
│ TASKS      │ LỊCH TUẦN           │ AI ASSISTANT          │
│ Mini board │ 7 ô ngày tháng      │ Chat input nhỏ        │
│ TODO/DONE  │ dot = có buổi tập   │ Gemini powered        │
│ col-3      │ col-5               │ col-4                │
├────────────┴─────────────────────┴──────────────────────┤
│ ACTIVITY FEED: Timeline các hoạt động gần nhất          │ col-12
└──────────────────────────────────────────────────────────┘
```

### 3.3 Cell Design Rules

Mỗi bento cell PHẢI có:
- `border-radius: 20px` (không phải 8px hay 12px — phải tròn kiểu iOS)
- `backdrop-filter: blur(20px) saturate(150%)`
- `border: 0.5px solid var(--border-glass-default)`
- `padding: 20px 24px`
- `transition: transform 0.3s var(--spring), border-color 0.3s ease`
- Hover: `transform: translateY(-3px)`, `border-color: var(--border-glass-strong)`

Cell đặc biệt (accent cell tối) PHẢI:
- `background: var(--bento-accent-cell)` — màu tối, không glass
- Dùng để tạo contrast nhịp điệu visual — cứ 3-4 ô light thì có 1 ô dark

---

## 4. COMPONENT SPECIFICATIONS

### 4.1 Sidebar (Học từ Linear.app)

```
Width: 220px (collapsed: 60px)
Background: glass regular (blur 20px)
Border-right: 0.5px solid var(--border-glass-default)

Logo area:
  - Icon: 32x32 rounded-xl indigo bg
  - "Club OS" text: 15px weight 500
  - Subtile: "Quản lý CLB" 11px muted

Nav items:
  - Height: 36px per item
  - Padding: 0 12px
  - Gap giữa icon và label: 10px
  - Icon: 18px (Lucide outline)
  - Border-radius: 10px
  - Hover: bg glass-hover, icon color accent
  - Active: bg accent-dim, text accent, border-left 2px accent

Sections: nhóm các nav items
  - Label: t-label style, margin-bottom 4px

Bottom area:
  - Avatar + tên + role
  - Logout button
  - Theme toggle (sun/moon icon, animated)
```

### 4.2 Header Bar (Học từ Vercel)

```
Height: 56px
Background: glass ultra (blur 40px)
Border-bottom: 0.5px solid var(--border-glass-subtle)
Position: sticky top-0, z-index 50

Left: Breadcrumb "Tổng quan" / tên trang hiện tại
Center: Search bar (cmd+K trigger)
Right: Notification bell (badge số đỏ) + Avatar dropdown

Search bar khi focus:
  - Expand từ icon → full input
  - Background glass-thick
  - Placeholder: "Tìm kiếm sự kiện, thành viên..."
  - animation: width 200ms ease-out
```

### 4.3 Metric Card (Bento cell dạng số lớn)

```
Structure:
  ┌──────────────────────┐
  │ [icon 16px]  LABEL   │  ← t-label style, muted
  │                      │
  │ 84                   │  ← t-hero (font 3rem, weight 300)
  │ %                    │  ← unit nhỏ hơn (1.5rem, muted)
  │                      │
  │ ↑ +12% so với T5     │  ← trend indicator, success/danger color
  └──────────────────────┘

Animation khi load:
  - Số đếm từ 0 lên giá trị thật
  - Duration: 1.2s, easing: cubic-bezier(0.16, 1, 0.3, 1)
  - Delay: stagger 0.1s mỗi card

Trend indicator:
  - ↑ màu success (#34d399)
  - ↓ màu danger (#f87171)
  - → màu muted (không thay đổi)
```

### 4.4 Chart Style (Học từ Stripe Dashboard)

```
Bar chart:
  - Bars: border-radius top 4px, không có top-left bottom-left radius
  - Color: gradient từ accent đến accent-2 (indigo → violet)
  - Hover bar: brighten 20%, show tooltip
  - Tooltip: glass card, 12px text, arrow pointer
  - Grid lines: 1px dashed, opacity 0.08 — cực kỳ nhẹ
  - Axis labels: t-mono style, 10px, muted

Line chart (nếu có):
  - Line: 1.5px stroke, accent color
  - Area fill: gradient accent 20% → transparent
  - Dots: 4px filled, white border 2px
  - Hover dot: scale up 1.5x với spring animation

Circular progress (KPI):
  - SVG circle, stroke-dasharray animation
  - Background ring: glass-thick color
  - Progress ring: accent color, stroke-linecap round
  - Center text: t-display size, số %
  - Animation: draw từ 0 khi element vào viewport (IntersectionObserver)
```

### 4.5 Status Badge

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 100px; /* pill shape */
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.02em;
}

/* Dot trước text */
.badge::before {
  content: '';
  width: 5px; height: 5px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
  /* Pulse animation cho ONGOING */
  animation: pulse 2s infinite; /* chỉ cho status active */
}

.badge-success  { background: var(--success-dim); color: var(--success); }
.badge-warning  { background: var(--warning-dim); color: var(--warning); }
.badge-danger   { background: var(--danger-dim);  color: var(--danger); }
.badge-accent   { background: var(--accent-dim);  color: var(--accent-light); }
.badge-muted    { background: var(--glass-thick); color: var(--text-muted); }
```

### 4.6 Login Page (Học từ Raycast + Craft.do)

```
Layout: full-screen centered
Background dark: deep space #080810 + orbs tím/indigo
Background light: mesh gradient pastel

Card:
  - Width: 400px max
  - Glass card (layer 2)
  - Border-radius: 28px (lớn hơn thông thường)
  - Padding: 40px
  - Không có box-shadow

Logo:
  - Icon 52px, rounded-2xl, background accent
  - Fade-in + scale-up 0.6s ease-out khi load

Input fields:
  - Height: 44px (Apple HIG standard)
  - Background: glass-ultra
  - Border: glass-default, on-focus: border-glass-accent
  - Placeholder: text-ghost
  - Transition border 200ms

Button submit:
  - Background: accent (#6366f1)
  - Height: 44px, border-radius: 12px
  - Hover: brighten 10%, scale(1.01)
  - Active: scale(0.98)
  - Loading state: spinner icon replace text

Background animation:
  - 3 orbs floating với float animation, tốc độ khác nhau (6s, 9s, 12s)
  - Orbs blur radius: 80px - 120px
  - Không bao giờ dùng static background
```

---

## 5. ANIMATION SYSTEM CHI TIẾT (Học từ Emil Kowalski)

### 5.1 Page Load Sequence

```javascript
// Thứ tự animation khi load dashboard
// 0ms:    Sidebar fade in từ left (translateX -20px → 0)
// 100ms:  Header fade in từ top (translateY -10px → 0)
// 200ms:  Bento cell #1 scale in (scale 0.96 → 1) + fade
// 280ms:  Bento cell #2
// 360ms:  Bento cell #3
// ...     Mỗi cell delay thêm 80ms
// Sau tất cả cells: number counters bắt đầu chạy

// CSS implementation:
.bento-cell {
  animation: cellAppear 0.5s var(--ease-out) both;
}
.bento-cell:nth-child(1) { animation-delay: 0.2s; }
.bento-cell:nth-child(2) { animation-delay: 0.28s; }
.bento-cell:nth-child(3) { animation-delay: 0.36s; }
/* etc... */

@keyframes cellAppear {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(8px);
    filter: blur(4px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
    filter: blur(0);
  }
}
```

### 5.2 Theme Toggle Animation

```javascript
// Dark ↔ Light mode switch
// KHÔNG toggle ngay lập tức — phải có cross-fade mượt

const toggleTheme = () => {
  // 1. Add class transitioning
  document.documentElement.classList.add('theme-transitioning');

  // 2. Thêm overlay trắng/đen fade in
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 9999;
    background: ${isDark ? '#fff' : '#080810'};
    opacity: 0; transition: opacity 0.25s ease;
    pointer-events: none;
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.style.opacity = '0.6');

  setTimeout(() => {
    // 3. Switch theme
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
    // 4. Fade overlay out
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 300);
  }, 250);
};
```

### 5.3 Hover Micro-interactions

```css
/* Card hover */
.bento-cell {
  transition:
    transform 0.3s cubic-bezier(0.22, 0.68, 0, 1.2),
    border-color 0.2s ease,
    background 0.2s ease;
}
.bento-cell:hover {
  transform: translateY(-4px);
  border-color: var(--border-glass-strong);
  background: var(--glass-hover);
}

/* Button hover */
.btn-primary {
  transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1),
              background 0.2s ease;
}
.btn-primary:hover  { transform: scale(1.02); }
.btn-primary:active { transform: scale(0.97); }

/* Nav item hover */
.nav-item {
  transition: background 0.15s ease, color 0.15s ease;
  position: relative;
}
/* Animated underline cho active item */
.nav-item.active::after {
  content: '';
  position: absolute; left: 0; top: 50%;
  transform: translateY(-50%);
  width: 2px; height: 60%;
  background: var(--accent);
  border-radius: 0 2px 2px 0;
  animation: slideIn 0.3s var(--spring);
}
@keyframes slideIn {
  from { height: 0; opacity: 0; }
  to   { height: 60%; opacity: 1; }
}

/* Notification bell shake */
.bell-icon:hover {
  animation: bellShake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97);
}
@keyframes bellShake {
  0%,100% { transform: rotate(0); }
  20%     { transform: rotate(10deg); }
  40%     { transform: rotate(-10deg); }
  60%     { transform: rotate(6deg); }
  80%     { transform: rotate(-6deg); }
}
```

### 5.4 Orb Background Animation

```css
/* Chỉ xuất hiện ở DARK MODE */
.orb {
  position: fixed;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  z-index: 0;
}

.orb-1 {
  width: 500px; height: 500px;
  background: var(--orb-1-color);
  top: -100px; left: -100px;
  animation: orbFloat1 12s cubic-bezier(0.22,0.68,0,1.2) infinite alternate;
}

.orb-2 {
  width: 400px; height: 400px;
  background: var(--orb-2-color);
  bottom: -50px; right: -80px;
  animation: orbFloat2 9s cubic-bezier(0.22,0.68,0,1.2) infinite alternate;
}

.orb-3 {
  width: 300px; height: 300px;
  background: var(--orb-3-color);
  top: 50%; left: 50%;
  animation: orbFloat3 15s ease-in-out infinite alternate;
}

@keyframes orbFloat1 {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(60px, 40px) scale(1.1); }
}
@keyframes orbFloat2 {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(-40px, -60px) scale(0.9); }
}
@keyframes orbFloat3 {
  from { transform: translate(-50%, -50%) scale(1); }
  to   { transform: translate(-50%, -50%) scale(1.2) rotate(30deg); }
}
```

---

## 6. PAGE-BY-PAGE SPECIFICATIONS

### 6.1 Dashboard (đã mô tả ở Layout section)

### 6.2 Events / Lịch & Sự kiện

```
Layout: 2 cột
Left (col-8): Timeline / Calendar view
  - Hiển thị theo tuần, mỗi ngày là 1 cột
  - Event blocks: glass card nhỏ, màu theo loại (PRACTICE=indigo, REHEARSAL=violet, PERFORMANCE=pink)
  - Drag to reschedule (nếu có thể)

Right (col-4): Event detail panel
  - Slide in từ right khi click event
  - Status badge lớn
  - Danh sách sessions
  - Nút "Điểm danh" cho session đang diễn ra

Status color coding:
  DRAFT      → badge muted, icon ti-file-text
  PLANNING   → badge warning, icon ti-clock
  APPROVED   → badge accent, icon ti-check-circle
  ONGOING    → badge success + pulse dot
  COMPLETED  → badge muted, icon ti-circle-check
```

### 6.3 Task Management

```
Layout: Kanban columns (Học từ Linear Issues)
Columns: TODO | IN_PROGRESS | REVIEW | DONE | REJECTED

Column header:
  - Tên status + số lượng task
  - Màu dot theo status
  - Nút "+" tạo task mới

Task card:
  - Glass card, compact (padding 12px 16px)
  - Title: 13px weight 500
  - Priority badge: HIGH=danger, MEDIUM=warning, LOW=muted
  - Deadline: t-mono, đỏ nếu quá hạn
  - Assignee avatars (circles nhỏ 20px, overlap nhau)
  - Drag handle (hiện khi hover)

Drag & drop animation:
  - Card being dragged: scale(1.03), shadow tăng, opacity 0.8
  - Drop zone highlight: border-accent dashed, background accent-dim
  - Drop success: spring scale 0.97 → 1.02 → 1
```

### 6.4 AI Assistant Page

```
Layout: Chat interface
Background: full glass dark

Messages:
  - User: align right, background accent-dim, border-radius 20px 20px 4px 20px
  - AI: align left, background glass-regular, border-radius 20px 20px 20px 4px
  - Typing indicator: 3 dots với fade-in animation stagger

Input area:
  - Glass card, border-radius 100px (pill)
  - Padding: 12px 20px
  - Send button: icon ti-send, accent color
  - On focus: border-glass-accent

Suggested prompts (khi chưa có chat):
  - 4 pill buttons gợi ý câu hỏi
  - Hover: slide up 3px + background change
```

### 6.5 Payment / Hội phí

```
Layout: 2 bento sections
Top: Summary cards (tổng thu, chưa đóng, đã đóng)
Bottom left: Danh sách thành viên + trạng thái đóng phí
Bottom right: VNPay payment form

Payment form:
  - Amount input: font size lớn, center-aligned
  - Note field: glass textarea
  - "Thanh toán qua VNPay" button:
    * Background: VNPay red #dc2626 (brand color)
    * Logo VNPay nhỏ bên trái text
    * Hover: brighten + scale 1.01

Payment success state:
  - Confetti animation (canvas-confetti library)
  - Check icon scale in với spring
  - Success message fade in
```

---

## 7. RESPONSIVE & MOBILE

```
Breakpoints:
  Desktop: > 1280px → full bento grid 12 cols
  Tablet:  768-1280px → 6 cols, sidebar collapsed
  Mobile:  < 768px → 1 col, bottom navigation bar

Mobile navigation:
  - Bottom bar thay sidebar
  - 5 icons: Home, Events, Tasks, Eval, Profile
  - Active icon: scale up + accent dot
  - Safe area bottom: env(safe-area-inset-bottom)
```

---

## 8. IMPLEMENTATION CHECKLIST

Trước khi submit code, kiểm tra:

- [ ] Tất cả card đều có `backdrop-filter: blur()` — không có solid bg thuần
- [ ] `border-radius: 20px` cho tất cả bento cells (không phải 8px hay 12px)
- [ ] Font là DM Sans — không phải Inter, Roboto, hay Arial
- [ ] Number counters có animation từ 0
- [ ] Bento grid bất đối xứng — không đều như table
- [ ] Orb animations chỉ ở dark mode
- [ ] Theme toggle có cross-fade 0.5s
- [ ] Hover trên card có translateY(-4px) với spring easing
- [ ] Status badges có pulse dot cho trạng thái ACTIVE/ONGOING
- [ ] Stagger animation khi load trang (mỗi cell delay 80ms)
- [ ] Mobile responsive với bottom navigation
- [ ] Không có box-shadow thô — dùng glass border thay thế
- [ ] Accent color #6366f1 xuyên suốt cả 2 mode

---

*Prompt này được thiết kế dựa trên nghiên cứu từ: Linear.app, Vercel, Raycast, Craft.do, Stripe, Apple HIG iOS 17, Basement Studio, và Emil Kowalski animations.*
*Version: 1.0 — Club OS Design System 2025*

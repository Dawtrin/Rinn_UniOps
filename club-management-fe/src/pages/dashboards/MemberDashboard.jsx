import { useEffect, useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, startOfWeek, addDays } from 'date-fns';
import api from '../../api';
import {
  CheckSquare, CalendarDays, MessageCircle, User,
  Clock, MapPin, Users, ChevronRight, Flame,
  LayoutDashboard
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

// ─── Animated counter ───────────────────────────────────────
function CountUp({ to, duration = 1200 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(eased * to));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [to, duration]);
  return val;
}

// ─── Circular progress ───────────────────────────────────────
function CircleProgress({ pct, size = 72, stroke = 6, color = '#6366f1', label }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(99,102,241,0.1)" strokeWidth={stroke} />
        <motion.circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - circ * (pct / 100) }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
        />
      </svg>
      <div style={{ textAlign: 'center', zIndex: 1 }}>
        <div style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--text-1)' }}>{pct}%</div>
        <div style={{ fontSize: '0.52rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      </div>
    </div>
  );
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  show:   { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

const WEEK_DAYS = ['T2','T3','T4','T5','T6','T7','CN'];
const TODAY_IDX = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

const STATUS_COLOR = { TODO: 'var(--text-3)', IN_PROGRESS: '#6366f1', REVIEW: 'var(--warning)', DONE: 'var(--success)', REJECTED: 'var(--danger)' };
const STATUS_LABEL = { TODO: 'Chưa làm', IN_PROGRESS: 'Đang làm', REVIEW: 'Chờ duyệt', DONE: 'Hoàn thành', REJECTED: 'Bị từ chối' };

const AVATAR_COLORS = ['#6366f1','#8b5cf6','#38bdf8','#34d399','#f59e0b','#f43f5e','#a78bfa','#fb923c'];
const randColor = (id) => AVATAR_COLORS[id % AVATAR_COLORS.length];
const getInitials = (n) => n?.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase() || '?';

export default function MemberDashboard({ user }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [myTasks, setMyTasks]   = useState([]);
  const [events, setEvents]     = useState([]);
  const [me, setMe]             = useState(null);
  const [loading, setLoading]   = useState(true);
  const [checkedIn, setCheckedIn] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamName, setTeamName]       = useState('Đội của bạn');
  const [schedule, setSchedule]       = useState([]);

  useEffect(() => {
    // Tải lịch tuần thực tế để chấm hasEvent
    const today = new Date();
    // Start of current week (Monday)
    const weekStartVal = startOfWeek(today, { weekStartsOn: 1 });
    const weekStr = format(weekStartVal, 'yyyy-MM-dd');

    Promise.all([
      api.get('/tasks/my-tasks').catch(() => ({ data: [] })),
      api.get('/events').catch(() => ({ data: [] })),
      api.get('/users/me').catch(() => ({ data: null })),
      api.get('/chat/rooms').catch(() => ({ data: [] })),
      api.get(`/schedules/my-week?week=${weekStr}`).catch(() => ({ data: null }))
    ]).then(([t, e, u, rRes, schedRes]) => {
      setMyTasks(t.data?.data || t.data || []);
      setEvents(e.data?.data || e.data || []);
      
      const meData = u.data?.data || u.data || user;
      setMe(meData);

      // Load team info from chat rooms
      const roomsList = rRes.data?.data || rRes.data || [];
      const teamRoom = roomsList.find(r => r.type === 'TEAM');
      if (teamRoom) {
        setTeamName(teamRoom.name);
        api.get(`/chat/rooms/${teamRoom.id}/members`)
          .then(mRes => {
            const membersList = mRes.data?.data || mRes.data || [];
            setTeamMembers(membersList.map(m => ({
              name: m.fullName || m.name,
              initials: getInitials(m.fullName || m.name || ''),
              color: randColor(m.id || 0)
            })));
          })
          .catch(() => {});
      }

      // Load schedule
      const schedData = schedRes.data?.data || schedRes.data;
      if (schedData && schedData.days) {
        const daysMap = schedData.days;
        const formattedDays = [];
        for (let d = 1; d <= 7; d++) {
          const slots = daysMap[d] || [];
          if (slots.length > 0) {
            const date = addDays(weekStartVal, d - 1);
            formattedDays.push({
              date,
              dayIndex: d,
              slots
            });
          }
        }
        setSchedule(formattedDays);
      }
    }).finally(() => setLoading(false));
  }, [user]);

  const todoTasks       = myTasks.filter(t => t.status === 'TODO');
  const inProgressTasks = myTasks.filter(t => t.status === 'IN_PROGRESS');
  const doneTasks       = myTasks.filter(t => t.status === 'DONE');
  const totalTasks      = myTasks.length;
  const taskPct         = totalTasks ? Math.round((doneTasks.length / totalTasks) * 100) : 0;

  const xp          = me?.xp ?? user?.xp ?? 0;
  const level       = me?.level ?? user?.level ?? 1;
  const xpInLevel   = xp % 100;
  const streak      = me?.streak ?? 0;
  const fullName    = me?.fullName || user?.fullName || user?.full_name || 'Bạn';
  const firstName   = fullName.split(' ').pop();

  // Find today's session from loaded schedule
  const todayDayIndex = new Date().getDay() === 0 ? 7 : new Date().getDay();
  const todayScheduleDay = schedule.find(s => s.dayIndex === todayDayIndex);
  const todaySession = todayScheduleDay && todayScheduleDay.slots?.length > 0 ? todayScheduleDay.slots[0] : null;

  const attendancePct = me?.attendanceRate ?? 100;

  const now = new Date();
  const dateStr = now.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

  const handleCheckIn = async () => {
    if (!todaySession) return;
    try {
      await api.post('/attendance/check-in', { sessionId: todaySession.id, note: '' });
      toast('Điểm danh thành công! +10 XP 🎯', 'success');
      setCheckedIn(true);
    } catch (err) {
      toast(err.response?.data?.message || 'Lỗi khi điểm danh', 'error');
    }
  };

  if (loading) return (
    <div className="loading-page">
      <div className="spinner" />
      <p>Đang tải</p>
    </div>
  );

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ maxWidth: 720, margin: '0 auto' }}>
      
      {/* Top Header Row for Member Dashboard */}
      <motion.div variants={item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: '0 4px' }}>
        <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>BẢNG ĐIỀU KHIỂN</span>
        <button 
          className="btn btn-ghost btn-sm" 
          onClick={() => navigate('/apply')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--text-2)', padding: '4px 8px' }}
        >
          <User size={13} /> Trang ứng tuyển công khai
        </button>
      </motion.div>

      {/* ── HERO SECTION ── */}
      <motion.div variants={item} className="member-hero">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div className="member-hero-greeting">Xin chào, {firstName}! 👋</div>
            <div className="member-hero-date">{dateStr}</div>
            <motion.div
              className="member-hero-streak"
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Flame size={14} />
              Streak {streak} ngày liên tiếp!
            </motion.div>
          </div>
          {/* XP bubble */}
          <div style={{ textAlign: 'right', background: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: '10px 16px', backdropFilter: 'blur(8px)' }}>
            <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.7 }}>Cấp độ</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1 }}>{level}</div>
            <div style={{ fontSize: '0.68rem', opacity: 0.75, fontFamily: 'var(--font-mono)' }}>{xp} XP</div>
          </div>
        </div>
        {/* XP bar */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: '0.65rem', opacity: 0.7 }}>
            <span>XP tiến độ cấp {level}</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{xpInLevel}/100</span>
          </div>
          <div style={{ height: 5, background: 'rgba(255,255,255,0.2)', borderRadius: 999, overflow: 'hidden' }}>
            <motion.div
              style={{ height: '100%', background: '#fff', borderRadius: 999 }}
              initial={{ width: 0 }}
              animate={{ width: `${xpInLevel}%` }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
            />
          </div>
        </div>
      </motion.div>

      {/* ── HÔM NAY CỦA BẠN ── */}
      <motion.div variants={item}>
        <div className="section-title" style={{ marginBottom: 10 }}>HÔM NAY CỦA BẠN</div>
        {todaySession ? (
          <div className="today-session-card">
            <div className="today-session-icon">🎵</div>
            <div style={{ flex: 1 }}>
              <div className="today-session-time">{todaySession.time}</div>
              <div className="today-session-meta">
                {todaySession.title}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5, fontSize: '0.72rem', color: 'var(--text-3)' }}>
                <MapPin size={11} />
                {todaySession.location}
              </div>
            </div>
            <button
              className="checkin-btn"
              onClick={handleCheckIn}
              disabled={checkedIn}
              style={checkedIn ? { background: 'linear-gradient(135deg, #34d399, #10b981)' } : {}}
            >
              {checkedIn ? '✓ Đã điểm danh' : 'Check-in'}
            </button>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '28px', marginBottom: 16 }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>😊</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-1)' }}>Hôm nay không có buổi tập</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 4 }}>Ngày nghỉ — nạp năng lượng nhé!</div>
          </div>
        )}
      </motion.div>

      {/* ── TIẾN ĐỘ THÁNG NÀY ── */}
      <motion.div variants={item}>
        <div className="section-title" style={{ marginBottom: 10 }}>TIẾN ĐỘ THÁNG NÀY</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px' }}>
            <CircleProgress pct={attendancePct} size={68} color="#6366f1" label="Chuyên cần" />
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Chuyên cần</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.05em', color: 'var(--text-1)', marginTop: 3 }}>
                <CountUp to={attendancePct} />%
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--success)', marginTop: 3, fontWeight: 600 }}>↑ Tốt hơn tháng trước</div>
            </div>
          </div>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px' }}>
            <CircleProgress pct={taskPct} size={68} color="#10b981" label="Công việc" />
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tasks</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.05em', color: 'var(--text-1)', marginTop: 3 }}>
                {doneTasks.length}/{totalTasks}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: 3 }}>hoàn thành</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── CÔNG VIỆC CẦN LÀM ── */}
      <motion.div variants={item}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div className="section-title">CÔNG VIỆC CẦN LÀM</div>
          <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.7rem', gap: 4 }} onClick={() => navigate('/tasks')}>
            Xem tất cả <ChevronRight size={12} />
          </button>
        </div>
        {myTasks.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-3)' }}>
            <CheckSquare size={24} style={{ marginBottom: 6, display: 'inline' }} />
            <div style={{ fontSize: '0.82rem' }}>Bạn không có công việc nào chưa hoàn thành</div>
          </div>
        ) : (
          myTasks.slice(0, 5).map((task, i) => (
            <motion.div
              key={task.id} className="my-task-row"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.07, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => navigate('/tasks')}
              style={{ cursor: 'pointer' }}
            >
              <div className="my-task-status-dot" style={{ background: STATUS_COLOR[task.status] || 'var(--border)' }} />
              <div className="my-task-title">{task.title}</div>
              <span style={{ fontSize: '0.68rem', color: STATUS_COLOR[task.status], fontWeight: 500, whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
                {STATUS_LABEL[task.status]}
              </span>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* ── LỊCH TUẦN NÀY ── */}
      <motion.div variants={item} style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div className="section-title">LỊCH TUẦN NÀY</div>
          <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.7rem', gap: 4 }} onClick={() => navigate('/schedule')}>
            Xem lịch <ChevronRight size={12} />
          </button>
        </div>
        <div className="card" style={{ padding: '14px 16px' }}>
          <div className="week-dots-row">
            {WEEK_DAYS.map((d, i) => {
              const targetDayOfWeek = i === 6 ? 1 : i + 2;
              const dayData = schedule.find(s => s.dayIndex === targetDayOfWeek);
              const hasEvent = dayData && dayData.slots?.length > 0;
              const isToday = i === TODAY_IDX;
              return (
                <div key={d} className={`week-dot-day ${isToday ? 'today' : ''}`} onClick={() => navigate('/schedule')}>
                  <div className={`week-dot-label ${isToday ? 'today' : ''}`}>{d}</div>
                  <div className={`week-dot-circle ${hasEvent ? 'has-event' : isToday ? 'today-circle' : 'empty'}`}>
                    {hasEvent ? <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', display: 'inline-block' }} /> : isToday ? '●' : '·'}
                  </div>
                  {hasEvent && <div style={{ fontSize: '0.5rem', color: '#6366f1', fontWeight: 600 }}>{dayData.slots[0].startTime?.slice(0, 2)}h</div>}
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* ── ĐỘI CỦA BẠN ── */}
      <motion.div variants={item} style={{ marginTop: 24 }}>
        <div className="section-title" style={{ marginBottom: 10 }}>ĐỘI CỦA BẠN — {teamName}</div>
        <div className="card" style={{ padding: '14px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {teamMembers.length === 0 ? (
              <div style={{ flex: 1, fontSize: '0.82rem', color: 'var(--text-3)' }}>Bạn chưa được phân công vào đội nào</div>
            ) : (
              <>
                <div style={{ display: 'flex' }}>
                  {teamMembers.map((m, i) => (
                    <div
                      key={m.name}
                      style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: `linear-gradient(135deg, ${m.color}, ${m.color}aa)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.7rem', fontWeight: 700, color: '#fff',
                        border: '2px solid var(--bg-canvas)',
                        marginLeft: i > 0 ? -10 : 0, zIndex: teamMembers.length - i,
                        flexShrink: 0,
                      }}
                      title={m.name}
                    >
                      {m.initials}
                    </div>
                  ))}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-1)' }}>{teamMembers.length} thành viên</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>Đội đang hoạt động</div>
                </div>
              </>
            )}
            <button className="btn btn-ghost btn-sm" style={{ gap: 5, fontSize: '0.75rem' }} onClick={() => navigate('/chat')}>
              <MessageCircle size={13} /> Chat nhóm
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── THÀNH TÍCH ── */}
      <motion.div variants={item} style={{ marginTop: 24, marginBottom: 40 }}>
        <div className="section-title" style={{ marginBottom: 10 }}>THÀNH TÍCH</div>
        <div className="achievement-grid">
          {[
            { icon: '🔥', name: 'Tích cực',      desc: 'Đạt trên 100 XP',     unlocked: xp >= 100 },
            { icon: '🎯', name: 'Task Master',   desc: 'Đạt trên 500 XP', unlocked: xp >= 500 },
            { icon: '⭐', name: 'Kiên định',     desc: 'Đạt trên 800 XP',    unlocked: xp >= 800 },
            { icon: '🏆', name: 'KPI Champion', desc: 'Đạt trên 1000 XP',  unlocked: xp >= 1000 },
          ].map(b => (
            <motion.div
              key={b.name}
              className={`achievement-badge ${b.unlocked ? 'unlocked' : 'locked'}`}
              whileHover={b.unlocked ? { scale: 1.05 } : {}}
            >
              <span className="achievement-icon">{b.icon}</span>
              <div>
                <div className="achievement-name">{b.name}</div>
                <div className="achievement-desc">{b.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── BOTTOM NAV (mobile) ── */}
      <nav className="bottom-nav">
        {[
          { path: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Home' },
          { path: '/schedule',  icon: <CalendarDays size={20} />,    label: 'Lịch' },
          { path: '/tasks',     icon: <CheckSquare size={20} />,     label: 'Tasks' },
          { path: '/chat',      icon: <MessageCircle size={20} />,   label: 'Chat' },
          { path: '/evaluations',icon: <User size={20} />,           label: 'Tôi' },
        ].map(nav => (
          <NavLink key={nav.path} to={nav.path} className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
            {nav.icon}
            <span>{nav.label}</span>
          </NavLink>
        ))}
      </nav>
    </motion.div>
  );
}

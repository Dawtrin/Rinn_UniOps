import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, startOfWeek } from 'date-fns';
import api from '../../api';
import {
  Users, CalendarDays, CheckSquare, Activity, Shield,
  TrendingUp, TrendingDown, AlertTriangle, ArrowRight,
  Network, Clock, UserCheck, BarChart3
} from 'lucide-react';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, PointElement, LineElement, Filler
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler);

const chartFont = { family: 'DM Mono, monospace', size: 10 };
const chartMuted = 'rgba(255,255,255,0.25)';

const AVATAR_COLORS = ['#6366f1','#8b5cf6','#38bdf8','#34d399','#f59e0b','#f43f5e','#a78bfa','#fb923c'];
const randColor = (id) => AVATAR_COLORS[id % AVATAR_COLORS.length];

// ─── Animated counter ────────────────────────────────────────
function CountUp({ to, duration = 1400 }) {
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

// ─── Circular progress ring ──────────────────────────────────
function ProgressRing({ pct, size = 56, stroke = 5, color = '#6366f1' }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (pct / 100);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <motion.circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
      />
    </svg>
  );
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = {
  hidden: { opacity: 0, y: 14, scale: 0.96, filter: 'blur(4px)' },
  show:   { opacity: 1, y: 0,  scale: 1,    filter: 'blur(0px)', transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export default function AdminDashboard({ user }) {
  const navigate = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks]     = useState([]);
  const [attentionList, setAttentionList] = useState([]);
  const [orgSummary, setOrgSummary]       = useState([]);
  const [weekSlots, setWeekSlots]         = useState([]);

  useEffect(() => {
    // 1. Fetch dashboard stats
    api.get('/analytics/dashboard')
      .then(r => {
        const resData = r.data?.data || r.data;
        if (resData && resData.tasksByStatus) {
          const done = resData.tasksByStatus.DONE || 0;
          const total = Object.values(resData.tasksByStatus).reduce((sum, count) => sum + count, 0);
          resData.taskCompletionPct = total > 0 ? Math.round((done / total) * 100) : 0;
        } else if (resData) {
          resData.taskCompletionPct = 0;
        }
        setData(resData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // 2. Fetch tasks
    api.get('/tasks')
      .then(r => {
        const allTasks = r.data?.data || r.data || [];
        const pending = allTasks.filter(t => t.status !== 'DONE').slice(0, 3);
        setTasks(pending);
      })
      .catch(() => {});

    // 3. Fetch unassigned members for attention list
    api.get('/hr/unassigned-members')
      .then(r => {
        const list = r.data?.data || r.data || [];
        setAttentionList(list.map(m => ({
          name: m.fullName || m.name,
          reason: 'Chưa phân công vào đội',
          type: 'warning',
          icon: '⚠️'
        })));
      })
      .catch(() => {});

    // 4. Fetch org summary
    api.get('/hr/org-chart')
      .then(r => {
        const orgData = r.data?.data || r.data || [];
        const summary = orgData.map(dept => {
          const teamsCount = dept.teams?.length || 0;
          const membersCount = dept.teams?.reduce((sum, t) => sum + (t.memberCount || t.members?.length || 0), 0) || 0;
          return {
            dept: dept.name,
            teams: teamsCount,
            members: membersCount,
            color: dept.deptColor || randColor(dept.id)
          };
        });
        setOrgSummary(summary);
      })
      .catch(() => {});

    // 5. Fetch schedules for this week
    const weekStr = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    api.get(`/schedules?scopeType=CLB&scopeId=1&week=${weekStr}`)
      .then(r => {
        const list = r.data?.data || r.data || [];
        if (Array.isArray(list) && list.length > 0 && list[0] && list[0].id) {
          api.get(`/schedules/${list[0].id}/slots`)
            .then(sr => {
              const slots = sr.data?.data || sr.data || [];
              setWeekSlots(Array.isArray(slots) ? slots : []);
            });
        }
      })
      .catch(() => {});
  }, []);

  const kpis = [
    {
      label: 'Tổng thành viên', value: data?.totalMembers ?? 0,
      icon: <Users size={18} />, color: '#c084fc', bg: 'rgba(192,132,252,0.12)',
      trend: '=', trendUp: null,
    },
    {
      label: 'Đang hoạt động', value: data?.totalMembers ?? 0,
      icon: <Activity size={18} />, color: '#38bdf8', bg: 'rgba(56,189,248,0.12)',
      trend: '=', trendUp: null,
    },
    {
      label: 'Sự kiện tháng này', value: data?.totalEvents ?? 0,
      icon: <CalendarDays size={18} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',
      trend: '=', trendUp: null,
    },
    {
      label: 'Task hoàn thành', value: data?.taskCompletionPct ?? 0,
      icon: <CheckSquare size={18} />, color: '#34d399', bg: 'rgba(52,211,153,0.12)',
      suffix: '%', pct: data?.taskCompletionPct ?? 0, isRing: true,
    },
  ];

  // Attendance line chart data
  const monthlyArr = Array.isArray(data?.monthlyAttendance) ? data.monthlyAttendance : [];
  const monthLabels = monthlyArr.length ? monthlyArr.map(m => m.month) : ['T1','T2','T3','T4','T5','T6'];
  const monthValues = monthlyArr.length ? monthlyArr.map(m => m.attendanceRate) : [0, 0, 0, 0, 0, 0];
  const lineData = {
    labels: monthLabels,
    datasets: [{
      label: 'Chuyên cần (%)',
      data: monthValues,
      borderColor: '#6366f1',
      borderWidth: 2,
      pointBackgroundColor: '#6366f1',
      pointRadius: 4,
      fill: true,
      backgroundColor: 'rgba(99,102,241,0.08)',
      tension: 0.4,
    }],
  };
  const lineOpts = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { min: 0, max: 100, ticks: { color: chartMuted, font: chartFont, callback: v => v + '%' }, grid: { color: 'rgba(255,255,255,0.04)' } },
      x: { ticks: { color: chartMuted, font: chartFont }, grid: { display: false } },
    },
  };

  // KPI donut
  const excellentCount = data?.evaluationsByGrade?.EXCELLENT || 0;
  const goodCount      = data?.evaluationsByGrade?.GOOD || 0;
  const passCount      = data?.evaluationsByGrade?.PASS || 0;
  const failCount      = data?.evaluationsByGrade?.FAIL || 0;
  const donutValues = [excellentCount, goodCount, passCount, failCount];
  const hasKpiData = excellentCount || goodCount || passCount || failCount;

  const kpiData = {
    labels: ['Xuất sắc', 'Tốt', 'Đạt', 'Không đạt'],
    datasets: [{
      data: hasKpiData ? donutValues : [1, 1, 1, 1], // fallback visually if empty
      backgroundColor: hasKpiData ? ['#6366f1','#34d399','#f59e0b','#ef4444'] : ['rgba(255,255,255,0.04)','rgba(255,255,255,0.04)','rgba(255,255,255,0.04)','rgba(255,255,255,0.04)'],
      borderWidth: 0,
      borderRadius: 4
    }],
  };
  const donutOpts = { responsive: true, cutout: '68%', plugins: { legend: { position: 'bottom', labels: { color: chartMuted, font: chartFont, boxWidth: 10, padding: 12 } } } };

  if (loading) return <div className="loading-page"><div className="spinner" /><p>Đang tải</p></div>;

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {/* Page header */}
      <motion.div variants={item} style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(192,132,252,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={20} style={{ color: '#c084fc' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 300, letterSpacing: '-0.04em', color: 'var(--text-1)', margin: 0 }}>
              Bảng điều khiển
            </h1>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: 2 }}>
              Xin chào, <span style={{ color: '#c084fc', fontWeight: 500 }}>{user?.fullName || user?.full_name}</span> — Chủ nhiệm CLB · Tổng quan toàn hệ thống
            </div>
          </div>
        </div>
        <button 
          className="btn btn-primary btn-sm" 
          onClick={() => navigate('/apply')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: '10px' }}
        >
          <UserCheck size={14} /> Trang ứng tuyển công khai
        </button>
      </motion.div>

      {/* ── ROW 1: KPI cards (4 × col-3) ── */}
      <div className="bento-grid-v2" style={{ marginBottom: 14 }}>
        {kpis.map((k, i) => (
          <motion.div key={k.label} variants={item} className={`kpi-card-v2 bento-col-3`}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: k.color }}>{k.icon}</span>
              </div>
              {k.isRing ? (
                <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ProgressRing pct={k.pct} size={50} stroke={4} color={k.color} />
                  <span style={{ position: 'absolute', fontSize: '0.6rem', fontWeight: 700, color: k.color, fontFamily: 'var(--font-mono)' }}>{k.pct}%</span>
                </div>
              ) : k.trend ? (
                <span className={`kpi-trend ${k.trendUp ? 'up' : k.trendUp === false ? 'down' : ''}`}>
                  {k.trendUp === true ? <TrendingUp size={12} /> : k.trendUp === false ? <TrendingDown size={12} /> : null}
                  {k.trend}
                </span>
              ) : null}
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 300, letterSpacing: '-0.06em', color: k.color, lineHeight: 1, fontFamily: 'var(--font-mono)' }}>
              <CountUp to={Number(k.value)} duration={1100 + i * 150} />{k.suffix || ''}
            </div>
            <div style={{ fontSize: '0.62rem', fontWeight: 500, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 6 }}>
              {k.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── ROW 2: Line chart (col-8) + Donut KPI (col-4) ── */}
      <div className="bento-grid-v2" style={{ marginBottom: 14 }}>
        <motion.div variants={item} className="kpi-card-v2 bento-col-8">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Chuyên cần theo tháng</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-1)', marginTop: 2, letterSpacing: '-0.03em' }}>
                {monthValues[monthValues.length - 1]}% <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 600 }}>↑ tháng này</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['Tất cả', 'Ban', 'Đội'].map(f => (
                <button key={f} className="btn btn-ghost btn-sm" style={{ fontSize: '0.68rem', padding: '3px 10px' }}>{f}</button>
              ))}
            </div>
          </div>
          <Line data={lineData} options={lineOpts} />
        </motion.div>

        <motion.div variants={item} className="kpi-card-v2 bento-col-4">
          <div style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>
            Phân bố KPI xếp loại
          </div>
          <Doughnut data={kpiData} options={donutOpts} />
        </motion.div>
      </div>

      {/* ── ROW 3: Mini org chart (col-6) + Cần chú ý (col-6) ── */}
      <div className="bento-grid-v2" style={{ marginBottom: 14 }}>
        <motion.div variants={item} className="kpi-card-v2 bento-col-6">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sơ đồ tổ chức</div>
            <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.68rem', gap: 4 }} onClick={() => navigate('/org-chart')}>
              Xem đầy đủ <ArrowRight size={11} />
            </button>
          </div>
          {orgSummary.map(o => (
            <div key={o.dept} className="attention-item" style={{ borderLeft: `2px solid ${o.color}60` }}
              onClick={() => navigate('/hr')}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: o.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 500, color: o.warn ? 'var(--warning)' : 'var(--text-1)' }}>{o.dept}</div>
                {o.teams > 0 && <div style={{ fontSize: '0.68rem', color: 'var(--text-3)' }}>{o.teams} đội · {o.members} thành viên</div>}
              </div>
              {o.warn && <span className="badge badge-yellow">{o.members} chờ phân công</span>}
              {!o.warn && <span className="badge badge-neutral" style={{ fontFamily: 'var(--font-mono)' }}>{o.members}</span>}
            </div>
          ))}
        </motion.div>

        <motion.div variants={item} className="kpi-card-v2 bento-col-6">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              <span style={{ color: '#f59e0b' }}>⚠</span>&nbsp;Cần chú ý
            </div>
            <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.68rem', gap: 4 }} onClick={() => navigate('/hr')}>
              Quản lý <ArrowRight size={11} />
            </button>
          </div>
          {attentionList.map(a => (
            <div key={a.name} className="attention-item">
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: a.type === 'warning' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                {a.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-1)' }}>{a.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: 2 }}>{a.reason}</div>
              </div>
              <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.66rem' }}>Xem</button>
            </div>
          ))}
          {attentionList.length === 0 && (
            <div className="empty-state" style={{ padding: 24 }}>
              <CheckSquare size={28} /><p>Tất cả ổn định 🎉</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── ROW 4: Activity feed (col-4) + Mini schedule (col-4) + Tasks (col-4) ── */}
      <div className="bento-grid-v2">
        <motion.div variants={item} className="kpi-card-v2 bento-col-4">
          <div style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Hoạt động gần đây</div>
          <div className="activity-feed" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180, flexDirection: 'column', gap: 10, color: 'var(--text-3)' }}>
            <Clock size={24} />
            <span style={{ fontSize: '0.78rem' }}>Không có hoạt động mới</span>
          </div>
        </motion.div>

        <motion.div variants={item} className="kpi-card-v2 bento-col-4">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Lịch tuần này</div>
            <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.68rem', gap: 4 }} onClick={() => navigate('/schedule')}>
              Xem <ArrowRight size={11} />
            </button>
          </div>
          <div className="activity-feed">
            {weekSlots.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180, flexDirection: 'column', gap: 10, color: 'var(--text-3)' }}>
                <CalendarDays size={24} />
                <span style={{ fontSize: '0.78rem' }}>Không có lịch tập tuần này</span>
              </div>
            ) : (
              weekSlots.slice(0, 6).map(s => {
                const daysShort = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                const dayLabel = daysShort[s.dayOfWeek - 1] || 'CN';
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '0.5px solid var(--border-glass-subtle)' }}>
                    <div style={{ width: 24, fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{dayLabel}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ background: `${s.color || '#6366f1'}20`, borderRadius: 4, padding: '2px 7px', fontSize: '0.65rem', color: s.color || '#6366f1', fontWeight: 600, display: 'inline-block' }}>
                        {s.startTime?.slice(0, 5)} {s.title}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>

        <motion.div variants={item} className="kpi-card-v2 bento-col-4">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Task sắp đến hạn</div>
            <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.68rem', gap: 4 }} onClick={() => navigate('/tasks')}>
              Xem tất cả <ArrowRight size={11} />
            </button>
          </div>
          <div className="activity-feed">
            {tasks.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180, flexDirection: 'column', gap: 10, color: 'var(--text-3)' }}>
                <CheckSquare size={24} />
                <span style={{ fontSize: '0.78rem' }}>Không có công việc chưa hoàn thành</span>
              </div>
            ) : (
              tasks.map(t => (
                <div key={t.id} className="attention-item" style={{ borderLeft: t.priority === 'HIGH' ? '2px solid var(--danger)' : '2px solid var(--border-glass-default)' }} onClick={() => navigate('/tasks')} role="button">
                  <CheckSquare size={14} style={{ color: t.priority === 'HIGH' ? 'var(--danger)' : 'var(--text-3)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-1)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{t.title}</div>
                    <div style={{ fontSize: '0.68rem', color: t.priority === 'HIGH' ? 'var(--danger)' : 'var(--text-3)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                      {t.deadline ? new Date(t.deadline).toLocaleDateString('vi-VN') : 'Không hạn'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

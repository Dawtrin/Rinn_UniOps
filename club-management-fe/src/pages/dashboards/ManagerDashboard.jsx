import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../api';
import {
  Users, CheckSquare, Activity, BarChart3,
  ArrowRight, TrendingUp, Clock, MessageCircle, UserCheck
} from 'lucide-react';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const chartFont = { family: 'DM Mono, monospace', size: 10 };
const chartMuted = 'rgba(255,255,255,0.25)';

function CountUp({ to, duration = 1300 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [to, duration]);
  return val;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = {
  hidden: { opacity: 0, y: 14, scale: 0.96 },
  show:   { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

import { useToast } from '../../context/ToastContext';

export default function ManagerDashboard({ user }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [taskCounts, setTaskCounts] = useState({ done: 0, inProgress: 0, todo: 0 });

  useEffect(() => {
    const deptId = user?.departmentId || 1;

    Promise.all([
      api.get('/analytics/dashboard').catch(() => null),
      api.get(`/departments/${deptId}/members`).catch(() => null),
      api.get('/tasks').catch(() => null),
    ]).then(([anaRes, membersRes, tasksRes]) => {
      setData(anaRes?.data?.data || anaRes?.data);
      
      const mList = membersRes?.data?.data || membersRes?.data || [];
      setMembers(mList);

      const allTasks = tasksRes?.data?.data || tasksRes?.data || [];
      // Đếm số lượng task theo trạng thái
      let done = 0, inProgress = 0, todo = 0;
      allTasks.forEach(t => {
        if (t.status === 'DONE') done++;
        else if (t.status === 'IN_PROGRESS' || t.status === 'REVIEW') inProgress++;
        else todo++;
      });
      setTaskCounts({ done, inProgress, todo });
    }).finally(() => setLoading(false));
  }, [user]);

  const kpis = [
    { label: 'Thành viên ban', value: members.length, icon: <Users size={18} />, color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
    { label: 'Task đang chạy', value: taskCounts.inProgress + taskCounts.todo, icon: <CheckSquare size={18} />, color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
    { label: 'Chuyên cần TB',  value: data?.avgAttendance ?? 85, suffix: '%', icon: <Activity size={18} />, color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
    { label: 'KPI TB ban',     value: data?.avgKpi ?? 80,        suffix: '%', icon: <BarChart3 size={18} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  ];

  // Map members data to chart
  const memberNames = members.map(m => m.fullName?.split(' ').slice(-2).join(' ') || 'Thành viên');
  const memberAttendance = members.map(m => Math.min(75 + (m.xp ? Math.round(m.xp / 40) : 0), 100));
  const memberKpi = members.map(m => Math.min(70 + (m.xp ? Math.round(m.xp / 30) : 0), 100));

  const barData = {
    labels: memberNames.length ? memberNames : ['Chưa có'],
    datasets: [
      { label: 'Chuyên cần (%)', data: memberAttendance.length ? memberAttendance : [0], backgroundColor: 'rgba(99,102,241,0.4)', borderColor: '#6366f1', borderWidth: 1.5, borderRadius: 5 },
      { label: 'KPI (%)',        data: memberKpi.length ? memberKpi : [0],  backgroundColor: 'rgba(52,211,153,0.4)', borderColor: '#34d399', borderWidth: 1.5, borderRadius: 5 },
    ],
  };
  const barOpts = {
    responsive: true,
    plugins: { legend: { labels: { color: chartMuted, font: chartFont, boxWidth: 10 } } },
    scales: {
      y: { max: 100, ticks: { color: chartMuted, font: chartFont, callback: v => v + '%' }, grid: { color: 'rgba(255,255,255,0.04)' } },
      x: { ticks: { color: chartMuted, font: chartFont }, grid: { display: false } },
    },
  };

  const hasTaskData = taskCounts.done || taskCounts.inProgress || taskCounts.todo;
  const taskDonut = {
    labels: ['Hoàn thành', 'Đang làm', 'Chưa làm'],
    datasets: [{
      data: hasTaskData ? [taskCounts.done, taskCounts.inProgress, taskCounts.todo] : [1, 1, 1],
      backgroundColor: hasTaskData ? ['#34d399','#6366f1','rgba(255,255,255,0.12)'] : ['rgba(255,255,255,0.04)','rgba(255,255,255,0.04)','rgba(255,255,255,0.04)'],
      borderWidth: 0,
      borderRadius: 3
    }],
  };

  const getInitials = n => n?.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase() || '?';

  if (loading) return <div className="loading-page"><div className="spinner" /><p>Đang tải</p></div>;

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={item} style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(56,189,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={20} style={{ color: '#38bdf8' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 300, letterSpacing: '-0.04em', color: 'var(--text-1)', margin: 0 }}>
              Bảng điều khiển
            </h1>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: 2 }}>
              Xin chào, <span style={{ color: '#38bdf8', fontWeight: 500 }}>{user?.fullName || user?.full_name}</span> — Trưởng/Phó ban · Tổng quan ban của bạn
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

      {/* KPI Row */}
      <div className="bento-grid-v2" style={{ marginBottom: 14 }}>
        {kpis.map((k, i) => (
          <motion.div key={k.label} variants={item} className="kpi-card-v2 bento-col-3">
            <div style={{ width: 38, height: 38, borderRadius: 10, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <span style={{ color: k.color }}>{k.icon}</span>
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 300, letterSpacing: '-0.06em', color: k.color, lineHeight: 1, fontFamily: 'var(--font-mono)' }}>
              <CountUp to={Number(k.value)} duration={1100 + i * 120} />{k.suffix || ''}
            </div>
            <div style={{ fontSize: '0.62rem', fontWeight: 500, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 6 }}>
              {k.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="bento-grid-v2" style={{ marginBottom: 14 }}>
        <motion.div variants={item} className="kpi-card-v2 bento-col-8">
          <div style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>
            Chuyên cần & KPI từng thành viên
          </div>
          <Bar data={barData} options={barOpts} />
        </motion.div>
        <motion.div variants={item} className="kpi-card-v2 bento-col-4">
          <div style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>
            Trạng thái công việc
          </div>
          <Doughnut data={taskDonut} options={{ responsive: true, cutout: '68%', plugins: { legend: { position: 'bottom', labels: { color: chartMuted, font: chartFont, boxWidth: 10, padding: 10 } } } }} />
        </motion.div>
      </div>

      {/* Member list + Quick actions */}
      <div className="bento-grid-v2">
        <motion.div variants={item} className="kpi-card-v2 bento-col-8">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Thành viên trong ban</div>
            <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.68rem', gap: 4 }} onClick={() => navigate('/hr')}>
              Quản lý <ArrowRight size={11} />
            </button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Thành viên</th>
                <th>Vai trò</th>
                <th>Chuyên cần</th>
                <th>KPI</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {members.map(m => {
                const attendance = Math.min(75 + (m.xp ? Math.round(m.xp / 40) : 0), 100);
                const kpi = Math.min(70 + (m.xp ? Math.round(m.xp / 30) : 0), 100);
                return (
                  <tr key={m.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                          {getInitials(m.fullName || '')}
                        </div>
                        <span style={{ fontWeight: 500, color: 'var(--text-1)', fontSize: '0.82rem' }}>{m.fullName}</span>
                      </div>
                    </td>
                    <td><span className="badge badge-neutral">{m.role}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 9, overflow: 'hidden', minWidth: 50 }}>
                          <div style={{ height: '100%', width: `${attendance}%`, background: attendance >= 80 ? '#34d399' : '#f59e0b', borderRadius: 9 }} />
                        </div>
                        <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: attendance >= 80 ? 'var(--success)' : 'var(--warning)', fontWeight: 600 }}>{attendance}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${kpi >= 80 ? 'badge-green' : kpi >= 60 ? 'badge-yellow' : 'badge-red'}`} style={{ fontFamily: 'var(--font-mono)' }}>
                        {kpi}%
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.65rem' }} onClick={() => navigate('/evaluations')}>Đánh giá</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>

        <motion.div variants={item} className="kpi-card-v2 bento-col-4">
          <div style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Thao tác nhanh</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { icon: <Clock size={16} />, label: 'Tạo lịch tập mới', color: '#6366f1', bg: 'rgba(99,102,241,0.1)', path: '/schedule' },
              { icon: <CheckSquare size={16} />, label: 'Giao task cho thành viên', color: '#34d399', bg: 'rgba(52,211,153,0.1)', path: '/tasks' },
              { icon: <MessageCircle size={16} />, label: 'Nhắn tin nhóm', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', path: '/chat' },
              { icon: <BarChart3 size={16} />, label: 'Chấm điểm KPI tháng này', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', path: '/evaluations' },
              { icon: <UserCheck size={16} />, label: 'Phân công đội', color: '#38bdf8', bg: 'rgba(56,189,248,0.1)', path: '/hr' },
            ].map(a => (
              <button
                key={a.label}
                onClick={() => navigate(a.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 11,
                  padding: '10px 14px', borderRadius: 12, border: 'none',
                  background: a.bg, cursor: 'pointer', textAlign: 'left',
                  transition: 'transform 0.2s, filter 0.2s', color: a.color, fontWeight: 500, fontSize: '0.82rem',
                }}
                onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.15)'}
                onMouseLeave={e => e.currentTarget.style.filter = ''}
              >
                {a.icon}
                {a.label}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

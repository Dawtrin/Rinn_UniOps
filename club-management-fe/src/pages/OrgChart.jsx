import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useToast } from '../context/ToastContext';
import { Users, ChevronRight, UserCheck, BarChart3 } from 'lucide-react';

const AVATAR_COLORS = ['#6366f1','#8b5cf6','#38bdf8','#34d399','#f59e0b','#f43f5e','#a78bfa','#fb923c'];
const randColor = (id) => AVATAR_COLORS[id % AVATAR_COLORS.length];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  show:   { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.45, ease: [0.16,1,0.3,1] } },
};

function KpiBar({ pct, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden', minWidth: 60 }}>
        <motion.div
          style={{ height: '100%', borderRadius: 999, background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: [0.16,1,0.3,1], delay: 0.3 }}
        />
      </div>
      <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color, minWidth: 32 }}>{pct}%</span>
    </div>
  );
}

export default function OrgChart() {
  const navigate = useNavigate();
  const toast = useToast();
  const [org, setOrg] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/hr/org-chart')
      .then(r => {
        const orgData = r.data?.data || r.data;
        setOrg(Array.isArray(orgData) ? orgData : []);
      })
      .catch(() => {
        toast('Không thể tải sơ đồ tổ chức', 'error');
        setOrg([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalMembers  = org.reduce((a, d) => a + (d.memberCount || d.teams?.reduce((sum, t) => sum + (t.memberCount || t.members?.length || 0), 0) || 0), 0);
  const totalTeams    = org.reduce((a, d) => a + (d.teams?.length || 0), 0);
  const avgKpi        = Math.round(org.flatMap(d => d.teams || []).reduce((a, t) => a + (t.avgKpi || 80), 0) / Math.max(org.flatMap(d => d.teams || []).length, 1));

  if (loading) return <div className="loading-page"><div className="spinner" /><p>Đang tải</p></div>;

  return (
    <div>
      <div className="page-header">
        <h1>🏛️ Sơ đồ tổ chức</h1>
        <p>Cấu trúc CLB — Ban và Đội</p>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        {[
          { label: 'Tổng thành viên', value: totalMembers, icon: <Users size={18}/>, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
          { label: 'Số ban',          value: org.length,   icon: <UserCheck size={18}/>, color: '#38bdf8', bg: 'rgba(56,189,248,0.1)' },
          { label: 'Số đội',          value: totalTeams,   icon: <Users size={18}/>, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
          { label: 'KPI trung bình',  value: avgKpi + '%', icon: <BarChart3 size={18}/>, color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ flex: '1 0 140px', padding: '14px 18px' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, color: s.color }}>
              {s.icon}
            </div>
            <div style={{ fontSize: '1.7rem', fontWeight: 300, letterSpacing: '-0.05em', color: s.color, fontFamily: 'var(--font-mono)' }}>{s.value}</div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Org tree cards */}
      <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* CLB root */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
          <div className="card" style={{ display: 'inline-flex', alignItems: 'center', gap: 14, padding: '14px 28px', background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))', border: '1px solid rgba(99,102,241,0.25)' }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>⚡</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em' }}>Club OS</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 2 }}>{totalMembers} thành viên · {org.length} ban · {totalTeams} đội</div>
            </div>
          </div>
        </div>

        {/* Connecting line */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 1, height: 24, background: 'var(--border-glass-default)' }} />
        </div>

        {/* Departments row */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${org.length}, 1fr)`, gap: 16 }}>
          {org.map((dept, di) => {
            const dColor = dept.deptColor || randColor(dept.id);
            return (
              <motion.div key={dept.id} variants={item}>
                {/* Dept card */}
                <div className="card" style={{ borderLeft: `3px solid ${dColor}`, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: dColor + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Users size={18} style={{ color: dColor }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', letterSpacing: '-0.02em', color: 'var(--text-1)' }}>{dept.name}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: 1 }}>Trưởng: {dept.managerName || dept.manager || 'Chưa phân công'}</div>
                    </div>
                    <span className="badge badge-neutral" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem' }}>{dept.memberCount || dept.teams?.reduce((sum, t) => sum + (t.memberCount || t.members?.length || 0), 0) || 0}</span>
                  </div>
                </div>

                {/* Connecting lines to teams */}
                <div style={{ position: 'relative', paddingLeft: 16 }}>
                  <div style={{ position: 'absolute', left: 8, top: 0, bottom: 24, width: 1, background: 'var(--border-glass-default)' }} />

                  {dept.teams.map((team, ti) => {
                    const tColor = team.color || team.avatarColor || randColor(team.id);
                    return (
                      <motion.div
                        key={team.id}
                        variants={item}
                        style={{ position: 'relative', marginBottom: 10, cursor: 'pointer' }}
                        onClick={() => navigate('/hr')}
                      >
                        {/* Horizontal connector */}
                        <div style={{ position: 'absolute', left: -8, top: 22, width: 8, height: 1, background: 'var(--border-glass-default)' }} />

                        <div className="card card-hover" style={{ padding: '12px 14px', borderLeft: `2px solid ${tColor}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: tColor, flexShrink: 0 }} />
                            <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-1)', flex: 1 }}>{team.name}</div>
                            <ChevronRight size={12} style={{ color: 'var(--text-3)' }} />
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginBottom: 8 }}>
                            👑 {team.leader || team.leaderName || 'Chưa phân công'} · {team.memberCount || team.members?.length || 0} người
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.6rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>KPI</span>
                            </div>
                            <KpiBar pct={team.avgKpi || 80} color={(team.avgKpi || 80) >= 80 ? '#34d399' : (team.avgKpi || 80) >= 60 ? '#f59e0b' : '#f43f5e'} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.6rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Chuyên cần</span>
                            </div>
                            <KpiBar pct={team.attendance || 90} color={(team.attendance || 90) >= 80 ? '#6366f1' : '#f59e0b'} />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Bottom CTA */}
      <div style={{ marginTop: 28, textAlign: 'center' }}>
        <button className="btn btn-ghost" style={{ gap: 8 }} onClick={() => navigate('/hr')}>
          <UserCheck size={16} /> Quản lý phân công nhân sự
        </button>
      </div>
    </div>
  );
}

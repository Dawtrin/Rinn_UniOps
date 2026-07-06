import { useEffect, useState } from 'react';
import api from '../api';
import { Star, Zap, Trophy } from 'lucide-react';

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/leaderboard')
      .then(r => {
        const data = r.data?.data || r.data;
        setLeaders(Array.isArray(data) ? data : []);
      })
      .catch(() => setLeaders([]))
      .finally(() => setLoading(false));
  }, []);

  const getInitials = (name) => name?.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase() || '?';
  const getLevelEmoji = (level) => ['🌱','⭐','🔥','💫','🏆','👑'][Math.min(level - 1, 5)] || '🌱';

  const podium = leaders.slice(0, 3);
  const rest = leaders.slice(3);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Bảng xếp hạng XP</h1>
        <p>Top thành viên tích cực nhất câu lạc bộ — Chuyên cần & Hoàn thành công việc</p>
      </div>

      {/* Podium top 3 */}
      {podium.length > 0 && (
        <div className="lb-podium mb-3">
          {/* Reorder: 2nd, 1st, 3rd for visual podium effect */}
          {[podium[1], podium[0], podium[2]].map((p, visualIdx) => {
            if (!p) return <div key={visualIdx} />;
            const rank = visualIdx === 1 ? 1 : visualIdx === 0 ? 2 : 3;
            const medalColors = { 1: 'var(--neon-yellow)', 2: '#c0c0c0', 3: '#cd7f32' };
            return (
              <div key={p.id} className={`lb-podium-card lb-rank-${rank}`}
                style={{ alignSelf: rank === 1 ? 'flex-start' : 'flex-end', transform: rank === 1 ? 'scale(1.05)' : 'scale(1)' }}>
                <div style={{ fontSize: '1.6rem', marginBottom: 4 }}>{rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}</div>
                <div className="lb-avatar" style={{ background: medalColors[rank], color: rank === 1 ? '#000' : '#fff' }}>
                  {getInitials(p.fullName || p.name)}
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 4 }}>{p.fullName || p.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                  {getLevelEmoji(p.level || 1)} Lv.{p.level || 1}
                </div>
                <div style={{ color: medalColors[rank], fontWeight: 800, fontSize: '1.1rem' }}>{p.xp || 0} XP</div>
                <div style={{ marginTop: 8 }}>
                  <div className="xp-bar-container">
                    <div className="xp-bar-fill xp-glow" style={{ width: `${(p.xp % 100)}%` }} />
                  </div>
                  <div className="text-xs text-muted" style={{ marginTop: 3 }}>{p.xp % 100}/100 XP đến cấp tiếp</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rest of leaderboard */}
      {rest.map((member, idx) => (
        <div key={member.id} className="lb-row">
          <div className="lb-rank-num">{idx + 4}</div>
          <div className="lb-avatar" style={{ width: 36, height: 36, fontSize: '0.8rem', background: 'var(--bg-surface)', flexShrink: 0, margin: 0 }}>
            {getInitials(member.fullName || member.name)}
          </div>
          <div className="lb-name">
            <div>{member.fullName || member.name}</div>
            <div className="text-xs text-muted">{getLevelEmoji(member.level || 1)} Lv.{member.level || 1}</div>
          </div>
          <div style={{ flex: 2, padding: '0 12px' }}>
            <div className="xp-bar-container">
              <div className="xp-bar-fill" style={{ width: `${member.xp % 100}%` }} />
            </div>
          </div>
          <div className="lb-xp">{member.xp || 0} XP</div>
        </div>
      ))}

      {leaders.length === 0 && (
        <div className="empty-state"><Trophy size={48} /><h3>Chưa có dữ liệu xếp hạng</h3><p>Hãy điểm danh và hoàn thành công việc để tích lũy XP!</p></div>
      )}
    </div>
  );
}

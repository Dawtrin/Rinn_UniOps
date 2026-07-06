import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  ChevronRight, ChevronDown, Users, UserPlus, Plus,
  X, Search, ArrowRight, Trash2, Crown, AlertTriangle
} from 'lucide-react';

// ──────────────────────────────────────────────
const AVATAR_COLORS = ['#6366f1','#8b5cf6','#38bdf8','#34d399','#f59e0b','#f43f5e','#a78bfa','#fb923c'];
const randColor = (id) => AVATAR_COLORS[id % AVATAR_COLORS.length];

function getInitials(name) {
  return name?.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase() || '?';
}

// ──────────────────────────────────────────────
// HR Management Main Component
// ──────────────────────────────────────────────
export default function HRManagement() {
  const toast = useToast();
  const { user } = useAuth();
  const [org, setOrg]               = useState([]);
  const [unassigned, setUnassigned] = useState([]);
  const [selected, setSelected]     = useState(null); // { type: 'team'|'unassigned'|'dept', data }
  const [expanded, setExpanded]     = useState({});   // deptId → boolean
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTarget, setAssignTarget]       = useState(null); // member to assign (or selected unassigned member inside modal)
  const [searchMember, setSearchMember]       = useState('');
  const [loading, setLoading]       = useState(true);

  // New states for detailed assignment
  const [assignMode, setAssignMode]           = useState('assign_to_team'); // 'assign_to_team' | 'add_to_current_team'
  const [selectedRole, setSelectedRole]       = useState('MEMBER'); // 'MEMBER' | 'LEADER'
  const [selectedTeamId, setSelectedTeamId]   = useState(null);
  const [modalSearch, setModalSearch]         = useState('');

  // States for creating a team
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [newTeamColor, setNewTeamColor] = useState('#6366f1');

  useEffect(() => {
    Promise.all([
      api.get('/hr/org-chart').catch(err => {
        toast('Không thể tải sơ đồ tổ chức từ máy chủ', 'error');
        return null;
      }),
      api.get('/hr/unassigned-members').catch(err => {
        toast('Không thể tải danh sách thành viên chưa phân công', 'error');
        return null;
      }),
    ]).then(([orgRes, unaRes]) => {
      const orgData = orgRes?.data?.data || orgRes?.data;
      const finalOrg = Array.isArray(orgData) ? orgData.map(dept => ({
        ...dept,
        teams: (dept.teams || []).filter(t => t.isActive !== false)
      })) : [];
      setOrg(finalOrg);

      const unaData = unaRes?.data?.data || unaRes?.data;
      setUnassigned(Array.isArray(unaData) ? unaData : []);

      // Default expand all loaded depts
      const exp = {};
      finalOrg.forEach(d => { exp[d.id] = true; });
      setExpanded(exp);
    }).finally(() => setLoading(false));
  }, []);

  const toggleDept = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const selectTeam = (dept, team) => setSelected({ type: 'team', dept, team });
  const selectUnassigned = () => setSelected({ type: 'unassigned' });

  // Assign member to team (with role and local state cleanup)
  const handleAssign = async (teamId, targetMember = null, targetRole = 'MEMBER') => {
    const member = targetMember || assignTarget;
    if (!member) {
      toast('Vui lòng chọn thành viên để phân công', 'warning');
      return;
    }

    try {
      // 1. Assign to team (API call)
      await api.put('/hr/assign', { userId: member.id, teamId });
      
      // 2. Set as leader if selected role is LEADER
      if (targetRole === 'LEADER') {
        await api.put(`/teams/${teamId}/leader`, { userId: member.id });
      }

      // 3. Update local state
      // Remove from unassigned list
      setUnassigned(prev => prev.filter(m => m.id !== member.id));

      // Remove from old team and add to new team
      setOrg(prev => prev.map(dept => ({
        ...dept,
        teams: dept.teams.map(t => {
          // Remove from this team if it's the old team of the member
          let updatedMembers = t.members.filter(m => m.id !== member.id);
          
          // Add to the new team
          if (t.id === teamId) {
            updatedMembers = [...updatedMembers, { ...member, role: targetRole }];
          }

          // Update team leader ID
          let updatedLeaderId = t.leaderId;
          if (t.id === teamId) {
            updatedLeaderId = targetRole === 'LEADER' ? member.id : (t.leaderId === member.id ? null : t.leaderId);
          } else {
            // Remove from old leader if they were the leader of the old team
            if (t.leaderId === member.id) {
              updatedLeaderId = null;
            }
          }

          return {
            ...t,
            members: updatedMembers,
            leaderId: updatedLeaderId
          };
        })
      })));

      toast(`Đã phân công ${member.fullName || member.name} vào đội với vai trò ${targetRole === 'LEADER' ? 'Đội trưởng' : 'Thành viên'}!`, 'success');
      
      // Reset states
      setShowAssignModal(false);
      setAssignTarget(null);
      setSelectedTeamId(null);
      setSelectedRole('MEMBER');
      setModalSearch('');
    } catch (err) {
      toast(err.response?.data?.message || 'Lỗi khi thực hiện phân công', 'error');
    }
  };

  // Remove member from team
  const handleRemove = (memberId, teamId) => {
    // Find the member to add back to unassigned list
    let removedMember = null;
    org.forEach(dept => {
      dept.teams.forEach(t => {
        if (t.id === teamId) {
          const m = t.members.find(mem => mem.id === memberId);
          if (m) removedMember = m;
        }
      });
    });

    setOrg(prev => prev.map(dept => ({
      ...dept,
      teams: dept.teams.map(t => t.id === teamId
        ? { ...t, members: t.members.filter(m => m.id !== memberId) }
        : t
      ),
    })));

    if (removedMember) {
      setUnassigned(prev => [...prev, removedMember]);
    }

    api.delete(`/teams/${teamId}/members/${memberId}`).catch(() => {});
    toast('Đã xóa thành viên khỏi đội', 'info');
  };

  // Create new team
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) {
      toast('Vui lòng nhập tên đội', 'warning');
      return;
    }
    try {
      const response = await api.post('/teams', {
        name: newTeamName.trim(),
        description: newTeamDesc.trim(),
        departmentId: selected.dept.id,
        avatarColor: newTeamColor
      });
      const createdTeam = response.data?.data || response.data;
      const fullCreatedTeam = { ...createdTeam, members: [] };

      // Update local state org
      setOrg(prev => prev.map(d => {
        if (d.id === selected.dept.id) {
          return {
            ...d,
            teams: [...d.teams, fullCreatedTeam]
          };
        }
        return d;
      }));

      // Switch view to the newly created team
      setSelected({
        type: 'team',
        dept: selected.dept,
        team: fullCreatedTeam
      });

      setShowCreateTeamModal(false);
      setNewTeamName('');
      setNewTeamDesc('');
      toast(`Đã tạo đội ${newTeamName} thành công!`, 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Lỗi khi tạo đội mới', 'error');
    }
  };

  const allTeams = org.flatMap(d => d.teams);
  const currentMembers = selected?.type === 'team'
    ? (org.flatMap(d => d.teams).find(t => t.id === selected.team?.id)?.members || [])
    : unassigned;

  const canManage = user?.role === 'ADMIN' || (user?.role === 'MANAGER' && user?.departmentId === selected?.dept?.id);

  const filteredMembers = currentMembers.filter(m => {
    const name = m.fullName || m.name || '';
    return !searchMember || name.toLowerCase().includes(searchMember.toLowerCase());
  });

  if (loading) return <div className="loading-page"><div className="spinner" /><p>Đang tải</p></div>;

  const uniqueMemberIds = new Set(org.flatMap(d => d.teams.flatMap(t => t.members)).map(m => m.id));
  const totalMembers = uniqueMemberIds.size;

  return (
    <div>
      <div className="page-header">
        <h1>👥 Quản lý nhân sự</h1>
        <p>Phân công và quản lý thành viên vào các đội</p>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Tổng thành viên', value: totalMembers + unassigned.length, color: '#6366f1' },
          { label: 'Đã phân công',    value: totalMembers, color: '#34d399' },
          { label: 'Chờ phân công',   value: unassigned.length, color: '#f59e0b' },
          { label: 'Số đội',          value: allTeams.length, color: '#38bdf8' },
        ].map(s => (
          <div key={s.label} className="card" style={{ flex: '1 0 140px', padding: '14px 18px', borderLeft: `2px solid ${s.color}` }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 300, letterSpacing: '-0.05em', color: s.color, fontFamily: 'var(--font-mono)' }}>{s.value}</div>
            <div style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="hr-layout">
        {/* ── Left: Org Tree ── */}
        <div className="org-tree">
          <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>
            Sơ đồ tổ chức
          </div>

          {/* Unassigned */}
          <div
            className={`org-tree-item unassigned ${selected?.type === 'unassigned' ? 'active' : ''}`}
            onClick={selectUnassigned}
          >
            <AlertTriangle size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />
            Chưa phân công
            <span className="org-tree-count warn">{unassigned.length}</span>
          </div>

          <div style={{ height: 1, background: 'var(--border-glass-subtle)', margin: '10px 0' }} />

          {/* Departments */}
          {org.map(dept => {
            const dColor = dept.color || randColor(dept.id);
            return (
              <div key={dept.id}>
                <div
                  className={`org-tree-item dept ${selected?.type === 'dept' && selected?.dept?.id === dept.id ? 'active' : ''}`}
                  onClick={() => {
                    toggleDept(dept.id);
                    setSelected({ type: 'dept', dept });
                  }}
                >
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: dColor, flexShrink: 0 }} />
                  {dept.name}
                  <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="org-tree-count">{dept.teams.reduce((a, t) => a + t.members.length, 0)}</span>
                    {expanded[dept.id] ? <ChevronDown size={13} style={{ color: 'var(--text-3)' }} /> : <ChevronRight size={13} style={{ color: 'var(--text-3)' }} />}
                  </span>
                </div>

                <AnimatePresence>
                  {expanded[dept.id] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                      style={{ overflow: 'hidden' }}
                    >
                      {dept.teams.map(team => {
                        const tColor = team.color || team.avatarColor || randColor(team.id);
                        return (
                          <div
                            key={team.id}
                            className={`org-tree-item team ${selected?.team?.id === team.id ? 'active' : ''}`}
                            onClick={() => selectTeam(dept, team)}
                          >
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: tColor, flexShrink: 0 }} />
                            {team.name}
                            <span className="org-tree-count">{team.members.length}</span>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* ── Right: Detail Panel ── */}
        <div className="hr-detail-panel">
          {selected ? (
            <>
              {/* Panel header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {selected.type === 'team' && (() => {
                    const tColor = selected.team?.color || selected.team?.avatarColor || randColor(selected.team?.id);
                    return (
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: `${tColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Users size={20} style={{ color: tColor }} />
                      </div>
                    );
                  })()}
                  {selected.type === 'dept' && (
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Users size={20} style={{ color: 'var(--accent)' }} />
                    </div>
                  )}
                  {selected.type === 'unassigned' && (
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AlertTriangle size={20} style={{ color: '#f59e0b' }} />
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
                      {selected.type === 'team' ? selected.team?.name : selected.type === 'dept' ? selected.dept?.name : 'Chưa phân công'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 2 }}>
                      {selected.type === 'team' && `${filteredMembers.length} thành viên · ${selected.dept?.name}`}
                      {selected.type === 'dept' && `${selected.dept?.teams?.length || 0} đội tuyển`}
                      {selected.type === 'unassigned' && `${filteredMembers.length} thành viên`}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {/* Search */}
                  {selected.type !== 'dept' && (
                    <div style={{ position: 'relative' }}>
                      <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                      <input
                        value={searchMember}
                        onChange={e => setSearchMember(e.target.value)}
                        placeholder="Tìm..."
                        style={{ paddingLeft: 28, paddingRight: 12, height: 34, borderRadius: 999, border: '0.5px solid var(--border-glass-default)', background: 'var(--glass-thick)', color: 'var(--text-1)', fontSize: '0.78rem', outline: 'none', width: 150 }}
                      />
                    </div>
                  )}
                  {selected.type === 'team' && canManage && (
                    <button className="btn btn-primary btn-sm" style={{ gap: 5 }}
                      onClick={() => { 
                        setAssignMode('add_to_current_team');
                        setAssignTarget(null);
                        setSelectedTeamId(selected.team?.id);
                        setSelectedRole('MEMBER');
                        setShowAssignModal(true); 
                      }}>
                      <UserPlus size={13} /> Thêm thành viên
                    </button>
                  )}
                  {selected.type === 'dept' && canManage && (
                    <button className="btn btn-primary btn-sm" style={{ gap: 5 }}
                      onClick={() => {
                        setNewTeamName('');
                        setNewTeamDesc('');
                        setNewTeamColor('#6366f1');
                        setShowCreateTeamModal(true);
                      }}>
                      <Plus size={13} /> Tạo đội mới
                    </button>
                  )}
                </div>
              </div>

              {/* Detail body */}
              {selected.type === 'dept' ? (
                <div style={{ padding: '4px 0' }}>
                  {(!selected.dept?.teams || selected.dept.teams.length === 0) ? (
                    <div className="empty-state" style={{ padding: '60px 0' }}>
                      <Users size={40} style={{ color: 'var(--text-3)', marginBottom: 12 }} />
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-1)' }}>Chưa có đội tuyển nào</h3>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: 4 }}>Nhấp vào nút bên dưới để thiết lập đội tuyển đầu tiên cho ban này</p>
                      {canManage && (
                        <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }}
                          onClick={() => {
                            setNewTeamName('');
                            setNewTeamDesc('');
                            setNewTeamColor('#6366f1');
                            setShowCreateTeamModal(true);
                          }}>
                          Tạo đội ngay
                        </button>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                      {selected.dept.teams.map(team => {
                        const tColor = team.color || team.avatarColor || randColor(team.id);
                        return (
                          <div
                            key={team.id}
                            className="card"
                            onClick={() => selectTeam(selected.dept, team)}
                            style={{
                              padding: 16,
                              cursor: 'pointer',
                              border: '0.5px solid var(--border-glass-default)',
                              background: 'var(--glass-regular)',
                              transition: 'all 0.2s',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 8
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.borderColor = 'var(--accent-light)';
                              e.currentTarget.style.background = 'var(--glass-hover)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.borderColor = 'var(--border-glass-default)';
                              e.currentTarget.style.background = 'var(--glass-regular)';
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${tColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Users size={16} style={{ color: tColor }} />
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{team.name}</div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-3)' }}>{team.members?.length || 0} thành viên</div>
                              </div>
                            </div>
                            {team.description && (
                              <p style={{ fontSize: '0.72rem', color: 'var(--text-2)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.4 }}>
                                {team.description}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* Member grid */
                filteredMembers.length === 0 ? (
                  <div className="empty-state">
                    <Users size={40} />
                    <p>{selected.type === 'unassigned' ? 'Tất cả thành viên đã được phân công! 🎉' : 'Đội chưa có thành viên'}</p>
                  </div>
                ) : (
                  <div className="hr-member-grid">
                  {filteredMembers.map(member => (
                    <motion.div
                      key={member.id}
                      className="hr-member-card"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      layout
                    >
                      {(() => {
                        const displayName = member.fullName || member.name || 'Thành viên';
                        const isLeader = selected.type === 'team' && (member.id === selected.team?.leaderId || member.role === 'LEADER');
                        const roleLabel = isLeader ? 'LEADER' : 'MEMBER';
                        return (
                          <>
                            <div className="hr-member-avatar" style={{ background: `linear-gradient(135deg, ${randColor(member.id)}, ${randColor(member.id + 3)})` }}>
                              {member.initials || getInitials(displayName)}
                            </div>
                            <div className="hr-member-name">{displayName}</div>
                            <div className="hr-member-role">
                              {roleLabel === 'LEADER' ? (
                                <span style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 700 }}>
                                  <Crown size={10} style={{ display: 'inline', marginRight: 3 }} />Đội trưởng
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>
                                  Thành viên
                                </span>
                              )}
                            </div>
                          </>
                        );
                      })()}
                      {member.kpi != null && (
                        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                          <span className={`badge ${member.kpi >= 80 ? 'badge-green' : member.kpi >= 60 ? 'badge-yellow' : 'badge-red'}`} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem' }}>
                            KPI {member.kpi}%
                          </span>
                          <span className={`badge ${member.attendance >= 80 ? 'badge-green' : 'badge-yellow'}`} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem' }}>
                            {member.attendance}% CD
                          </span>
                        </div>
                      )}
                      <div className="hr-member-actions">
                        {selected.type === 'unassigned' ? (
                          <button className="btn btn-primary btn-sm" style={{ fontSize: '0.68rem', gap: 4 }}
                            onClick={() => { 
                              setAssignMode('assign_to_team');
                              setAssignTarget(member);
                              setSelectedTeamId(null);
                              setSelectedRole('MEMBER');
                              setShowAssignModal(true); 
                            }}>
                            <ArrowRight size={11} /> Phân công
                          </button>
                        ) : (
                          canManage && (
                            <>
                              <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.68rem' }}
                                onClick={() => { 
                                  setAssignMode('assign_to_team');
                                  setAssignTarget(member);
                                  setSelectedTeamId(null);
                                  setSelectedRole('MEMBER');
                                  setShowAssignModal(true); 
                                }}>
                                Chuyển đội
                              </button>
                              <button className="btn btn-danger btn-sm" style={{ fontSize: '0.68rem' }}
                                onClick={() => handleRemove(member.id, selected.team?.id)}>
                                <Trash2 size={11} />
                              </button>
                            </>
                          )
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ))}
            </>
          ) : (
            <div className="empty-state" style={{ height: '100%' }}>
              <Users size={48} />
              <h3>Chọn một đội để xem chi tiết</h3>
              <p>Click vào đội ở cây bên trái để quản lý thành viên</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Assign/Transfer Modal ── */}
      <AnimatePresence>
        {showAssignModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowAssignModal(false)}
          >
            <motion.div
              className="modal-box"
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: 440 }}
            >
              <div className="modal-header">
                <div className="modal-title">
                  {assignMode === 'add_to_current_team' 
                    ? `Thêm thành viên vào ${selected.team?.name}` 
                    : (selected?.type === 'unassigned' ? 'Phân công vào đội' : 'Chuyển đội')}
                  {assignMode === 'assign_to_team' && assignTarget && (
                    <span style={{ color: 'var(--accent-light)', marginLeft: 6 }}>{assignTarget.fullName || assignTarget.name}</span>
                  )}
                </div>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowAssignModal(false)}><X size={15} /></button>
              </div>

              {/* ── Mode 1: Add to current team (show list of unassigned members to select) ── */}
              {assignMode === 'add_to_current_team' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                    <input
                      placeholder="Tìm thành viên chờ phân công..."
                      value={modalSearch}
                      onChange={e => setModalSearch(e.target.value)}
                      style={{ width: '100%', paddingLeft: 28, paddingRight: 12, height: 36, borderRadius: 8, border: '0.5px solid var(--border-glass-default)', background: 'var(--glass-thick)', color: 'var(--text-1)', fontSize: '0.78rem', outline: 'none' }}
                    />
                  </div>

                  <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Chọn thành viên:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto', paddingRight: 4 }}>
                    {unassigned
                      .filter(m => !modalSearch || (m.fullName || m.name || '').toLowerCase().includes(modalSearch.toLowerCase()))
                      .map(m => {
                        const isSelected = assignTarget?.id === m.id;
                        return (
                          <div
                            key={m.id}
                            onClick={() => setAssignTarget(m)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              padding: '8px 12px', borderRadius: 10, cursor: 'pointer',
                              background: isSelected ? 'var(--accent-dim)' : 'var(--glass-regular)',
                              border: `0.5px solid ${isSelected ? 'var(--accent-light)' : 'var(--border-glass-default)'}`,
                              transition: 'all 0.15s'
                            }}
                          >
                            <div className="chat-avatar-sm" style={{ width: 26, height: 26, fontSize: '0.65rem', background: `linear-gradient(135deg, ${randColor(m.id)}, ${randColor(m.id + 3)})` }}>
                              {getInitials(m.fullName || m.name)}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 500, fontSize: '0.8rem', color: 'var(--text-1)' }}>{m.fullName || m.name}</div>
                              <div style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>{m.email} · Cấp {m.level || 1}</div>
                            </div>
                            <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1px solid var(--border-glass-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isSelected ? 'var(--accent)' : 'transparent' }}>
                              {isSelected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                            </div>
                          </div>
                        );
                      })}
                    {unassigned.filter(m => !modalSearch || (m.fullName || m.name || '').toLowerCase().includes(modalSearch.toLowerCase())).length === 0 && (
                      <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: '0.78rem' }}>Không tìm thấy thành viên phù hợp</div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Mode 2: Assign unassigned member/transfer member to a team (show list of teams to select) ── */}
              {assignMode === 'assign_to_team' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Chọn đội phân công:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto', paddingRight: 4 }}>
                    {org
                      .filter(dept => user?.role === 'ADMIN' || dept.id === user?.departmentId)
                      .map(dept => (
                        <div key={dept.id} style={{ marginBottom: 4 }}>
                          <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{dept.name}</div>
                          {dept.teams.map(team => {
                            const isSelected = selectedTeamId === team.id;
                            return (
                              <div
                                key={team.id}
                                onClick={() => setSelectedTeamId(team.id)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 10,
                                  padding: '8px 12px', borderRadius: 10, cursor: 'pointer',
                                  background: isSelected ? 'var(--accent-dim)' : 'var(--glass-regular)',
                                  border: `0.5px solid ${isSelected ? 'var(--accent-light)' : 'var(--border-glass-default)'}`,
                                  marginBottom: 4, transition: 'all 0.15s'
                                }}
                              >
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: team.color || team.avatarColor || '#6366f1' }} />
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 500, fontSize: '0.8rem', color: 'var(--text-1)' }}>{team.name}</div>
                                  <div style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>{team.members?.length || 0} thành viên</div>
                                </div>
                                <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1px solid var(--border-glass-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isSelected ? 'var(--accent)' : 'transparent' }}>
                                  {isSelected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* ── Role Selector Section (Common for both modes) ── */}
              <div style={{ height: 1, background: 'var(--border-glass-subtle)', margin: '14px 0' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vai trò trong đội:</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${selectedRole === 'MEMBER' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setSelectedRole('MEMBER')}
                    style={{ fontSize: '0.78rem', padding: '10px 0', borderRadius: 8 }}
                  >
                    Thành viên
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${selectedRole === 'LEADER' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setSelectedRole('LEADER')}
                    style={{ fontSize: '0.78rem', padding: '10px 0', borderRadius: 8, gap: 4 }}
                  >
                    <Crown size={12} style={{ color: selectedRole === 'LEADER' ? '#fff' : '#f59e0b' }} /> Đội trưởng
                  </button>
                </div>
              </div>

              {/* ── Modal Footer ── */}
              <div className="modal-footer" style={{ marginTop: 20 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowAssignModal(false)}>Hủy</button>
                <button
                  className="btn btn-primary btn-sm"
                  disabled={assignMode === 'add_to_current_team' ? !assignTarget : !selectedTeamId}
                  onClick={() => {
                    const targetTeam = selectedTeamId;
                    const targetMem = assignTarget;
                    handleAssign(targetTeam, targetMem, selectedRole);
                  }}
                >
                  Xác nhận phân công
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Create Team Modal ── */}
      <AnimatePresence>
        {showCreateTeamModal && selected?.type === 'dept' && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowCreateTeamModal(false)}
          >
            <motion.div
              className="modal-box"
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: 420 }}
            >
              <div className="modal-header">
                <div className="modal-title">
                  Tạo đội mới trong <span style={{ color: 'var(--accent-light)' }}>{selected.dept.name}</span>
                </div>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowCreateTeamModal(false)}><X size={15} /></button>
              </div>

              <form onSubmit={handleCreateTeam} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Tên đội tuyển *</label>
                  <input
                    className="form-input"
                    placeholder="VD: Đội Hậu cần A"
                    value={newTeamName}
                    onChange={e => setNewTeamName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mô tả đội tuyển</label>
                  <textarea
                    className="form-textarea"
                    placeholder="VD: Chuyên quản lý kho bãi, dụng cụ..."
                    value={newTeamDesc}
                    onChange={e => setNewTeamDesc(e.target.value)}
                    style={{ minHeight: 80 }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Màu sắc nhận diện</label>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
                    {AVATAR_COLORS.map(c => (
                      <div
                        key={c}
                        onClick={() => setNewTeamColor(c)}
                        style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: c, cursor: 'pointer',
                          border: `2px solid ${newTeamColor === c ? '#fff' : 'transparent'}`,
                          boxShadow: newTeamColor === c ? '0 0 0 1px var(--accent)' : 'none',
                          transform: newTeamColor === c ? 'scale(1.1)' : 'scale(1)',
                          transition: 'all 0.15s'
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="modal-footer" style={{ marginTop: 10 }}>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowCreateTeamModal(false)}>Hủy</button>
                  <button type="submit" className="btn btn-primary btn-sm">Tạo đội</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

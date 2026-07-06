import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  Vote, PlusCircle, Trash2, Clock, Check, X, CheckSquare,
  Square, PieChart, Users, ChevronDown, ChevronUp
} from 'lucide-react';

export default function Polls() {
  const toast = useToast();
  const { user } = useAuth();
  
  // Data states
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePollId, setActivePollId] = useState(null);
  const [pollResults, setPollResults] = useState({}); // mapping: pollId -> list of results [{optionId, optionText, votesCount}]
  const [userVotes, setUserVotes] = useState({}); // mapping: pollId -> list of selected optionIds
  const [dbVotes, setDbVotes] = useState({}); // mapping: pollId -> list of optionIds stored in DB

  // Form states (Admin/Manager)
  const [newPoll, setNewPoll] = useState({
    title: '',
    description: '',
    allowMultiple: false,
    expiresAt: '',
    departmentId: '',
    options: ['', '']
  });
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState([]);

  const loadDepartments = () => {
    api.get('/departments')
      .then(r => {
        const rawData = r.data?.data || r.data;
        setDepartments(Array.isArray(rawData) ? rawData : []);
      })
      .catch(() => setDepartments([]));
  };

  const loadPolls = async () => {
    setLoading(true);
    try {
      const res = await api.get('/polls');
      setPolls(res.data?.data || []);
    } catch (e) {
      toast('Không thể lấy danh sách biểu quyết', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolls();
    loadDepartments();
  }, []);

  const loadResults = async (pollId) => {
    try {
      const res = await api.get(`/polls/${pollId}/results`);
      setPollResults(prev => ({
        ...prev,
        [pollId]: res.data?.data || []
      }));
    } catch (e) {
      console.error('Lỗi khi tải kết quả biểu quyết:', e);
    }
  };

  const loadUserVotes = async (pollId) => {
    try {
      const res = await api.get(`/polls/${pollId}/my-votes`);
      const votes = res.data?.data || [];
      setUserVotes(prev => ({ ...prev, [pollId]: votes }));
      setDbVotes(prev => ({ ...prev, [pollId]: votes }));
    } catch (e) {
      console.error('Lỗi khi tải bình chọn của bạn:', e);
    }
  };

  const togglePollExpand = (pollId) => {
    if (activePollId === pollId) {
      setActivePollId(null);
    } else {
      setActivePollId(pollId);
      loadResults(pollId);
      loadUserVotes(pollId);
    }
  };

  // Handle option checkbox/radio selection
  const handleOptionSelect = (pollId, optionId, allowMultiple) => {
    const currentSelected = userVotes[pollId] || [];
    if (allowMultiple) {
      if (currentSelected.includes(optionId)) {
        setUserVotes(prev => ({
          ...prev,
          [pollId]: currentSelected.filter(id => id !== optionId)
        }));
      } else {
        setUserVotes(prev => ({
          ...prev,
          [pollId]: [...currentSelected, optionId]
        }));
      }
    } else {
      setUserVotes(prev => ({
        ...prev,
        [pollId]: [optionId]
      }));
    }
  };

  const handleVoteSubmit = async (pollId) => {
    const selectedOptions = userVotes[pollId] || [];
    if (selectedOptions.length === 0) {
      toast('Vui lòng chọn ít nhất một đáp án!', 'error');
      return;
    }
    try {
      await api.post(`/polls/${pollId}/vote`, { optionIds: selectedOptions });
      toast('Đã ghi nhận bình chọn của bạn thành công! 🎉', 'success');
      loadResults(pollId);
      loadUserVotes(pollId);
    } catch (err) {
      toast(err.response?.data?.message || 'Lỗi khi bình chọn', 'error');
    }
  };

  const handleVoteRetract = async (pollId) => {
    if (!window.confirm('Bạn có chắc muốn hủy bỏ bình chọn của mình cho cuộc biểu quyết này?')) return;
    try {
      await api.delete(`/polls/${pollId}/vote`);
      toast('Đã hủy bỏ bình chọn của bạn thành công! 🗳️', 'success');
      loadResults(pollId);
      loadUserVotes(pollId);
    } catch (err) {
      toast(err.response?.data?.message || 'Lỗi khi hủy bình chọn', 'error');
    }
  };

  const handleClosePoll = async (id) => {
    if (!window.confirm('Bạn muốn đóng cuộc biểu quyết này sớm?')) return;
    try {
      const res = await api.post(`/polls/${id}/close`);
      toast('Đã đóng cuộc biểu quyết!', 'success');
      setPolls(prev => prev.map(p => p.id === id ? res.data.data : p));
    } catch (e) {
      toast('Lỗi khi đóng cuộc biểu quyết', 'error');
    }
  };

  const handleDeletePoll = async (id) => {
    if (!window.confirm('Bạn muốn xóa hoàn toàn cuộc biểu quyết này?')) return;
    try {
      await api.delete(`/polls/${id}`);
      toast('Xóa cuộc biểu quyết thành công', 'success');
      setPolls(prev => prev.filter(p => p.id !== id));
      if (activePollId === id) setActivePollId(null);
    } catch (e) {
      toast('Lỗi khi xóa cuộc biểu quyết', 'error');
    }
  };

  // Form option array handlers
  const handleOptionTextChange = (index, value) => {
    const updated = [...newPoll.options];
    updated[index] = value;
    setNewPoll({ ...newPoll, options: updated });
  };

  const addOptionField = () => {
    setNewPoll({ ...newPoll, options: [...newPoll.options, ''] });
  };

  const removeOptionField = (index) => {
    if (newPoll.options.length <= 2) return;
    const updated = newPoll.options.filter((_, idx) => idx !== index);
    setNewPoll({ ...newPoll, options: updated });
  };

  const handleCreatePoll = async (e) => {
    e.preventDefault();
    const cleanOptions = newPoll.options.filter(o => o.trim() !== '');
    if (!newPoll.title || cleanOptions.length < 2) {
      toast('Tiêu đề và ít nhất 2 đáp án là bắt buộc!', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await api.post('/polls', {
        title: newPoll.title,
        description: newPoll.description,
        allowMultiple: newPoll.allowMultiple,
        expiresAt: newPoll.expiresAt ? newPoll.expiresAt + ':00' : null,
        departmentId: newPoll.departmentId ? Number(newPoll.departmentId) : null,
        options: cleanOptions
      });
      toast('Tạo cuộc biểu quyết thành công! 🗳️', 'success');
      setPolls(prev => [res.data.data, ...prev]);
      setNewPoll({ title: '', description: '', allowMultiple: false, expiresAt: '', departmentId: '', options: ['', ''] });
    } catch (err) {
      toast(err.response?.data?.message || 'Lỗi khi tạo biểu quyết', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Math helper
  const getPercentage = (count, total) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Biểu Quyết Nội Bộ</h1>
        <p>Bình chọn dân chủ, đóng góp ý kiến xây dựng hoạt động và định hướng của CLB</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: ['ADMIN', 'MANAGER'].includes(user?.role) ? '1.2fr 1fr' : '1fr', gap: 24 }}>
        {/* Left: Polls List */}
        <div className="bento-card" style={{ padding: 24 }}>
          <h3 className="mb-3" style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Vote size={18} className="text-purple" /> Cuộc biểu quyết đang diễn ra
          </h3>

          {loading ? (
            <div className="flex justify-center p-3" style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
          ) : polls.length === 0 ? (
            <p className="text-muted text-center" style={{ textAlign: 'center', padding: 40 }}>Chưa có cuộc bình chọn nào được tạo.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {polls.map(poll => {
                const results = pollResults[poll.id] || [];
                const totalVotes = results.reduce((sum, r) => sum + r.votesCount, 0);
                const isExpired = poll.expiresAt && new Date(poll.expiresAt) < new Date();
                const isClosed = poll.isClosed || isExpired;

                return (
                  <div key={poll.id} className="bento-card" style={{ padding: 18, borderLeft: `4px solid ${isClosed ? 'var(--text-secondary)' : 'var(--accent-2)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ cursor: 'pointer', flex: 1 }} onClick={() => togglePollExpand(poll.id)}>
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          {poll.title}
                          <span style={{
                            fontSize: '0.66rem',
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontWeight: 700,
                            background: poll.department ? 'rgba(139,92,246,0.15)' : 'rgba(52,211,153,0.15)',
                            color: poll.department ? 'var(--role-admin)' : 'var(--success)'
                          }}>
                            {poll.department ? `Ban ${poll.department.name}` : 'Toàn CLB'}
                          </span>
                          <span style={{
                            fontSize: '0.66rem',
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontWeight: 700,
                            background: isClosed ? 'rgba(156,163,175,0.12)' : 'rgba(189,0,255,0.12)',
                            color: isClosed ? 'var(--text-secondary)' : 'var(--neon-purple)'
                          }}>
                            {isClosed ? 'Đã kết thúc' : 'Đang mở'}
                          </span>
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{poll.description}</p>
                        
                        <div style={{ display: 'flex', gap: 16, fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: 10 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={12} /> {totalVotes} lượt bình chọn</span>
                          {poll.expiresAt && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Clock size={12} /> Hạn: {new Date(poll.expiresAt).toLocaleString('vi-VN')}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {['ADMIN', 'MANAGER'].includes(user?.role) && !isClosed && (
                          <button className="btn btn-ghost btn-sm" onClick={() => handleClosePoll(poll.id)} title="Kết thúc sớm" style={{ color: 'var(--neon-orange)' }}>
                            <X size={14} /> Khóa
                          </button>
                        )}
                        {['ADMIN', 'MANAGER'].includes(user?.role) && (
                          <button className="btn btn-ghost btn-sm" onClick={() => handleDeletePoll(poll.id)} title="Xóa cuộc bình chọn" style={{ color: 'var(--neon-red)' }}>
                            <Trash2 size={14} />
                          </button>
                        )}
                        <button className="btn btn-ghost btn-sm" onClick={() => togglePollExpand(poll.id)} style={{ padding: '0 6px' }}>
                          {activePollId === poll.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Expand Panel: Vote Form & Results Chart */}
                    {activePollId === poll.id && (
                      <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                        <div className="grid-2" style={{ alignItems: 'flex-start' }}>
                          {/* Option select list */}
                          {!isClosed ? (
                            <div className="flex-col gap-3">
                              <h5 style={{ margin: 0, fontWeight: 600, fontSize: '0.88rem' }}>Chọn phương án của bạn:</h5>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {(poll.options || []).map(opt => {
                                  const isSelected = (userVotes[poll.id] || []).includes(opt.id);
                                  return (
                                    <div key={opt.id} onClick={() => handleOptionSelect(poll.id, opt.id, poll.allowMultiple)} style={{
                                      display: 'flex', alignItems: 'center', gap: 10,
                                      padding: '8px 12px', background: 'var(--bg-inset)',
                                      borderRadius: 6, cursor: 'pointer', border: '1px solid var(--border)'
                                    }}>
                                      {isSelected ? (
                                        <CheckSquare size={16} className="text-purple" />
                                      ) : (
                                        <Square size={16} style={{ color: 'var(--text-secondary)' }} />
                                      )}
                                      <span style={{ fontSize: '0.84rem' }}>{opt.optionText}</span>
                                    </div>
                                  );
                                })}
                              </div>
                              <div style={{ display: 'flex', gap: 10 }}>
                                <button className="btn btn-primary" onClick={() => handleVoteSubmit(poll.id)} style={{ alignSelf: 'flex-start' }}>
                                  {dbVotes[poll.id] && dbVotes[poll.id].length > 0 ? 'Cập nhật bình chọn' : 'Gửi bình chọn'}
                                </button>
                                {dbVotes[poll.id] && dbVotes[poll.id].length > 0 && (
                                  <button className="btn btn-ghost" onClick={() => handleVoteRetract(poll.id)} style={{ color: 'var(--danger)', alignSelf: 'flex-start' }}>
                                    Hủy bình chọn
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                              Bình chọn này đã khép lại. Xem kết quả thống kê bên cạnh.
                            </div>
                          )}

                          {/* Results progress bars */}
                          <div className="flex-col gap-3" style={{ background: 'var(--bg-inset)', padding: 16, borderRadius: 8, border: '1px solid var(--border)' }}>
                            <h5 style={{ margin: 0, fontWeight: 600, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <PieChart size={14} className="text-purple" /> Kết quả thống kê
                            </h5>

                            {results.length === 0 ? (
                              <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Đang tải dữ liệu kết quả...</p>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {results.map(r => {
                                  const pct = getPercentage(r.votesCount, totalVotes);
                                  return (
                                    <div key={r.optionId} style={{ fontSize: '0.8rem' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <span>{r.optionText}</span>
                                        <strong>{r.votesCount} vote ({pct}%)</strong>
                                      </div>
                                      <div className="progress-track" style={{ height: 8, marginTop: 4 }}>
                                        <div className="progress-fill progress-accent" style={{ width: `${pct}%`, transition: 'width 0.5s' }} />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Create Poll (Admin/Manager only) */}
        {['ADMIN', 'MANAGER'].includes(user?.role) && (
          <div className="bento-card accent-purple" style={{ padding: 24, height: 'fit-content' }}>
            <h3 className="mb-3" style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <PlusCircle size={18} className="text-purple" /> Tạo cuộc biểu quyết mới
            </h3>
            <form onSubmit={handleCreatePoll} className="flex-col gap-3">
              <div className="form-group">
                <label className="form-label">Tiêu đề cuộc biểu quyết *</label>
                <input className="form-input" value={newPoll.title} onChange={e => setNewPoll({ ...newPoll, title: e.target.value })} placeholder="ví dụ: Lựa chọn màu áo thun CLB..." required />
              </div>
              <div className="form-group">
                <label className="form-label">Mô tả chi tiết</label>
                <textarea className="form-input" value={newPoll.description} onChange={e => setNewPoll({ ...newPoll, description: e.target.value })} placeholder="Giải thích rõ mục đích bình chọn và các nguyên tắc biểu quyết..." rows={2} />
              </div>

              <div className="form-group">
                <label className="form-label">Phạm vi biểu quyết *</label>
                <select className="form-select" value={newPoll.departmentId} onChange={e => setNewPoll({ ...newPoll, departmentId: e.target.value })}>
                  <option value="">Toàn câu lạc bộ (Toàn CLB)</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>Ban {d.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid-2">
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 24 }}>
                  <label className="form-label" style={{ marginBottom: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="checkbox" checked={newPoll.allowMultiple} onChange={e => setNewPoll({ ...newPoll, allowMultiple: e.target.checked })} />
                    Chọn nhiều đáp án
                  </label>
                </div>
                <div className="form-group">
                  <label className="form-label">Hạn chót biểu quyết</label>
                  <input className="form-input" type="datetime-local" value={newPoll.expiresAt} onChange={e => setNewPoll({ ...newPoll, expiresAt: e.target.value })} />
                </div>
              </div>

              {/* Dynamic options inputs */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Các phương án lựa chọn *</span>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={addOptionField} style={{ padding: '2px 8px', fontSize: '0.74rem' }}>
                    + Thêm
                  </button>
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
                  {newPoll.options.map((opt, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input className="form-input" value={opt} onChange={e => handleOptionTextChange(idx, e.target.value)} placeholder={`Phương án ${idx + 1}...`} required />
                      {newPoll.options.length > 2 && (
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeOptionField(idx)} style={{ color: 'var(--neon-red)', padding: '0 8px' }}>
                          🗑️
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button className="btn btn-primary" type="submit" disabled={saving} style={{ justifyContent: 'center', marginTop: 10 }}>
                {saving ? 'Đang tạo...' : 'Tạo Biểu Quyết'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api';
import { CalendarDays, Plus, MapPin, Clock, ChevronRight, X, QrCode, CheckCircle, Trash2, UserCheck, Download } from 'lucide-react';

const SESSION_TYPES = { PRACTICE: 'practice', REHEARSAL: 'rehearsal', PERFORMANCE: 'performance' };
const SESSION_LABELS = { PRACTICE: 'Buổi tập', REHEARSAL: 'Tổng duyệt', PERFORMANCE: 'Biểu diễn' };
const SESSION_COLORS = { PRACTICE: 'blue', REHEARSAL: 'purple', PERFORMANCE: 'orange' };



const TRANSLATED_STATUS = {
  DRAFT: 'Bản nháp',
  PLANNING: 'Đang chuẩn bị',
  APPROVED: 'Đã duyệt',
  ONGOING: 'Đang diễn ra',
  COMPLETED: 'Đã hoàn thành'
};

export default function Events() {
  const { isManager, user } = useAuth();
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [qrToken, setQrToken] = useState(null);
  const [qrSession, setQrSession] = useState(null);
  const [qrCountdown, setQrCountdown] = useState(0);

  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [editEventData, setEditEventData] = useState({ title: '', description: '', location: '', startTime: '', endTime: '', isPublic: false });

  const [guestTickets, setGuestTickets] = useState([]);
  const [ticketCodeInput, setTicketCodeInput] = useState('');
  const [soatVeLoading, setSoatVeLoading] = useState(false);
  const [eventDrawerTab, setEventDrawerTab] = useState('sessions');

  // Attendance management states
  const [showAttendance, setShowAttendance] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [attendanceMembers, setAttendanceMembers] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  // New event form
  const [newEvent, setNewEvent] = useState({ title: '', description: '', location: '', startTime: '', endTime: '' });
  // New session form
  const [newSession, setNewSession] = useState({ title: '', sessionDate: '', startTime: '', endTime: '', location: '', type: 'PRACTICE' });

  const handleStartEditEvent = () => {
    setEditEventData({
      title: selectedEvent.title,
      description: selectedEvent.description || '',
      location: selectedEvent.location || '',
      startTime: selectedEvent.startTime ? selectedEvent.startTime.substring(0, 16) : '',
      endTime: selectedEvent.endTime ? selectedEvent.endTime.substring(0, 16) : '',
      isPublic: selectedEvent.isPublic || false
    });
    setIsEditingEvent(true);
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    if (!editEventData.title || !editEventData.startTime || !editEventData.endTime) {
      toast('Vui lòng điền các trường bắt buộc', 'error');
      return;
    }
    try {
      const res = await api.put(`/events/${selectedEvent.id}`, {
        ...editEventData,
        departmentId: selectedEvent.departmentId
      });
      const updated = res.data?.data || res.data;
      setEvents(p => p.map(ev => ev.id === selectedEvent.id ? updated : ev));
      setSelectedEvent(updated);
      setIsEditingEvent(false);
      toast('Cập nhật sự kiện thành công! 🎪', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Lỗi khi cập nhật sự kiện', 'error');
    }
  };

  const handleDeleteEvent = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sự kiện này? Toàn bộ các buổi tập/diễn và công việc liên quan sẽ bị xóa sạch.')) return;
    try {
      await api.delete(`/events/${selectedEvent.id}`);
      setEvents(p => p.filter(ev => ev.id !== selectedEvent.id));
      setDrawerOpen(false);
      setSelectedEvent(null);
      toast('Đã xóa sự kiện thành công', 'success');
    } catch (err) {
      toast('Lỗi khi xóa sự kiện', 'error');
    }
  };

  const handleUpdateStatus = async (nextStatus) => {
    try {
      const res = await api.put(`/events/${selectedEvent.id}/status`, { status: nextStatus, note: 'Cập nhật trạng thái sự kiện' });
      const updated = res.data?.data || res.data;
      setEvents(p => p.map(ev => ev.id === selectedEvent.id ? updated : ev));
      setSelectedEvent(updated);
      toast(`Đã chuyển trạng thái sang: ${TRANSLATED_STATUS[nextStatus]}`, 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Lỗi cập nhật trạng thái', 'error');
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa buổi tập này?')) return;
    try {
      await api.delete(`/sessions/${sessionId}`);
      setSessions(p => p.filter(s => s.id !== sessionId));
      toast('Đã xóa buổi tập', 'success');
    } catch (err) {
      toast('Lỗi khi xóa buổi tập', 'error');
    }
  };

  useEffect(() => {
    api.get('/events')
      .then(r => {
        const data = r.data?.data || r.data;
        setEvents(Array.isArray(data) ? data : []);
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const openEvent = async (event) => {
    setSelectedEvent(event);
    setDrawerOpen(true);
    setEventDrawerTab('sessions');
    setGuestTickets([]);
    try {
      const r = await api.get(`/events/${event.id}/sessions`);
      const data = r.data?.data || r.data || [];
      setSessions(Array.isArray(data) ? data : []);
    } catch { 
      setSessions([]); 
    }
    if (event.isPublic) {
      try {
        const ticketRes = await api.get(`/events/${event.id}/tickets`);
        setGuestTickets(ticketRes.data?.data || []);
      } catch (err) {
        console.error('Không thể tải vé khách mời:', err);
      }
    }
  };

  const handleCheckInGuest = async (e) => {
    e.preventDefault();
    if (!ticketCodeInput) return;
    setSoatVeLoading(true);
    try {
      const res = await api.post('/events/tickets/check-in', { ticketCode: ticketCodeInput });
      toast(res.data?.message || 'Soát vé thành công!', 'success');
      setTicketCodeInput('');
      const ticketRes = await api.get(`/events/${selectedEvent.id}/tickets`);
      setGuestTickets(ticketRes.data?.data || []);
    } catch (err) {
      toast(err.response?.data?.message || 'Lỗi khi soát vé', 'error');
    } finally {
      setSoatVeLoading(false);
    }
  };

  const createEvent = async () => {
    if (!newEvent.title || !newEvent.startTime || !newEvent.endTime) { toast('Vui lòng nhập tên và thời gian sự kiện', 'error'); return; }
    try {
      const payload = { ...newEvent, departmentId: user?.departmentId, isPublic: newEvent.isPublic || false };
      const r = await api.post('/events', payload);
      const created = r.data?.data || r.data;
      setEvents(p => [...p, created]);
      setNewEvent({ title: '', description: '', location: '', startTime: '', endTime: '', isPublic: false });
      setShowCreateEvent(false);
      toast('Tạo sự kiện thành công! 🎉', 'success');
    } catch (e) {
      toast(e.response?.data?.message || 'Lỗi khi tạo sự kiện', 'error');
    }
  };

  const createSession = async () => {
    if (!newSession.title || !newSession.sessionDate) { toast('Điền đầy đủ thông tin buổi tập', 'error'); return; }
    try {
      const r = await api.post(`/events/${selectedEvent.id}/sessions`, newSession);
      const created = r.data?.data || r.data;
      setSessions(p => [...p, created]);
      setNewSession({ title: '', sessionDate: '', startTime: '', endTime: '', location: '', type: 'PRACTICE' });
      setShowCreateSession(false);
      toast('Thêm buổi tập thành công!', 'success');
    } catch (e) {
      toast(e.response?.data?.message || 'Lỗi khi thêm buổi tập', 'error');
    }
  };

  const generateQR = async (sessionId) => {
    try {
      const r = await api.get(`/attendance/generate-qr/${sessionId}`);
      const token = r.data?.data?.qrToken || r.data?.qrToken || r.data;
      setQrToken(token);
      setQrSession(sessionId);
      setQrCountdown(30);
      const timer = setInterval(() => {
        setQrCountdown(p => {
          if (p <= 1) { clearInterval(timer); setQrToken(null); return 0; }
          return p - 1;
        });
      }, 1000);
    } catch (e) {
      toast('Không thể tạo mã QR', 'error');
    }
  };

  const checkIn = async (sessionId) => {
    try {
      await api.post('/attendance/check-in', { sessionId, note: 'Check-in từ giao diện web' });
      toast('Điểm danh thành công! +10 XP 🎯', 'success');
    } catch (e) {
      toast(e.response?.data?.message || 'Lỗi điểm danh', 'error');
    }
  };

  const openAttendance = async (session) => {
    setSelectedSession(session);
    setLoadingAttendance(true);
    try {
      const deptId = selectedEvent.departmentId || user?.departmentId;
      const [membersRes, attendanceRes] = await Promise.all([
        api.get(`/departments/${deptId}/members`),
        api.get(`/attendance/session/${session.id}`)
      ]);
      setAttendanceMembers(membersRes.data?.data || membersRes.data || []);
      setAttendanceRecords(attendanceRes.data?.data || attendanceRes.data || []);
      setShowAttendance(true);
    } catch (err) {
      toast('Không thể tải danh sách điểm danh', 'error');
    } finally {
      setLoadingAttendance(false);
    }
  };

  const updateAttendanceStatus = async (userId, status, note = '') => {
    try {
      const res = await api.put(`/attendance/session/${selectedSession.id}/user/${userId}`, null, {
        params: { status, note }
      });
      const updatedRecord = res.data?.data || res.data;
      setAttendanceRecords(prev => {
        const idx = prev.findIndex(r => r.userId === userId);
        if (idx > -1) {
          return prev.map((r, i) => i === idx ? updatedRecord : r);
        } else {
          return [...prev, updatedRecord];
        }
      });
      toast('Cập nhật điểm danh thành công', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Lỗi khi cập nhật điểm danh', 'error');
    }
  };

  const handleAutoMarkAbsent = async () => {
    try {
      const res = await api.post(`/attendance/session/${selectedSession.id}/auto-absent`);
      const count = res.data?.data || 0;
      toast(`Đã tự động đánh vắng ${count} thành viên`, 'success');
      const attendanceRes = await api.get(`/attendance/session/${selectedSession.id}`);
      setAttendanceRecords(attendanceRes.data?.data || attendanceRes.data || []);
    } catch (err) {
      toast(err.response?.data?.message || 'Lỗi khi đánh vắng tự động', 'error');
    }
  };

  const handleExportAttendance = async () => {
    try {
      const response = await api.get(`/export/attendance/${selectedSession.id}`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `attendance_session_${selectedSession.id}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast('Xuất báo cáo CSV thành công!', 'success');
    } catch (err) {
      toast('Lỗi khi xuất báo cáo điểm danh', 'error');
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      DRAFT: 'grey', PLANNING: 'blue', APPROVED: 'green', ONGOING: 'orange', COMPLETED: 'purple'
    };
    return <span className={`badge badge-${map[status] || 'grey'}`} style={{ fontWeight: 600 }}>{TRANSLATED_STATUS[status] || status}</span>;
  };

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1>Lịch trình & Sự kiện</h1>
          <p>Theo dõi lịch tập, tổng duyệt và biểu diễn của câu lạc bộ</p>
        </div>
        {isManager() && (
          <button className="btn btn-primary" onClick={() => setShowCreateEvent(true)}>
            <Plus size={16} /> Tạo sự kiện
          </button>
        )}
      </div>

      {/* Events grid */}
      {loading
        ? <div className="loading-page"><div className="spinner" /></div>
        : events.length === 0
          ? <div className="empty-state"><CalendarDays size={48} /><h3>Chưa có sự kiện nào</h3><p>Trưởng ban có thể tạo sự kiện mới để bắt đầu lên lịch</p></div>
          : <div className="grid-3">
              {events.map(ev => (
                <div key={ev.id} className="bento-card accent-purple" style={{ cursor: 'pointer' }} onClick={() => openEvent(ev)}>
                  <div className="flex items-center justify-between mb-2">
                    {getStatusBadge(ev.status)}
                    <ChevronRight size={16} className="text-muted" />
                  </div>
                  <h3 style={{ marginBottom: 8, fontSize: '0.95rem' }}>{ev.title}</h3>
                  {ev.location && (
                    <div className="flex items-center gap-2 text-muted text-xs mt-1">
                      <MapPin size={12} /> {ev.location}
                    </div>
                  )}
                  {ev.description && <p className="text-xs mt-1" style={{ fontSize: '0.78rem' }}>{ev.description}</p>}
                </div>
              ))}
            </div>}

      {/* QR Code display */}
      {qrToken && createPortal(
        <div className="modal-overlay" onClick={() => setQrToken(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
            <div className="modal-header">
              <span className="modal-title"><QrCode size={18} style={{ display: 'inline', marginRight: 6 }} />Mã QR Điểm danh</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setQrToken(null)}><X size={16} /></button>
            </div>
            <div style={{
              background: '#fff', padding: 12, borderRadius: 12, display: 'inline-block',
              marginBottom: 14, border: '4px solid var(--neon-purple)',
            }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrToken)}`} 
                alt="QR Code" 
                style={{ display: 'block', width: 180, height: 180 }}
              />
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
              Cho thành viên quét mã hoặc copy token bên dưới
            </div>
            <div style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
              borderRadius: 8, padding: '8px 14px', fontFamily: 'monospace', fontSize: '0.72rem',
              wordBreak: 'break-all', marginBottom: 12
            }}>{qrToken}</div>
            <div className={`badge ${qrCountdown > 10 ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '1rem', padding: '6px 16px' }}>
              ⏱ Hết hạn sau: {qrCountdown}s
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Drawer: event sessions timeline */}
      {drawerOpen && selectedEvent && createPortal(
        <>
          <div className="drawer-overlay" onClick={() => { if (!isEditingEvent) setDrawerOpen(false); }} />
          <div className="drawer" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
            <div className="flex items-center justify-between mb-3">
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
                {isEditingEvent ? 'Chỉnh sửa sự kiện' : selectedEvent.title}
              </h2>
              <button className="btn btn-ghost btn-sm" onClick={() => { setDrawerOpen(false); setIsEditingEvent(false); }}><X size={16} /></button>
            </div>

            {isEditingEvent ? (
              /* Edit Event Form */
              <form onSubmit={handleUpdateEvent} style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                <div className="form-group">
                  <label className="form-label">Tên sự kiện *</label>
                  <input className="form-input" value={editEventData.title} onChange={e => setEditEventData(p => ({ ...p, title: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Địa điểm</label>
                  <input className="form-input" value={editEventData.location} onChange={e => setEditEventData(p => ({ ...p, location: e.target.value }))} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="form-group">
                    <label className="form-label">Bắt đầu *</label>
                    <input className="form-input" type="datetime-local" value={editEventData.startTime} onChange={e => setEditEventData(p => ({ ...p, startTime: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Kết thúc *</label>
                    <input className="form-input" type="datetime-local" value={editEventData.endTime} onChange={e => setEditEventData(p => ({ ...p, endTime: e.target.value }))} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Mô tả</label>
                  <textarea className="form-textarea" value={editEventData.description} onChange={e => setEditEventData(p => ({ ...p, description: e.target.value }))} style={{ minHeight: 80 }} />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label className="form-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="checkbox" checked={editEventData.isPublic} onChange={e => setEditEventData(p => ({ ...p, isPublic: e.target.checked }))} />
                    Sự kiện công khai (Cho phép đăng ký vé khách mời)
                  </label>
                </div>
                <div className="modal-footer" style={{ marginTop: 'auto', paddingTop: 12 }}>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIsEditingEvent(false)}>Hủy</button>
                  <button type="submit" className="btn btn-primary btn-sm">Lưu thay đổi</button>
                </div>
              </form>
            ) : (
              /* View Details & Sessions */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  {getStatusBadge(selectedEvent.status)}
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>Tạo bởi: {selectedEvent.createdByName || 'Ẩn danh'}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: 'var(--glass-thick)', padding: '10px 14px', borderRadius: 8, border: '0.5px solid var(--border-glass-default)' }}>
                  {selectedEvent.location && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-2)', fontSize: '0.78rem' }}>
                      <MapPin size={14} style={{ color: 'var(--accent)' }} /> <strong>Địa điểm:</strong> {selectedEvent.location}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-2)', fontSize: '0.78rem' }}>
                    <Clock size={14} style={{ color: 'var(--accent)' }} /> 
                    <strong>Thời gian:</strong> {new Date(selectedEvent.startTime).toLocaleString('vi-VN')} – {new Date(selectedEvent.endTime).toLocaleString('vi-VN')}
                  </div>
                  {selectedEvent.description && (
                    <p style={{ margin: '6px 0 0 0', fontSize: '0.78rem', color: 'var(--text-3)', borderTop: '0.5px solid var(--border-glass-subtle)', paddingTop: 6, whiteSpace: 'pre-wrap' }}>
                      {selectedEvent.description}
                    </p>
                  )}
                </div>

                {/* Admin/Manager Operations */}
                {isManager() && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 14px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: 8, border: '0.5px dashed rgba(99, 102, 241, 0.2)' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-light)', letterSpacing: '0.04em' }}>
                      ⚙️ QUẢN TRỊ SỰ KIỆN
                    </div>
                    
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" style={{ flex: 1, padding: '4px 8px', fontSize: '0.72rem' }} onClick={handleStartEditEvent}>
                        Chỉnh sửa
                      </button>
                      <button className="btn btn-danger btn-sm" style={{ flex: 1, padding: '4px 8px', fontSize: '0.72rem' }} onClick={handleDeleteEvent}>
                        Xóa sự kiện
                      </button>
                    </div>

                    {/* Admin status state machine progression */}
                    {user?.role === 'ADMIN' && (
                      <div style={{ borderTop: '0.5px solid var(--border-glass-subtle)', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>Cập nhật trạng thái duyệt:</span>
                        {(selectedEvent.status === 'DRAFT' || selectedEvent.status === 'PLANNING') && (
                          <button className="btn btn-success btn-sm" style={{ width: '100%', justifyContent: 'center', fontSize: '0.72rem' }} onClick={() => handleUpdateStatus('APPROVED')}>
                            ✓ Phê duyệt sự kiện (APPROVED)
                          </button>
                        )}
                        {selectedEvent.status === 'APPROVED' && (
                          <button className="btn btn-success btn-sm" style={{ width: '100%', justifyContent: 'center', fontSize: '0.72rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)' }} onClick={() => handleUpdateStatus('ONGOING')}>
                            ▶ Bắt đầu diễn ra (ONGOING)
                          </button>
                        )}
                        {selectedEvent.status === 'ONGOING' && (
                          <button className="btn btn-success btn-sm" style={{ width: '100%', justifyContent: 'center', fontSize: '0.72rem', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }} onClick={() => handleUpdateStatus('COMPLETED')}>
                            🏁 Đánh dấu Hoàn thành (COMPLETED)
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <hr className="divider" style={{ margin: '4px 0' }} />

                {selectedEvent.isPublic && (
                  <div className="flex gap-2" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 6, marginBottom: 12 }}>
                    <button className={`btn btn-sm ${eventDrawerTab === 'sessions' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setEventDrawerTab('sessions')} style={{ fontSize: '0.74rem', padding: '4px 10px' }} type="button">
                      Lịch trình
                    </button>
                    <button className={`btn btn-sm ${eventDrawerTab === 'tickets' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setEventDrawerTab('tickets')} style={{ fontSize: '0.74rem', padding: '4px 10px' }} type="button">
                      Soát vé & Khách mời ({guestTickets.length})
                    </button>
                  </div>
                )}

                {eventDrawerTab === 'sessions' ? (
                  <>
                    <div className="flex items-center justify-between">
                      <h4 style={{ margin: 0, fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-1)' }}>Lịch trình buổi tập / diễn</h4>
                      {isManager() && (
                        <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', fontSize: '0.72rem', gap: 4 }} onClick={() => setShowCreateSession(true)} type="button">
                          <Plus size={12} /> Thêm buổi
                        </button>
                      )}
                    </div>

                    {sessions.length === 0 ? (
                      <div className="empty-state" style={{ padding: 24 }}><Clock size={28} /><p style={{ fontSize: '0.78rem' }}>Chưa có buổi tập nào</p></div>
                    ) : (
                      <div className="timeline" style={{ flex: 1 }}>
                    {sessions.map((s, i) => {
                      const typeClass = SESSION_TYPES[s.type] || 'practice';
                      const colorClass = SESSION_COLORS[s.type] || 'blue';
                      return (
                        <div key={s.id} className="timeline-item">
                          <div className="timeline-line">
                            <div className={`timeline-dot`} style={{ background: `var(--neon-${colorClass})` }} />
                            {i < sessions.length - 1 && <div className="timeline-connector" />}
                          </div>
                          <div className={`timeline-content ${typeClass}`} style={{ padding: '8px 12px' }}>
                            <div className="flex items-center justify-between mb-1">
                              <span className={`badge badge-${colorClass}`} style={{ fontSize: '0.65rem' }}>{SESSION_LABELS[s.type] || s.type}</span>
                              <div style={{ display: 'flex', gap: 4 }}>
                                {isManager() && (
                                  <>
                                    <button className="btn btn-ghost btn-icon btn-sm" style={{ width: 22, height: 22 }} onClick={() => generateQR(s.id)} title="Tạo QR Điểm danh">
                                      <QrCode size={11} />
                                    </button>
                                    <button className="btn btn-ghost btn-icon btn-sm" style={{ width: 22, height: 22 }} onClick={() => openAttendance(s)} title="Quản lý điểm danh">
                                      <UserCheck size={11} />
                                    </button>
                                    <button className="btn btn-ghost btn-icon btn-sm" style={{ width: 22, height: 22, color: 'var(--danger)' }} onClick={() => handleDeleteSession(s.id)} title="Xóa buổi này">
                                      <Trash2 size={11} />
                                    </button>
                                  </>
                                )}
                                {!isManager() && (
                                  <button className="btn btn-success btn-sm" style={{ padding: '3px 8px', fontSize: '0.65rem', gap: 3 }} onClick={() => checkIn(s.id)}>
                                    <CheckCircle size={10} /> Check-in
                                  </button>
                                )}
                              </div>
                            </div>
                            <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-1)', marginBottom: 2 }}>{s.title}</div>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted" style={{ fontSize: '0.7rem' }}>
                              <span>📅 {s.sessionDate}</span>
                              {s.startTime && <span>🕐 {s.startTime} – {s.endTime}</span>}
                            </div>
                            {s.location && <div className="text-xs text-muted mt-1" style={{ fontSize: '0.7rem' }}>📍 {s.location}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                  </>
                ) : (
                  /* TAB TICKETS */
                  <div className="flex-col gap-3">
                    {isManager() && (
                      <form onSubmit={handleCheckInGuest} style={{ display: 'flex', gap: 8 }}>
                        <input className="form-input" style={{ fontSize: '0.82rem', flex: 1 }} value={ticketCodeInput} onChange={e => setTicketCodeInput(e.target.value)} placeholder="Nhập mã vé TKT-..." required />
                        <button className="btn btn-primary btn-sm" type="submit" disabled={soatVeLoading}>
                          {soatVeLoading ? '...' : 'Soát vé'}
                        </button>
                      </form>
                    )}

                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                      Link đăng ký vé: <a href={`/public/events/${selectedEvent.id}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--neon-blue)', fontWeight: 600 }}>/public/events/{selectedEvent.id}</a>
                    </div>

                    <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                      {guestTickets.length === 0 ? (
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textAlign: 'center', padding: 20 }}>Chưa có khách mời nào đăng ký.</p>
                      ) : (
                        <table className="data-table" style={{ width: '100%', fontSize: '0.74rem' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                              <th>Khách mời</th>
                              <th>Mã vé</th>
                              <th>Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody>
                            {guestTickets.map(t => (
                              <tr key={t.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td>
                                  <div style={{ fontWeight: 600 }}>{t.fullName}</div>
                                  <div style={{ fontSize: '0.64rem', color: 'var(--text-secondary)' }}>{t.email} | {t.phone}</div>
                                </td>
                                <td style={{ fontFamily: 'monospace' }}>{t.ticketCode}</td>
                                <td>
                                  <span style={{
                                    padding: '1px 5px', borderRadius: 4, fontSize: '0.64rem', fontWeight: 600,
                                    color: t.status === 'CHECKED_IN' ? '#00ff66' : '#9ca3af',
                                    background: t.status === 'CHECKED_IN' ? 'rgba(0,255,102,0.1)' : 'rgba(156,163,175,0.1)'
                                  }}>{t.status === 'CHECKED_IN' ? 'Đã check-in' : 'Chưa'}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>,
        document.body
      )}

      {/* Create Event Modal */}
      {showCreateEvent && createPortal(
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <span className="modal-title">Tạo Sự kiện mới</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCreateEvent(false)}><X size={16} /></button>
            </div>
            <div className="flex-col gap-3">
              <div className="form-group">
                <label className="form-label">Tên sự kiện *</label>
                <input className="form-input" placeholder="VD: Đêm diễn Khai mạc Festival..." value={newEvent.title} onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Địa điểm</label>
                <input className="form-input" placeholder="Hội trường A5..." value={newEvent.location} onChange={e => setNewEvent(p => ({ ...p, location: e.target.value }))} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Bắt đầu *</label>
                  <input className="form-input" type="datetime-local" value={newEvent.startTime} onChange={e => setNewEvent(p => ({ ...p, startTime: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Kết thúc *</label>
                  <input className="form-input" type="datetime-local" value={newEvent.endTime} onChange={e => setNewEvent(p => ({ ...p, endTime: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Mô tả</label>
                <textarea className="form-textarea" placeholder="Mô tả ngắn về sự kiện..." value={newEvent.description} onChange={e => setNewEvent(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label className="form-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="checkbox" checked={newEvent.isPublic || false} onChange={e => setNewEvent(p => ({ ...p, isPublic: e.target.checked }))} />
                  Sự kiện công khai (Cho phép đăng ký vé khách mời)
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowCreateEvent(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={createEvent}><Plus size={16} /> Tạo sự kiện</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Create Session Modal */}
      {showCreateSession && selectedEvent && createPortal(
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <span className="modal-title">Thêm Buổi tập / Diễn</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCreateSession(false)}><X size={16} /></button>
            </div>
            <div className="flex-col gap-3">
              <div className="form-group">
                <label className="form-label">Tên buổi *</label>
                <input className="form-input" placeholder="VD: Buổi tập 1, Tổng duyệt cuối..." value={newSession.title} onChange={e => setNewSession(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Ngày *</label>
                  <input 
                    className="form-input" 
                    type="date" 
                    value={newSession.sessionDate} 
                    min={selectedEvent.startTime ? selectedEvent.startTime.substring(0, 10) : ''}
                    max={selectedEvent.endTime ? selectedEvent.endTime.substring(0, 10) : ''}
                    onChange={e => setNewSession(p => ({ ...p, sessionDate: e.target.value }))} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Loại</label>
                  <select className="form-select" value={newSession.type} onChange={e => setNewSession(p => ({ ...p, type: e.target.value }))}>
                    <option value="PRACTICE">Buổi tập</option>
                    <option value="REHEARSAL">Tổng duyệt</option>
                    <option value="PERFORMANCE">Biểu diễn</option>
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Giờ bắt đầu</label>
                  <input className="form-input" type="time" value={newSession.startTime} onChange={e => setNewSession(p => ({ ...p, startTime: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Giờ kết thúc</label>
                  <input className="form-input" type="time" value={newSession.endTime} onChange={e => setNewSession(p => ({ ...p, endTime: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Địa điểm</label>
                <input className="form-input" placeholder="Phòng tập B2..." value={newSession.location} onChange={e => setNewSession(p => ({ ...p, location: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowCreateSession(false)}>Hủy</button>
              <button className="btn btn-success" onClick={createSession}><Plus size={16} /> Thêm buổi</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Attendance Management Modal */}
      {showAttendance && selectedSession && createPortal(
        <div className="modal-overlay">
          <div className="modal-box" style={{ width: 'min(760px, 95vw)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <span className="modal-title">Điểm danh: {selectedSession.title}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAttendance(false)}><X size={16} /></button>
            </div>
            
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-sm" onClick={handleAutoMarkAbsent} style={{ gap: 6 }}>
                ⚡ Tự động đánh vắng
              </button>
              <button className="btn btn-success btn-sm" onClick={handleExportAttendance} style={{ gap: 6 }}>
                <Download size={14} /> Xuất báo cáo CSV
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', minHeight: 280 }}>
              {loadingAttendance ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                  <div className="spinner" />
                </div>
              ) : attendanceMembers.length === 0 ? (
                <p className="text-center text-muted" style={{ padding: 20 }}>Không có thành viên nào trong ban này</p>
              ) : (
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid var(--border-color)', textAlign: 'left' }}>
                      <th style={{ padding: 10 }}>Họ và tên</th>
                      <th style={{ padding: 10 }}>Giờ Check-in</th>
                      <th style={{ padding: 10 }}>Giờ Check-out</th>
                      <th style={{ padding: 10 }}>Trạng thái</th>
                      <th style={{ padding: 10 }}>Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceMembers.map(member => {
                      const record = attendanceRecords.find(r => r.userId === member.id);
                      const currentStatus = record ? record.status : 'CHƯA_ĐIỂM_DANH';
                      const checkInTime = record?.checkInTime ? new Date(record.checkInTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—';
                      const checkOutTime = record?.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—';
                      const noteVal = record?.note || '';

                      return (
                        <tr key={member.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: 10, fontWeight: 500 }}>{member.fullName}</td>
                          <td style={{ padding: 10, fontFamily: 'monospace' }}>{checkInTime}</td>
                          <td style={{ padding: 10, fontFamily: 'monospace' }}>{checkOutTime}</td>
                          <td style={{ padding: 10 }}>
                            <select
                              className="form-select"
                              style={{
                                padding: '4px 8px',
                                fontSize: '0.8rem',
                                width: '150px',
                                borderRadius: '4px',
                                border: '1px solid var(--border-color)',
                                background: currentStatus === 'PRESENT' ? 'rgba(52, 211, 153, 0.15)' :
                                            currentStatus === 'LATE' ? 'rgba(251, 191, 36, 0.15)' :
                                            currentStatus === 'ABSENT' ? 'rgba(239, 68, 68, 0.15)' :
                                            currentStatus === 'EXCUSED' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                                color: currentStatus === 'PRESENT' ? '#34d399' :
                                       currentStatus === 'LATE' ? '#fbbf24' :
                                       currentStatus === 'ABSENT' ? '#ef4444' :
                                       currentStatus === 'EXCUSED' ? '#38bdf8' : 'var(--text-muted)'
                              }}
                              value={currentStatus}
                              onChange={e => {
                                if (e.target.value !== 'CHƯA_ĐIỂM_DANH') {
                                  updateAttendanceStatus(member.id, e.target.value, record?.note || '');
                                }
                              }}
                            >
                              <option value="CHƯA_ĐIỂM_DANH" disabled>Chưa điểm danh</option>
                              <option value="PRESENT" disabled={currentStatus !== 'PRESENT'}>PRESENT</option>
                              <option value="LATE">LATE</option>
                              <option value="ABSENT">ABSENT</option>
                              <option value="EXCUSED">EXCUSED</option>
                            </select>
                          </td>
                          <td style={{ padding: 10 }}>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Thêm ghi chú..."
                              style={{ padding: '4px 8px', fontSize: '0.78rem', width: '100%', minWidth: '100px' }}
                              defaultValue={noteVal}
                              onBlur={e => {
                                if (e.target.value !== noteVal && currentStatus !== 'CHƯA_ĐIỂM_DANH') {
                                  updateAttendanceStatus(member.id, currentStatus, e.target.value);
                                }
                              }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            
            <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
              <button className="btn btn-ghost" onClick={() => setShowAttendance(false)}>Đóng</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

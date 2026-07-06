import { useState, useEffect, useRef } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api';
import { ChevronLeft, ChevronRight, Plus, X, MapPin, Clock, Tag, Check } from 'lucide-react';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, isToday } from 'date-fns';
import { vi } from 'date-fns/locale';

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────
const SLOT_TYPES = [
  { value: 'PRACTICE',    label: 'Luyện tập',   color: '#6366f1', cls: 'slot-practice' },
  { value: 'MEETING',     label: 'Họp',         color: '#f59e0b', cls: 'slot-meeting' },
  { value: 'PERFORMANCE', label: 'Biểu diễn',  color: '#f43f5e', cls: 'slot-performance' },
  { value: 'REHEARSAL',   label: 'Tổng duyệt',  color: '#8b5cf6', cls: 'slot-rehearsal' },
  { value: 'TASK',        label: 'Hạn nộp Task', color: '#f43f5e', cls: 'slot-task' },
  { value: 'OTHER',       label: 'Khác',        color: '#10b981', cls: 'slot-other' },
];

const SELECTABLE_SLOT_TYPES = [
  { value: 'PRACTICE',    label: 'Luyện tập',   color: '#6366f1' },
  { value: 'MEETING',     label: 'Họp',         color: '#f59e0b' },
  { value: 'PERFORMANCE', label: 'Biểu diễn',  color: '#f43f5e' },
  { value: 'OTHER',       label: 'Khác',        color: '#10b981' },
];

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 06:00 → 22:00
const DAYS_VN = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
const DAYS_SHORT = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function getTypeInfo(type) {
  return SLOT_TYPES.find(t => t.value === type) || SLOT_TYPES[0];
}

// Map API Schedule Slots to UI properties
const mapApiSlots = (apiSlots) => {
  return apiSlots.map(s => {
    if (s.day !== undefined) return s; // Already mapped

    const day = s.dayOfWeek - 1; // 1-7 to 0-6
    const startHour = s.startTime ? parseInt(s.startTime.split(':')[0]) : 0;
    const endHour = s.endTime ? parseInt(s.endTime.split(':')[0]) : 0;

    return {
      id: s.id,
      day,
      startHour,
      endHour,
      title: s.title,
      location: s.location,
      type: s.type,
      notes: s.notes,
      color: s.color || getTypeInfo(s.type).color,
      source: s.source || 'SCHEDULE',
      eventId: s.eventId,
      taskId: s.taskId
    };
  });
};

// ──────────────────────────────────────────────
// Admin/Manager Calendar View
// ──────────────────────────────────────────────
function AdminScheduleView({ user }) {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [schedule, setSchedule]   = useState(null);
  const [slots, setSlots]         = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [newSlot, setNewSlot]     = useState({ title: '', type: 'PRACTICE', day: 0, startHour: 7, endHour: 9, location: '', notes: '' });
  const [isEditingSlot, setIsEditingSlot] = useState(false);
  const [editSlotData, setEditSlotData]   = useState(null);
  const toast = useToast();

  const handleStartEditSlot = (slot) => {
    setEditSlotData({
      id: slot.id,
      title: slot.title,
      type: slot.type,
      day: slot.day,
      startHour: slot.startHour,
      endHour: slot.endHour,
      location: slot.location || '',
      notes: slot.notes || ''
    });
    setIsEditingSlot(true);
  };

  const handleUpdateSlot = async (e) => {
    e.preventDefault();
    if (!editSlotData.title.trim()) { toast('Vui lòng điền tiêu đề', 'error'); return; }
    try {
      const dayOfWeek = editSlotData.day + 1; // 0-6 to 1-7
      const startTime = `${editSlotData.startHour.toString().padStart(2, '0')}:00`;
      const endTime = `${editSlotData.endHour.toString().padStart(2, '0')}:00`;

      const res = await api.put(`/schedules/slots/${editSlotData.id}`, {
        dayOfWeek,
        startTime,
        endTime,
        title: editSlotData.title,
        location: editSlotData.location,
        type: editSlotData.type,
        color: getTypeInfo(editSlotData.type).color,
        notes: editSlotData.notes
      });

      const updated = res.data?.data || res.data;
      setSlots(prev => prev.map(s => s.id === editSlotData.id ? {
        id: updated.id,
        day: updated.dayOfWeek - 1,
        startHour: parseInt(updated.startTime.split(':')[0]),
        endHour: parseInt(updated.endTime.split(':')[0]),
        title: updated.title,
        location: updated.location,
        type: updated.type,
        notes: updated.notes,
        color: updated.color || getTypeInfo(updated.type).color
      } : s));
      
      setIsEditingSlot(false);
      setSelectedSlot(null);
      toast('Cập nhật lịch thành công ⏰', 'success');
    } catch (err) {
      toast('Lỗi cập nhật mốc lịch', 'error');
    }
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekLabel = `Tuần ${format(weekStart, 'w')}: ${format(weekStart, 'dd/MM')} – ${format(addDays(weekStart, 6), 'dd/MM/yyyy')}`;

  // Fetch schedule and slots from API
  useEffect(() => {
    const scopeType = user.role === 'ADMIN' ? 'CLB' : 'DEPARTMENT';
    const scopeId = user.role === 'ADMIN' ? 1 : (user.departmentId || 1);
    const weekStr = format(weekStart, 'yyyy-MM-dd');

    // 1. Get schedule object to know if it exists (for adding slots later)
    api.get(`/schedules?scopeType=${scopeType}&scopeId=${scopeId}&week=${weekStr}`)
      .then(r => {
        const list = r.data?.data || r.data || [];
        if (Array.isArray(list) && list.length > 0 && list[0] && list[0].id) {
          setSchedule(list[0]);
        } else {
          setSchedule(null);
        }
      })
      .catch(() => {
        setSchedule(null);
      });

    // 2. Always fetch the week's slots (including event sessions and tasks)
    api.get(`/schedules/my-week?week=${weekStr}`)
      .then(sr => {
        const data = sr.data?.data || sr.data;
        const flatSlots = [];
        if (data && data.days) {
          Object.keys(data.days).forEach(dayOfWeek => {
            const slotsOfDay = data.days[dayOfWeek] || [];
            slotsOfDay.forEach(s => {
              flatSlots.push({
                ...s,
                dayOfWeek: parseInt(dayOfWeek)
              });
            });
          });
        }
        setSlots(mapApiSlots(flatSlots));
      })
      .catch(() => {
        toast('Không thể tải các mốc thời gian của lịch', 'error');
        setSlots([]);
      });
  }, [weekStart, user]);

  const addSlot = async () => {
    try {
      let currentSchedule = schedule;
      const scopeType = user.role === 'ADMIN' ? 'CLB' : 'DEPARTMENT';
      const scopeId = user.role === 'ADMIN' ? 1 : (user.departmentId || 1);
      const weekStr = format(weekStart, 'yyyy-MM-dd');

      // 1. Create schedule if it does not exist
      if (!currentSchedule || currentSchedule.id === -1) {
        const res = await api.post('/schedules', {
          title: `Lịch ${scopeType === 'CLB' ? 'CLB' : 'Ban'} - Tuần ${format(weekStart, 'w')}`,
          scopeType,
          scopeId,
          weekStart: weekStr
        });
        currentSchedule = res.data?.data || res.data;
        setSchedule(currentSchedule);
      }

      // 2. Create the schedule slot
      const dayOfWeek = newSlot.day + 1; // 0-6 to 1-7
      const startTime = `${newSlot.startHour.toString().padStart(2, '0')}:00`;
      const endTime = `${newSlot.endHour.toString().padStart(2, '0')}:00`;

      const resSlot = await api.post(`/schedules/${currentSchedule.id}/slots`, {
        dayOfWeek,
        startTime,
        endTime,
        title: newSlot.title,
        location: newSlot.location,
        type: newSlot.type,
        color: getTypeInfo(newSlot.type).color,
        notes: newSlot.notes
      });

      const createdSlot = resSlot.data?.data || resSlot.data;
      setSlots(prev => [...prev, ...mapApiSlots([createdSlot])]);
      setShowModal(false);
      setNewSlot({ title: '', type: 'PRACTICE', day: 0, startHour: 7, endHour: 9, location: '', notes: '' });
    } catch (e) {
      // Fallback local update
      setSlots(prev => [...prev, { id: Date.now(), ...newSlot }]);
      setShowModal(false);
      setNewSlot({ title: '', type: 'PRACTICE', day: 0, startHour: 7, endHour: 9, location: '', notes: '' });
    }
  };

  const deleteSlot = (id) => {
    setSlots(prev => prev.filter(s => s.id !== id));
    api.delete(`/schedules/slots/${id}`).catch(() => {});
  };

  const deleteEventSession = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa buổi tập/sự kiện này?')) return;
    try {
      await api.delete(`/sessions/${id}`);
      setSlots(prev => prev.filter(s => !(s.id === id && s.source === 'EVENT_SESSION')));
      toast('Xóa lịch sự kiện thành công ⏰', 'success');
    } catch (err) {
      toast('Lỗi khi xóa lịch sự kiện', 'error');
    }
  };

  const CELL_H = 48;

  return (
    <div className="schedule-page">
      {/* Header */}
      <div className="schedule-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div className="schedule-week-nav">
            <button className="schedule-week-btn" onClick={() => setWeekStart(w => subWeeks(w, 1))}>
              <ChevronLeft size={16} />
            </button>
            <span className="schedule-week-label">{weekLabel}</span>
            <button className="schedule-week-btn" onClick={() => setWeekStart(w => addWeeks(w, 1))}>
              <ChevronRight size={16} />
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {SLOT_TYPES.map(t => (
              <span key={t.value} style={{ fontSize: '0.65rem', fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: t.color + '20', color: t.color, border: `1px solid ${t.color}40` }}>
                {t.label}
              </span>
            ))}
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)} style={{ gap: 6 }}>
          <Plus size={14} /> Thêm lịch
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="schedule-grid-wrapper">
        <div className="schedule-grid">
          {/* Header row */}
          <div className="schedule-col-header time-col" />
          {weekDays.map((d, i) => (
            <div key={i} className={`schedule-col-header ${isToday(d) ? 'today' : ''}`}>
              <div>{DAYS_SHORT[i]}</div>
              <div style={{ fontSize: '1rem', fontWeight: isToday(d) ? 700 : 400, marginTop: 2 }}>{format(d, 'd')}</div>
            </div>
          ))}

          {/* Time rows */}
          {HOURS.map(h => (
            <div key={h} style={{ display: 'contents' }}>
              {/* Time label */}
              <div className="schedule-time-label" style={{ height: CELL_H, display: 'flex', alignItems: 'flex-start', paddingTop: 4 }}>
                {h.toString().padStart(2, '0')}:00
              </div>
              {/* Day cells */}
              {weekDays.map((d, di) => {
                const daySlots = slots.filter(s => s.day === di && s.startHour === h);
                return (
                  <div key={di} className={`schedule-cell ${isToday(d) ? 'today-col' : ''}`} style={{ height: CELL_H }}
                    onClick={() => { setNewSlot(n => ({ ...n, day: di, startHour: h, endHour: h + 1 })); setShowModal(true); }}>
                    {daySlots.map((s, idx) => {
                      const ti = getTypeInfo(s.type);
                      const spanH = (s.endHour - s.startHour) * CELL_H;
                      const N = daySlots.length;
                      const widthPct = 100 / N;
                      const leftPct = idx * widthPct;
                      return (
                        <div
                          key={s.id}
                          className={`schedule-slot-pill ${ti.cls}`}
                          style={{ 
                            height: spanH - 4, 
                            top: 2,
                            width: `calc(${widthPct}% - 4px)`,
                            left: `calc(${leftPct}% + 2px)`,
                            zIndex: 5 + idx
                          }}
                          onClick={e => { e.stopPropagation(); setSelectedSlot(s); setIsEditingSlot(false); }}
                          title={`${s.title} | ${s.startHour}:00–${s.endHour}:00`}
                        >
                          <div style={{ fontWeight: 700, lineHeight: 1.2 }}>{s.title}</div>
                          {spanH > 60 && <div style={{ opacity: 0.7, fontSize: '0.6rem' }}>{s.startHour}:00–{s.endHour}:00</div>}
                          {spanH > 80 && s.location && <div style={{ opacity: 0.6, fontSize: '0.6rem', marginTop: 2, display: 'flex', alignItems: 'center', gap: 2 }}><MapPin size={9} />{s.location}</div>}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Slot detail popup */}
      <AnimatePresence>
        {selectedSlot && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => { if (!isEditingSlot) setSelectedSlot(null); }}
          >
            <motion.div
              className="modal-box"
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: 420 }}
            >
              <div className="modal-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: getTypeInfo(selectedSlot.type).color + '20', color: getTypeInfo(selectedSlot.type).color }}>
                      {getTypeInfo(selectedSlot.type).label}
                    </span>
                    {selectedSlot.source === 'EVENT_SESSION' && (
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                        📅 Lịch Sự kiện
                      </span>
                    )}
                    {selectedSlot.source === 'TASK_DEADLINE' && (
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e' }}>
                        📋 Hạn công việc
                      </span>
                    )}
                  </div>
                  <div className="modal-title">{isEditingSlot ? 'Chỉnh sửa mốc lịch' : selectedSlot.title}</div>
                </div>
                <button className="btn btn-ghost btn-icon" onClick={() => setSelectedSlot(null)}><X size={15} /></button>
              </div>

              {isEditingSlot && editSlotData ? (
                /* Edit Slot Form */
                <form onSubmit={handleUpdateSlot} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Tiêu đề *</label>
                    <input className="form-input" value={editSlotData.title} onChange={e => setEditSlotData(n => ({ ...n, title: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Loại</label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {SELECTABLE_SLOT_TYPES.map(t => (
                        <button key={t.value} type="button"
                          onClick={() => setEditSlotData(n => ({ ...n, type: t.value }))}
                          style={{ padding: '4px 10px', borderRadius: 999, border: `1px solid ${editSlotData.type === t.value ? t.color : 'var(--border-glass-default)'}`, background: editSlotData.type === t.value ? t.color + '20' : 'transparent', color: editSlotData.type === t.value ? t.color : 'var(--text-2)', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    <div className="form-group">
                      <label className="form-label">Ngày</label>
                      <select className="form-select" value={editSlotData.day} onChange={e => setEditSlotData(n => ({ ...n, day: +e.target.value }))}>
                        {DAYS_VN.map((d, i) => <option key={i} value={i}>{d}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Bắt đầu</label>
                      <select className="form-select" value={editSlotData.startHour} onChange={e => {
                        const val = +e.target.value;
                        setEditSlotData(n => ({
                          ...n,
                          startHour: val,
                          endHour: n.endHour <= val ? val + 1 : n.endHour
                        }));
                      }}>
                        {HOURS.map(h => <option key={h} value={h}>{h}:00</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Kết thúc</label>
                      <select className="form-select" value={editSlotData.endHour} onChange={e => setEditSlotData(n => ({ ...n, endHour: +e.target.value }))}>
                        {HOURS.filter(h => h > editSlotData.startHour).map(h => <option key={h} value={h}>{h}:00</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Địa điểm</label>
                    <input className="form-input" value={editSlotData.location} onChange={e => setEditSlotData(n => ({ ...n, location: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ghi chú</label>
                    <textarea className="form-textarea" value={editSlotData.notes} onChange={e => setEditSlotData(n => ({ ...n, notes: e.target.value }))} style={{ minHeight: 60 }} />
                  </div>
                  <div className="modal-footer" style={{ marginTop: 8 }}>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIsEditingSlot(false)}>Hủy</button>
                    <button type="submit" className="btn btn-primary btn-sm">Lưu cập nhật</button>
                  </div>
                </form>
              ) : (
                /* View Details Mode */
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-2)', fontSize: '0.84rem' }}>
                      <Clock size={14} style={{ color: 'var(--accent)' }} />
                      {DAYS_VN[selectedSlot.day]} · {selectedSlot.startHour}:00 – {selectedSlot.endHour}:00
                    </div>
                    {selectedSlot.location && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-2)', fontSize: '0.84rem' }}>
                        <MapPin size={14} style={{ color: 'var(--accent)' }} /> {selectedSlot.location}
                      </div>
                    )}
                    {selectedSlot.notes && (
                      <div style={{ padding: '8px 12px', background: 'var(--glass-thick)', border: '0.5px solid var(--border-glass-default)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--text-2)' }}>
                        {selectedSlot.notes}
                      </div>
                    )}
                  </div>
                  <div className="modal-footer" style={{ marginTop: 12 }}>
                    <div style={{ display: 'flex', gap: 6, width: '100%', justifyContent: 'flex-end' }}>
                      {selectedSlot.source === 'SCHEDULE' && (
                        <>
                          <button className="btn btn-danger btn-sm" onClick={() => { deleteSlot(selectedSlot.id); setSelectedSlot(null); }}>Xóa</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => handleStartEditSlot(selectedSlot)}>Chỉnh sửa</button>
                        </>
                      )}
                      {selectedSlot.source === 'EVENT_SESSION' && (
                        <button className="btn btn-danger btn-sm" onClick={() => { deleteEventSession(selectedSlot.id); setSelectedSlot(null); }}>Xóa</button>
                      )}
                      <button className="btn btn-primary btn-sm" onClick={() => setSelectedSlot(null)}>Đóng</button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Slot Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              className="modal-box"
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header">
                <div className="modal-title">Thêm lịch mới</div>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={15} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Tiêu đề *</label>
                  <input className="form-input" placeholder="VD: Tập Popping" value={newSlot.title} onChange={e => setNewSlot(n => ({ ...n, title: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Loại</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {SELECTABLE_SLOT_TYPES.map(t => (
                      <button key={t.value} type="button"
                        onClick={() => setNewSlot(n => ({ ...n, type: t.value }))}
                        style={{ padding: '5px 12px', borderRadius: 999, border: `1px solid ${newSlot.type === t.value ? t.color : 'var(--border-glass-default)'}`, background: newSlot.type === t.value ? t.color + '20' : 'transparent', color: newSlot.type === t.value ? t.color : 'var(--text-2)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <div className="form-group">
                    <label className="form-label">Ngày</label>
                    <select className="form-select" value={newSlot.day} onChange={e => setNewSlot(n => ({ ...n, day: +e.target.value }))}>
                      {DAYS_VN.map((d, i) => <option key={i} value={i}>{d}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bắt đầu</label>
                    <select className="form-select" value={newSlot.startHour} onChange={e => {
                      const val = +e.target.value;
                      setNewSlot(n => ({
                        ...n,
                        startHour: val,
                        endHour: n.endHour <= val ? val + 1 : n.endHour
                      }));
                    }}>
                      {HOURS.map(h => <option key={h} value={h}>{h}:00</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Kết thúc</label>
                    <select className="form-select" value={newSlot.endHour} onChange={e => setNewSlot(n => ({ ...n, endHour: +e.target.value }))}>
                      {HOURS.filter(h => h > newSlot.startHour).map(h => <option key={h} value={h}>{h}:00</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Địa điểm</label>
                  <input className="form-input" placeholder="VD: Phòng tập Tầng 2" value={newSlot.location} onChange={e => setNewSlot(n => ({ ...n, location: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Ghi chú</label>
                  <textarea className="form-textarea" placeholder="Ghi chú thêm..." value={newSlot.notes} onChange={e => setNewSlot(n => ({ ...n, notes: e.target.value }))} style={{ minHeight: 72 }} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>Hủy</button>
                <button className="btn btn-primary btn-sm" onClick={addSlot} disabled={!newSlot.title.trim()}>
                  <Plus size={13} /> Thêm lịch
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ──────────────────────────────────────────────
// Member Card-Flow View
// ──────────────────────────────────────────────
function MemberScheduleView() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [checkedIn, setCheckedIn]   = useState({});
  const [schedule, setSchedule]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const toast = useToast();

  // Fetch member's custom week schedule from API
  useEffect(() => {
    const targetDate = addWeeks(new Date(), weekOffset);
    const weekStr = format(targetDate, 'yyyy-MM-dd');

    setLoading(true);
    api.get(`/schedules/my-week?week=${weekStr}`)
      .then(r => {
        const data = r.data?.data || r.data;
        if (data && data.days) {
          const daysMap = data.days;
          const formattedDays = [];
          const weekStartVal = new Date(data.weekStart);

          // Loop 1 to 7 (Mon to Sun)
          for (let d = 1; d <= 7; d++) {
            const slots = daysMap[d] || [];
            if (slots.length > 0) {
              const date = addDays(weekStartVal, d - 1);
              const mappedSlots = slots.map(s => ({
                id: s.id,
                time: `${s.startTime.slice(0, 5)} – ${s.endTime.slice(0, 5)}`,
                title: s.title,
                location: s.location,
                type: s.type,
                required: s.type === 'PERFORMANCE' || s.type === 'MEETING',
                source: s.source,
                eventId: s.eventId,
                taskId: s.taskId,
                notes: s.notes
              }));

              formattedDays.push({
                date,
                dayLabel: isSameDay(date, new Date()) ? 'Hôm nay' : '',
                slots: mappedSlots
              });
            }
          }
          setSchedule(formattedDays);
        } else {
          setSchedule([]);
        }
      })
      .catch(() => {
        toast('Không thể tải lịch tập của bạn từ máy chủ', 'error');
        setSchedule([]);
      })
      .finally(() => setLoading(false));
  }, [weekOffset]);

  if (loading) {
    return <div className="loading-page"><div className="spinner" /><p>Đang tải lịch tập...</p></div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="schedule-header">
        <div className="schedule-week-nav">
          <button className="schedule-week-btn" onClick={() => setWeekOffset(w => w - 1)}><ChevronLeft size={16} /></button>
          <span className="schedule-week-label">
            {weekOffset === 0 ? 'Tuần này' : weekOffset > 0 ? `+${weekOffset} tuần` : `${weekOffset} tuần`}
          </span>
          <button className="schedule-week-btn" onClick={() => setWeekOffset(w => w + 1)}><ChevronRight size={16} /></button>
        </div>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-3)', letterSpacing: '-0.01em' }}>
          Lịch của bạn
        </div>
      </div>

      {/* Card flow */}
      {schedule.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📅</div>
          <div style={{ fontWeight: 500, color: 'var(--text-1)' }}>Không có lịch tập tuần này</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: 6 }}>Tuần nghỉ — nạp năng lượng nhé!</div>
        </div>
      ) : (
        schedule.map((day, di) => {
          const dayLabel = day.dayLabel || format(day.date, 'EEEE, dd/MM', { locale: vi });
          const isDayToday = isSameDay(day.date, new Date());
          return (
            <motion.div key={di} className="schedule-day-section"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: di * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
              <div className={`schedule-day-label ${isDayToday ? 'is-today' : ''}`}>
                {isDayToday && <span style={{ background: '#6366f1', color: '#fff', borderRadius: 999, padding: '1px 8px', fontSize: '0.6rem', marginRight: 8 }}>HÔM NAY</span>}
                {dayLabel}
              </div>
              {day.slots.map(slot => {
                const ti = getTypeInfo(slot.type);
                const isChecked = checkedIn[slot.id];
                return (
                  <div key={slot.id} className="schedule-event-card" onClick={() => setSelectedDetail(slot)} style={{ cursor: 'pointer' }}>
                    <div className="schedule-event-color-bar" style={{ background: ti.color, minHeight: 50 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: ti.color + '20', color: ti.color }}>
                          {ti.label}
                        </span>
                        {slot.source === 'EVENT_SESSION' && (
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
                            📅 Sự kiện
                          </span>
                        )}
                        {slot.source === 'TASK_DEADLINE' && (
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(244, 63, 94, 0.12)', color: '#f43f5e' }}>
                            📋 Hạn công việc
                          </span>
                        )}
                        {slot.required && <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(244,63,94,0.12)', color: '#f43f5e' }}>🔴 Bắt buộc</span>}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '1.05rem', letterSpacing: '-0.02em', color: 'var(--text-1)' }}>{slot.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, fontSize: '0.78rem', color: 'var(--text-2)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} />{slot.time}</span>
                        {slot.location && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} />{slot.location}</span>}
                      </div>
                    </div>
                    {isDayToday && slot.source !== 'TASK_DEADLINE' && (
                      <button
                        className="checkin-btn"
                        style={isChecked ? { background: 'linear-gradient(135deg,#34d399,#10b981)' } : {}}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCheckedIn(p => ({ ...p, [slot.id]: true }));
                        }}
                        disabled={isChecked}
                      >
                        {isChecked ? <><Check size={13} /> Đã check-in</> : 'Check-in'}
                      </button>
                    )}
                  </div>
                );
              })}
            </motion.div>
          );
        })
      )}

      {/* Member Slot Detail Modal */}
      <AnimatePresence>
        {selectedDetail && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedDetail(null)}
          >
            <motion.div
              className="modal-box"
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: 420 }}
            >
              <div className="modal-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: getTypeInfo(selectedDetail.type).color + '20', color: getTypeInfo(selectedDetail.type).color }}>
                      {getTypeInfo(selectedDetail.type).label}
                    </span>
                    {selectedDetail.source === 'EVENT_SESSION' && (
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                        📅 Lịch Sự kiện
                      </span>
                    )}
                    {selectedDetail.source === 'TASK_DEADLINE' && (
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e' }}>
                        📋 Hạn công việc
                      </span>
                    )}
                  </div>
                  <div className="modal-title">{selectedDetail.title}</div>
                </div>
                <button className="btn btn-ghost btn-icon" onClick={() => setSelectedDetail(null)}><X size={15} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-2)', fontSize: '0.84rem' }}>
                  <Clock size={14} style={{ color: 'var(--accent)' }} />
                  {selectedDetail.source === 'TASK_DEADLINE' ? 'Hạn nộp: ' : 'Thời gian: '} {selectedDetail.time}
                </div>
                {selectedDetail.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-2)', fontSize: '0.84rem' }}>
                    <MapPin size={14} style={{ color: 'var(--accent)' }} /> <strong>Địa điểm:</strong> {selectedDetail.location}
                  </div>
                )}
                {selectedDetail.notes && (
                  <div style={{ 
                    padding: '10px 14px', 
                    background: 'var(--glass-thick)', 
                    border: '0.5px solid var(--border-glass-default)', 
                    borderRadius: 8, 
                    fontSize: '0.8rem', 
                    color: 'var(--text-2)',
                    whiteSpace: 'pre-wrap'
                  }}>
                    <strong>Mô tả chi tiết:</strong>
                    <p style={{ margin: '4px 0 0 0', lineHeight: 1.4 }}>{selectedDetail.notes}</p>
                  </div>
                )}
              </div>

              <div className="modal-footer" style={{ marginTop: 16 }}>
                <button className="btn btn-primary btn-sm" onClick={() => setSelectedDetail(null)}>Đóng</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main export
// ──────────────────────────────────────────────
export default function Schedule() {
  const { user } = useAuth();
  const isManager = ['ADMIN', 'MANAGER'].includes(user?.role);
  const [activeTab, setActiveTab] = useState('manage'); // 'manage' or 'personal'

  return (
    <div>
      <div className="page-header" style={{ marginBottom: isManager ? 14 : 24 }}>
        <h1>⏰ Thời khóa biểu</h1>
        <p>{isManager ? 'Quản lý lịch tập và theo dõi lịch cá nhân của bạn' : 'Lịch tập tuần này của đội bạn'}</p>
      </div>

      {isManager && (
        <div style={{
          display: 'flex',
          gap: 12,
          marginBottom: 20,
          borderBottom: '1px solid var(--border-glass-subtle)',
          paddingBottom: 8
        }}>
          <button
            onClick={() => setActiveTab('manage')}
            style={{
              padding: '6px 16px',
              borderRadius: 8,
              background: activeTab === 'manage' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'manage' ? '#fff' : 'var(--text-2)',
              border: activeTab === 'manage' ? 'none' : '1px solid var(--border-glass-default)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Quản lý lịch Ban/CLB
          </button>
          <button
            onClick={() => setActiveTab('personal')}
            style={{
              padding: '6px 16px',
              borderRadius: 8,
              background: activeTab === 'personal' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'personal' ? '#fff' : 'var(--text-2)',
              border: activeTab === 'personal' ? 'none' : '1px solid var(--border-glass-default)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Xem Lịch cá nhân (Đồng bộ Sự kiện & Tasks)
          </button>
        </div>
      )}

      {isManager ? (
        activeTab === 'manage' ? <AdminScheduleView user={user} /> : <MemberScheduleView />
      ) : (
        <MemberScheduleView />
      )}
    </div>
  );
}

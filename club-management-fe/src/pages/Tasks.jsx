import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api';
import { Plus, X, Clock, Flag, ThumbsUp, ThumbsDown, Trash2 } from 'lucide-react';

const COLS = [
  { key: 'TODO', label: 'Cần làm', color: 'blue' },
  { key: 'IN_PROGRESS', label: 'Đang làm', color: 'purple' },
  { key: 'REVIEW', label: 'Chờ duyệt', color: 'yellow' },
  { key: 'DONE', label: 'Hoàn thành', color: 'green' },
  { key: 'REJECTED', label: 'Bị từ chối', color: 'red' },
];

const PRIORITY_BADGE = { HIGH: 'red', MEDIUM: 'purple', LOW: 'blue' };

function getInitials(name) {
  return name?.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase() || '?';
}

export default function Tasks() {
  const { isManager, user } = useAuth();
  const toast = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);
  
  // Modals state
  const [showCreate, setShowCreate] = useState(false);
  const [showReject, setShowReject] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isEditingTask, setIsEditingTask] = useState(false);

  const [events, setEvents] = useState([]);
  const [rejectReason, setRejectReason] = useState('');
  const [members, setMembers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);
  
  // Form states
  const [newTask, setNewTask] = useState({
    title: '', description: '', deadline: '', priority: 'MEDIUM', eventId: '', assigneeIds: [], departmentId: '', teamId: ''
  });
  const [editTaskData, setEditTaskData] = useState({
    title: '', description: '', deadline: '', priority: 'MEDIUM', eventId: '', assigneeIds: [], departmentId: '', teamId: ''
  });
  
  const [newSubTaskTitle, setNewSubTaskTitle] = useState('');
  const [newCommentContent, setNewCommentContent] = useState('');

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [eventFilter, setEventFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');

  // Load initial tasks & events
  const loadTasks = () => {
    const endpoint = isManager() ? '/tasks' : '/tasks/my-tasks';
    api.get(endpoint)
      .then(r => {
        const data = r.data?.data || r.data;
        setTasks(Array.isArray(data) ? data : []);
      })
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  };

  const loadDepartments = () => {
    api.get('/departments')
      .then(r => {
        const rawData = r.data?.data || r.data;
        setDepartments(Array.isArray(rawData) ? rawData : []);
      })
      .catch(() => setDepartments([]));
  };

  const loadTeams = () => {
    api.get('/teams')
      .then(r => {
        const rawData = r.data?.data || r.data;
        setTeams(Array.isArray(rawData) ? rawData : []);
      })
      .catch(() => setTeams([]));
  };

  useEffect(() => {
    loadTasks();
    loadDepartments();
    loadTeams();

    api.get('/events')
      .then(r => {
        const data = r.data?.data || r.data;
        let eventList = Array.isArray(data) ? data : [];
        if (user?.role !== 'ADMIN' && user?.departmentId) {
          eventList = eventList.filter(ev => ev.departmentId === user.departmentId);
        }
        setEvents(eventList);
      })
      .catch(() => setEvents([]));
  }, []);

  // Load assignable members (Admin sees everyone, Manager sees department)
  useEffect(() => {
    if (user?.role === 'ADMIN' || !user?.departmentId) {
      api.get('/users')
        .then(r => {
          const data = r.data?.data || r.data;
          setMembers(Array.isArray(data) ? data : []);
        })
        .catch(() => setMembers([]));
    } else if (user?.departmentId) {
      api.get(`/departments/${user.departmentId}/members`)
        .then(r => {
          const data = r.data?.data || r.data;
          setMembers(Array.isArray(data) ? data : []);
        })
        .catch(() => setMembers([]));
    } else {
      setMembers([]);
    }
  }, [user]);

  // Synchronize selectedTask details if tasks list updates
  useEffect(() => {
    if (selectedTask) {
      const fresh = tasks.find(t => t.id === selectedTask.id);
      if (fresh) {
        setSelectedTask(fresh);
      }
    }
  }, [tasks]);

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = !searchQuery || 
      t.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPriority = !priorityFilter || t.priority === priorityFilter;
    
    const matchesEvent = !eventFilter || t.eventId === Number(eventFilter);
    
    const matchesAssignee = !assigneeFilter || t.assignees?.some(a => a.id === Number(assigneeFilter));
    
    return matchesSearch && matchesPriority && matchesEvent && matchesAssignee;
  });

  const tasksByStatus = (status) => filteredTasks.filter(t => t.status === status);

  // Drag & Drop
  const onDragStart = (e, id) => { setDragId(id); e.dataTransfer.effectAllowed = 'move'; };
  const onDragOver = (e, colKey) => { e.preventDefault(); setOverCol(colKey); };
  
  const onDrop = async (e, newStatus) => {
    e.preventDefault();
    if (!dragId) return;
    const task = tasks.find(t => t.id === dragId);
    if (!task || task.status === newStatus) { setDragId(null); setOverCol(null); return; }

    // Validate allowed transitions
    const allowedByMember = { TODO: ['IN_PROGRESS'], IN_PROGRESS: ['REVIEW'], REJECTED: ['IN_PROGRESS'] };
    
    // Admin/Manager can drag tasks anywhere!
    let allowed = [];
    if (isManager()) {
      allowed = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'REJECTED'];
    } else {
      allowed = allowedByMember[task.status] || [];
    }

    if (!allowed.includes(newStatus)) {
      toast(`Không thể chuyển từ ${task.status} sang ${newStatus}`, 'error');
      setDragId(null); setOverCol(null); return;
    }

    if (newStatus === 'DONE' && task.status !== 'REVIEW') {
      toast('Chỉ có thể duyệt (DONE) task đang ở trạng thái REVIEW', 'error');
      setDragId(null); setOverCol(null); return;
    }

    if (newStatus === 'REJECTED') { 
      if (task.status !== 'REVIEW') {
        toast('Chỉ có thể từ chối task đang ở trạng thái REVIEW', 'error');
        setDragId(null); setOverCol(null); return;
      }
      setShowReject(dragId); setDragId(null); setOverCol(null); return; 
    }

    try {
      const endpoint = newStatus === 'DONE' ? `/tasks/${dragId}/approve` : `/tasks/${dragId}/status`;
      const body = newStatus === 'DONE' ? {} : { status: newStatus };
      await api.put(endpoint, body);
      setTasks(p => p.map(t => t.id === dragId ? { ...t, status: newStatus } : t));
      if (newStatus === 'DONE') {
        toast('Task được duyệt! +20 XP cho thành viên 🎉', 'success');
        loadTasks(); // Reload to fetch updated XP and states
      } else {
        toast('Cập nhật trạng thái thành công', 'success');
      }
    } catch (err) {
      toast(err.response?.data?.message || 'Lỗi cập nhật trạng thái', 'error');
    }
    setDragId(null); setOverCol(null);
  };

  const handleReject = async () => {
    if (!rejectReason) { toast('Vui lòng nhập lý do từ chối', 'error'); return; }
    try {
      await api.put(`/tasks/${showReject}/reject`, { rejectReason });
      setTasks(p => p.map(t => t.id === showReject ? { ...t, status: 'REJECTED', rejectReason } : t));
      toast('Task đã bị từ chối', 'info');
      setShowReject(null); setRejectReason('');
      loadTasks();
    } catch (err) {
      toast(err.response?.data?.message || 'Lỗi từ chối công việc', 'error');
    }
  };

  const createTask = async () => {
    if (!newTask.title || !newTask.eventId) { toast('Điền tên task và chọn sự kiện', 'error'); return; }
    if (newTask.assigneeIds.length === 0 && !newTask.departmentId && !newTask.teamId) {
      toast('Vui lòng chọn ít nhất 1 thành viên, phân ban, hoặc đội tuyển', 'error');
      return;
    }
    if (!newTask.deadline) { toast('Vui lòng chọn hạn hoàn thành', 'error'); return; }
    try {
      const payload = {
        ...newTask,
        eventId: parseInt(newTask.eventId),
        assigneeIds: newTask.assigneeIds,
        departmentId: newTask.departmentId ? parseInt(newTask.departmentId) : null,
        teamId: newTask.teamId ? parseInt(newTask.teamId) : null,
      };
      const r = await api.post('/tasks', payload);
      setTasks(p => [...p, r.data?.data || r.data]);
      setShowCreate(false);
      setNewTask({ title: '', description: '', deadline: '', priority: 'MEDIUM', eventId: '', assigneeIds: [], departmentId: '', teamId: '' });
      toast('Tạo công việc thành công! 📋', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Lỗi khi tạo công việc', 'error');
    }
  };

  // Subtask Handlers
  const handleToggleSubTask = async (subTaskId) => {
    if (!selectedTask) return;
    try {
      const res = await api.put(`/tasks/${selectedTask.id}/subtasks/${subTaskId}/toggle`);
      const updatedTask = res.data?.data || res.data;
      setTasks(prev => prev.map(t => t.id === selectedTask.id ? updatedTask : t));
      toast('Đã cập nhật công việc con', 'success');
    } catch (err) {
      toast('Lỗi khi cập nhật công việc con', 'error');
    }
  };

  const handleAddSubTask = async (e) => {
    e.preventDefault();
    if (!newSubTaskTitle.trim() || !selectedTask) return;
    try {
      const res = await api.post(`/tasks/${selectedTask.id}/subtasks`, { title: newSubTaskTitle.trim() });
      const updatedTask = res.data?.data || res.data;
      setTasks(prev => prev.map(t => t.id === selectedTask.id ? updatedTask : t));
      setNewSubTaskTitle('');
      toast('Đã thêm việc con mới', 'success');
    } catch (err) {
      toast('Lỗi khi thêm việc con', 'error');
    }
  };

  // Comments Handlers
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentContent.trim() || !selectedTask) return;
    try {
      const res = await api.post(`/tasks/${selectedTask.id}/comments`, { content: newCommentContent.trim() });
      const updatedTask = res.data?.data || res.data;
      setTasks(prev => prev.map(t => t.id === selectedTask.id ? updatedTask : t));
      setNewCommentContent('');
      toast('Đã gửi bình luận! +2 XP 💬', 'success');
    } catch (err) {
      toast('Lỗi khi gửi bình luận', 'error');
    }
  };

  // Edit/Delete Task Handlers
  const handleStartEdit = () => {
    setEditTaskData({
      title: selectedTask.title,
      description: selectedTask.description || '',
      deadline: selectedTask.deadline ? selectedTask.deadline.substring(0, 16) : '',
      priority: selectedTask.priority,
      eventId: selectedTask.eventId.toString(),
      assigneeIds: selectedTask.assignees.map(a => a.id),
      departmentId: selectedTask.departmentId ? selectedTask.departmentId.toString() : '',
      teamId: selectedTask.teamId ? selectedTask.teamId.toString() : ''
    });
    setIsEditingTask(true);
  };

  const handleUpdateTaskInfo = async (e) => {
    e.preventDefault();
    if (!editTaskData.title || !editTaskData.eventId) { toast('Điền tên task và chọn sự kiện', 'error'); return; }
    if (editTaskData.assigneeIds.length === 0 && !editTaskData.departmentId && !editTaskData.teamId) {
      toast('Chọn ít nhất 1 thành viên, phân ban, hoặc đội tuyển', 'error');
      return;
    }
    if (!editTaskData.deadline) { toast('Vui lòng chọn hạn hoàn thành', 'error'); return; }
    try {
      const payload = {
        ...editTaskData,
        eventId: parseInt(editTaskData.eventId),
        assigneeIds: editTaskData.assigneeIds,
        departmentId: editTaskData.departmentId ? parseInt(editTaskData.departmentId) : null,
        teamId: editTaskData.teamId ? parseInt(editTaskData.teamId) : null,
      };
      const res = await api.put(`/tasks/${selectedTask.id}`, payload);
      const updatedTask = res.data?.data || res.data;
      setTasks(prev => prev.map(t => t.id === selectedTask.id ? updatedTask : t));
      setIsEditingTask(false);
      toast('Cập nhật công việc thành công', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Lỗi khi cập nhật công việc', 'error');
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa công việc này không?')) return;
    try {
      await api.delete(`/tasks/${selectedTask.id}`);
      setTasks(prev => prev.filter(t => t.id !== selectedTask.id));
      setSelectedTask(null);
      toast('Đã xóa công việc thành công', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Lỗi khi xóa công việc', 'error');
    }
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1>Quản lý Công việc</h1>
          <p>Kéo thả thẻ công việc giữa các cột để cập nhật tiến độ, click vào thẻ để xem chi tiết</p>
        </div>
        {isManager() && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Tạo công việc
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="card mb-3" style={{ display: 'flex', gap: 16, padding: '16px 20px', flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label className="form-label" style={{ marginBottom: 4, display: 'block', fontSize: '0.78rem' }}>Tìm kiếm công việc</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Tìm theo tiêu đề, mô tả..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
          />
        </div>
        <div style={{ width: 140 }}>
          <label className="form-label" style={{ marginBottom: 4, display: 'block', fontSize: '0.78rem' }}>Độ ưu tiên</label>
          <select 
            className="form-select" 
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
          >
            <option value="">Tất cả</option>
            <option value="LOW">Thấp (LOW)</option>
            <option value="MEDIUM">Trung bình (MEDIUM)</option>
            <option value="HIGH">Cao (HIGH)</option>
          </select>
        </div>
        <div style={{ width: 180 }}>
          <label className="form-label" style={{ marginBottom: 4, display: 'block', fontSize: '0.78rem' }}>Sự kiện</label>
          <select 
            className="form-select" 
            value={eventFilter}
            onChange={e => setEventFilter(e.target.value)}
            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
          >
            <option value="">Tất cả sự kiện</option>
            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
          </select>
        </div>
        <div style={{ width: 180 }}>
          <label className="form-label" style={{ marginBottom: 4, display: 'block', fontSize: '0.78rem' }}>Thành viên</label>
          <select 
            className="form-select" 
            value={assigneeFilter}
            onChange={e => setAssigneeFilter(e.target.value)}
            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
          >
            <option value="">Tất cả thành viên</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.fullName || m.name}</option>)}
          </select>
        </div>
      </div>

      {/* Kanban board */}
      <div className="kanban-board">
        {COLS.map(col => (
          <div
            key={col.key}
            className={`kanban-col${overCol === col.key ? ' drag-over' : ''}`}
            onDragOver={e => onDragOver(e, col.key)}
            onDrop={e => onDrop(e, col.key)}
            onDragLeave={() => setOverCol(null)}
          >
            <div className="kanban-col-header">
              <span className={`kanban-col-title text-${col.color}`}>{col.label}</span>
              <span className="kanban-col-count">{tasksByStatus(col.key).length}</span>
            </div>
            <div className="kanban-cards">
              {tasksByStatus(col.key).map(task => (
                <div
                  key={task.id}
                  className={`task-card${dragId === task.id ? ' dragging' : ''}`}
                  style={{ borderLeft: `3px solid var(--neon-${PRIORITY_BADGE[task.priority] || 'blue'})`, cursor: 'pointer' }}
                  draggable
                  onDragStart={e => onDragStart(e, task.id)}
                  onDragEnd={() => { setDragId(null); setOverCol(null); }}
                  onClick={() => { setSelectedTask(task); setIsEditingTask(false); }}
                >
                  <div style={{ fontSize: '0.65rem', color: 'var(--accent-light)', marginBottom: 4, fontWeight: 600 }}>
                    🎪 {task.eventTitle}
                  </div>
                  <div className="task-card-title" style={{ fontWeight: 600 }}>{task.title}</div>
                  {task.description && (
                    <p className="text-xs text-muted" style={{ marginBottom: 8, color: 'var(--text-2)' }}>
                      {task.description.slice(0, 60)}{task.description.length > 60 ? '...' : ''}
                    </p>
                  )}
                  <div className="task-card-meta" style={{ flexWrap: 'wrap' }}>
                    <span className={`badge badge-${PRIORITY_BADGE[task.priority] || 'grey'}`} style={{ display: 'inline-flex', gap: 3, fontSize: '0.65rem' }}>
                      <Flag size={8} /> {task.priority}
                    </span>
                    {task.deadline && (
                      <span className="badge badge-grey" style={{ display: 'inline-flex', gap: 3, fontSize: '0.65rem' }}>
                        <Clock size={8} /> {new Date(task.deadline).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                    {task.departmentName && (
                      <span className="badge badge-purple" style={{ display: 'inline-flex', gap: 3, fontSize: '0.65rem' }}>
                        🏢 {task.departmentName}
                      </span>
                    )}
                    {task.teamName && (
                      <span className="badge badge-blue" style={{ display: 'inline-flex', gap: 3, fontSize: '0.65rem' }}>
                        👥 {task.teamName}
                      </span>
                    )}
                  </div>
                  {task.rejectReason && (
                    <div className="text-xs text-red mt-1" style={{ marginTop: 6, padding: '4px 8px', background: 'rgba(248,113,113,0.08)', borderRadius: 6 }}>
                      ⚠️ {task.rejectReason}
                    </div>
                  )}
                  
                  {/* Manager approve/reject inline buttons for REVIEW tasks */}
                  {isManager() && col.key === 'REVIEW' && (
                    <div className="flex gap-2" style={{ marginTop: 10, display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
                      <button className="btn btn-success btn-sm" style={{ flex: 1, justifyContent: 'center', padding: '4px 8px', fontSize: '0.72rem' }}
                        onClick={async () => {
                          try {
                            await api.put(`/tasks/${task.id}/approve`);
                            setTasks(p => p.map(t => t.id === task.id ? { ...t, status: 'DONE' } : t));
                            toast('Task được duyệt! +20 XP 🎉', 'success');
                            loadTasks();
                          } catch { toast('Lỗi duyệt task', 'error'); }
                        }}>
                        <ThumbsUp size={10} /> Duyệt
                      </button>
                      <button className="btn btn-danger btn-sm" style={{ flex: 1, justifyContent: 'center', padding: '4px 8px', fontSize: '0.72rem' }}
                        onClick={() => { setShowReject(task.id); setRejectReason(''); }}>
                        <ThumbsDown size={10} /> Từ chối
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {tasksByStatus(col.key).length === 0 && (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: '0.75rem', border: '1px dashed var(--border)', borderRadius: 8 }}>
                  Kéo task vào đây
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Reject Modal */}
      {showReject && createPortal(
        <div className="modal-overlay" onClick={() => setShowReject(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <span className="modal-title" style={{ color: 'var(--danger)' }}>Từ chối Công việc</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowReject(null)}><X size={15} /></button>
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label className="form-label">Lý do từ chối *</label>
              <textarea className="form-textarea" placeholder="Mô tả rõ những điểm cần chỉnh sửa lại..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} style={{ minHeight: 80 }} />
            </div>
            <div className="modal-footer" style={{ marginTop: 12 }}>
              <button className="btn btn-ghost" onClick={() => setShowReject(null)}>Hủy</button>
              <button className="btn btn-danger" onClick={handleReject} style={{ display: 'flex', gap: 6, alignItems: 'center' }}><ThumbsDown size={14} /> Xác nhận từ chối</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Create Task Modal */}
      {showCreate && createPortal(
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <span className="modal-title">Tạo Công việc mới</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowCreate(false)}><X size={15} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Tên công việc *</label>
                <input className="form-input" placeholder="VD: Thiết kế poster quảng cáo..." value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Sự kiện *</label>
                <select className="form-select" value={newTask.eventId} onChange={e => setNewTask(p => ({ ...p, eventId: e.target.value }))}>
                  <option value="">Chọn sự kiện...</option>
                  {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Mức ưu tiên</label>
                  <select className="form-select" value={newTask.priority} onChange={e => setNewTask(p => ({ ...p, priority: e.target.value }))}>
                    <option value="LOW">Thấp (LOW)</option>
                    <option value="MEDIUM">Trung bình (MEDIUM)</option>
                    <option value="HIGH">Cao (HIGH)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Hạn hoàn thành</label>
                  <input className="form-input" type="datetime-local" value={newTask.deadline} onChange={e => setNewTask(p => ({ ...p, deadline: e.target.value }))} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Giao cho Phân ban</label>
                  <select
                    className="form-select"
                    value={newTask.departmentId}
                    onChange={e => {
                      const deptId = e.target.value;
                      setNewTask(p => ({
                        ...p,
                        departmentId: deptId,
                        teamId: '',
                        assigneeIds: []
                      }));
                    }}
                  >
                    <option value="">Không giao cho ban nào</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Giao cho Đội tuyển</label>
                  <select
                    className="form-select"
                    value={newTask.teamId}
                    onChange={e => setNewTask(p => ({ ...p, teamId: e.target.value }))}
                  >
                    <option value="">Không giao cho đội nào</option>
                    {teams
                      .filter(t => !newTask.departmentId || t.department?.id === Number(newTask.departmentId))
                      .map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Custom checklist dropdown for assignees */}
              <div className="form-group">
                <label className="form-label">Giao việc cho thành viên</label>
                <div style={{
                  maxHeight: 120,
                  overflowY: 'auto',
                  background: 'var(--glass-thick)',
                  border: '0.5px solid var(--border-glass-default)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}>
                  {members
                    .filter(m => {
                      const deptId = m.department?.id || m.departmentId;
                      return !newTask.departmentId || Number(deptId) === Number(newTask.departmentId);
                    })
                    .map(m => {
                      const isSelected = newTask.assigneeIds.includes(m.id);
                    return (
                      <div
                        key={m.id}
                        onClick={() => {
                          if (isSelected) {
                            setNewTask(p => ({ ...p, assigneeIds: p.assigneeIds.filter(id => id !== m.id) }));
                          } else {
                            setNewTask(p => ({ ...p, assigneeIds: [...p.assigneeIds, m.id] }));
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          cursor: 'pointer',
                          padding: '4px 6px',
                          borderRadius: 4,
                          background: isSelected ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                          transition: 'background 0.15s'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          style={{ cursor: 'pointer', accentColor: 'var(--accent)' }}
                        />
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-1)' }}>
                          {m.fullName} <span style={{ color: 'var(--text-3)', fontSize: '0.7rem' }}>({m.email})</span>
                        </span>
                      </div>
                    );
                  })}
                  {members.length === 0 && (
                    <div style={{ padding: '8px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: '0.78rem' }}>
                      Không tìm thấy thành viên nào
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Mô tả</label>
                <textarea className="form-textarea" placeholder="Chi tiết về yêu cầu công việc..." value={newTask.description} onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))} style={{ minHeight: 60 }} />
              </div>
            </div>
            <div className="modal-footer" style={{ marginTop: 16 }}>
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={createTask}><Plus size={16} /> Tạo công việc</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Task Details Modal ── */}
      {selectedTask && createPortal(
        <div className="modal-overlay" onClick={() => { if (!isEditingTask) setSelectedTask(null); }}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 550, width: '90%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: 0 }}>
            {/* Header */}
            <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-glass-subtle)' }}>
              <span className="modal-title" style={{ fontSize: '1rem', fontWeight: 600 }}>Chi tiết Công việc</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setSelectedTask(null)}><X size={15} /></button>
            </div>

            {/* Content Area */}
            <div style={{ padding: 20, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {isEditingTask ? (
                /* Edit Form */
                <form onSubmit={handleUpdateTaskInfo} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Tên công việc *</label>
                    <input className="form-input" value={editTaskData.title} onChange={e => setEditTaskData(p => ({ ...p, title: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sự kiện *</label>
                    <select className="form-select" value={editTaskData.eventId} onChange={e => setEditTaskData(p => ({ ...p, eventId: e.target.value }))}>
                      {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label">Mức ưu tiên</label>
                      <select className="form-select" value={editTaskData.priority} onChange={e => setEditTaskData(p => ({ ...p, priority: e.target.value }))}>
                        <option value="LOW">Thấp (LOW)</option>
                        <option value="MEDIUM">Trung bình (MEDIUM)</option>
                        <option value="HIGH">Cao (HIGH)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Hạn hoàn thành</label>
                      <input className="form-input" type="datetime-local" value={editTaskData.deadline} onChange={e => setEditTaskData(p => ({ ...p, deadline: e.target.value }))} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label">Giao cho Phân ban</label>
                      <select
                        className="form-select"
                        value={editTaskData.departmentId}
                        onChange={e => {
                          const deptId = e.target.value;
                          setEditTaskData(p => ({
                            ...p,
                            departmentId: deptId,
                            teamId: '',
                            assigneeIds: []
                          }));
                        }}
                      >
                        <option value="">Không giao cho ban nào</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Giao cho Đội tuyển</label>
                      <select
                        className="form-select"
                        value={editTaskData.teamId}
                        onChange={e => setEditTaskData(p => ({ ...p, teamId: e.target.value }))}
                      >
                        <option value="">Không giao cho đội nào</option>
                        {teams
                          .filter(t => !editTaskData.departmentId || t.department?.id === Number(editTaskData.departmentId))
                          .map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {/* Custom Checklist Dropdown for Edit Assignees */}
                  <div className="form-group">
                    <label className="form-label">Giao việc cho thành viên</label>
                    <div style={{
                      maxHeight: 120,
                      overflowY: 'auto',
                      background: 'var(--glass-thick)',
                      border: '0.5px solid var(--border-glass-default)',
                      borderRadius: 8,
                      padding: '8px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6
                    }}>
                      {members
                        .filter(m => {
                          const deptId = m.department?.id || m.departmentId;
                          return !editTaskData.departmentId || Number(deptId) === Number(editTaskData.departmentId);
                        })
                        .map(m => {
                          const isSelected = editTaskData.assigneeIds.includes(m.id);
                        return (
                          <div
                            key={m.id}
                            onClick={() => {
                              if (isSelected) {
                                setEditTaskData(p => ({ ...p, assigneeIds: p.assigneeIds.filter(id => id !== m.id) }));
                              } else {
                                setEditTaskData(p => ({ ...p, assigneeIds: [...p.assigneeIds, m.id] }));
                              }
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              cursor: 'pointer',
                              padding: '4px 6px',
                              borderRadius: 4,
                              background: isSelected ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                              transition: 'background 0.15s'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              style={{ cursor: 'pointer', accentColor: 'var(--accent)' }}
                            />
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-1)' }}>
                              {m.fullName} <span style={{ color: 'var(--text-3)', fontSize: '0.7rem' }}>({m.email})</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mô tả</label>
                    <textarea className="form-textarea" value={editTaskData.description} onChange={e => setEditTaskData(p => ({ ...p, description: e.target.value }))} style={{ minHeight: 60 }} />
                  </div>
                  <div className="modal-footer" style={{ marginTop: 8 }}>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIsEditingTask(false)}>Hủy</button>
                    <button type="submit" className="btn btn-primary btn-sm">Lưu thay đổi</button>
                  </div>
                </form>
              ) : (
                /* View Details Mode */
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <h2 style={{ fontSize: '1.05rem', margin: '0 0 4px 0', color: 'var(--text-1)', fontWeight: 600 }}>{selectedTask.title}</h2>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
                        Liên kết sự kiện: <strong style={{ color: 'var(--accent-light)' }}>{selectedTask.eventTitle}</strong>
                      </div>
                    </div>
                    {isManager() && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={handleStartEdit}>Chỉnh sửa</button>
                        <button className="btn btn-danger btn-sm" onClick={handleDeleteTask} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          <Trash2 size={11} /> Xóa
                        </button>
                      </div>
                    )}
                  </div>

                  {selectedTask.description && (
                    <div style={{ padding: '10px 14px', background: 'var(--glass-thick)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--text-2)', border: '0.5px solid var(--border-glass-default)', whiteSpace: 'pre-wrap' }}>
                      {selectedTask.description}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
                    <div style={{ background: 'var(--glass-ultra)', padding: '10px 12px', borderRadius: 8, border: '0.5px solid var(--border-glass-subtle)' }}>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-3)', display: 'block', textTransform: 'uppercase', marginBottom: 2 }}>Độ ưu tiên</span>
                      <span className={`badge badge-${PRIORITY_BADGE[selectedTask.priority]}`} style={{ display: 'inline-flex', gap: 4, fontSize: '0.75rem' }}>
                        <Flag size={10} /> {selectedTask.priority}
                      </span>
                    </div>
                    <div style={{ background: 'var(--glass-ultra)', padding: '10px 12px', borderRadius: 8, border: '0.5px solid var(--border-glass-subtle)' }}>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-3)', display: 'block', textTransform: 'uppercase', marginBottom: 2 }}>Hạn chót</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-2)', display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                        <Clock size={11} /> {selectedTask.deadline ? new Date(selectedTask.deadline).toLocaleString('vi-VN') : 'Không có'}
                      </span>
                    </div>
                    <div style={{ background: 'var(--glass-ultra)', padding: '10px 12px', borderRadius: 8, border: '0.5px solid var(--border-glass-subtle)' }}>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-3)', display: 'block', textTransform: 'uppercase', marginBottom: 2 }}>Trạng thái</span>
                      <span className="badge badge-grey" style={{ fontSize: '0.75rem' }}>{selectedTask.status}</span>
                    </div>
                  </div>

                  {/* Department & Team assignment */}
                  {(selectedTask.departmentName || selectedTask.teamName) && (
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Đối tượng được giao</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {selectedTask.departmentName && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--glass-thick)', padding: '4px 12px', borderRadius: 20, border: '0.5px solid var(--border-glass-default)' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-1)' }}>🏢 Phân ban: <strong>{selectedTask.departmentName}</strong></span>
                          </div>
                        )}
                        {selectedTask.teamName && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--glass-thick)', padding: '4px 12px', borderRadius: 20, border: '0.5px solid var(--border-glass-default)' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-1)' }}>👥 Đội tuyển: <strong>{selectedTask.teamName}</strong></span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Assignees List */}
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Người thực hiện</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {selectedTask.assignees.map(a => (
                        <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--glass-thick)', padding: '4px 10px', borderRadius: 20, border: '0.5px solid var(--border-glass-default)' }}>
                          <div className="chat-avatar-sm" style={{ width: 18, height: 18, fontSize: '0.55rem', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                            {getInitials(a.fullName)}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-1)' }}>{a.fullName}</span>
                        </div>
                      ))}
                      {selectedTask.assignees.length === 0 && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', fontStyle: 'italic' }}>Chưa giao cho cá nhân cụ thể</div>
                      )}
                    </div>
                  </div>

                  {/* Subtasks Section */}
                  <div style={{ borderTop: '0.5px solid var(--border-glass-subtle)', paddingTop: 16 }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Công việc con (Subtasks)</span>
                    
                    {/* Add Subtask Form */}
                    <form onSubmit={handleAddSubTask} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                      <input
                        placeholder="Thêm công việc con mới..."
                        value={newSubTaskTitle}
                        onChange={e => setNewSubTaskTitle(e.target.value)}
                        style={{ flex: 1, padding: '6px 12px', background: 'var(--glass-thick)', border: '0.5px solid var(--border-glass-default)', borderRadius: 6, fontSize: '0.78rem', color: 'var(--text-1)', outline: 'none' }}
                      />
                      <button type="submit" className="btn btn-primary btn-sm" disabled={!newSubTaskTitle.trim()}>Thêm</button>
                    </form>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 130, overflowY: 'auto' }}>
                      {selectedTask.subTasks?.map(st => (
                        <div
                          key={st.id}
                          onClick={() => handleToggleSubTask(st.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: 'var(--glass-regular)', border: '0.5px solid var(--border-glass-default)', borderRadius: 6, cursor: 'pointer' }}
                        >
                          <input type="checkbox" checked={st.completed} readOnly style={{ cursor: 'pointer', accentColor: 'var(--accent)' }} />
                          <span style={{ textDecoration: st.completed ? 'line-through' : 'none', color: st.completed ? 'var(--text-3)' : 'var(--text-1)', fontSize: '0.78rem' }}>{st.title}</span>
                        </div>
                      ))}
                      {(!selectedTask.subTasks || selectedTask.subTasks.length === 0) && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', fontStyle: 'italic' }}>Chưa có công việc con nào</div>
                      )}
                    </div>
                  </div>

                  {/* Comments Section */}
                  <div style={{ borderTop: '0.5px solid var(--border-glass-subtle)', paddingTop: 16 }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Thảo luận & Trao đổi (Comments)</span>
                    
                    {/* Add Comment Form */}
                    <form onSubmit={handleAddComment} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                      <input
                        placeholder="Nhập nội dung trao đổi..."
                        value={newCommentContent}
                        onChange={e => setNewCommentContent(e.target.value)}
                        style={{ flex: 1, padding: '6px 12px', background: 'var(--glass-thick)', border: '0.5px solid var(--border-glass-default)', borderRadius: 6, fontSize: '0.78rem', color: 'var(--text-1)', outline: 'none' }}
                      />
                      <button type="submit" className="btn btn-primary btn-sm" disabled={!newCommentContent.trim()}>Gửi</button>
                    </form>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 150, overflowY: 'auto' }}>
                      {selectedTask.comments?.map(c => (
                        <div key={c.id} style={{ display: 'flex', gap: 10, padding: '8px 12px', background: 'var(--glass-regular)', border: '0.5px solid var(--border-glass-default)', borderRadius: 8 }}>
                          <div className="chat-avatar-sm" style={{ width: 24, height: 24, fontSize: '0.65rem', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                            {getInitials(c.userName)}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                              <span style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-1)' }}>{c.userName}</span>
                              <span style={{ fontSize: '0.62rem', color: 'var(--text-3)' }}>{new Date(c.createdAt).toLocaleString('vi-VN')}</span>
                            </div>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-2)', margin: 0 }}>{c.content}</p>
                          </div>
                        </div>
                      ))}
                      {(!selectedTask.comments || selectedTask.comments.length === 0) && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', fontStyle: 'italic' }}>Chưa có thảo luận nào</div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

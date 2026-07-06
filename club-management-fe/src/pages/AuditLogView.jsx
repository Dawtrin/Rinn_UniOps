import { useState, useEffect } from 'react';
import api from '../api';
import { useToast } from '../context/ToastContext';
import { Clock, Search, RefreshCw, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

export default function AuditLogView() {
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  // Local filters
  const [searchUser, setSearchUser] = useState('');
  const [searchAction, setSearchAction] = useState('');
  const [searchEntity, setSearchEntity] = useState('');

  const fetchLogs = () => {
    setLoading(true);
    api.get(`/admin/audit-logs?page=${page}&size=${size}`)
      .then(res => {
        const pageData = res.data?.data || res.data;
        if (pageData) {
          setLogs(pageData.content || []);
          setTotalPages(pageData.totalPages || 0);
          setTotalElements(pageData.totalElements || 0);
        } else {
          setLogs([]);
        }
      })
      .catch(err => {
        toast('Không thể tải nhật ký hoạt động', 'error');
        console.error(err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [page, size]);

  const handleRefresh = () => {
    if (page === 0) {
      fetchLogs();
    } else {
      setPage(0);
    }
  };

  // Client-side filter applied to current page data for finer filtering
  const filteredLogs = logs.filter(log => {
    const matchesUser = (log.username || '').toLowerCase().includes(searchUser.toLowerCase());
    const matchesAction = (log.action || '').toLowerCase().includes(searchAction.toLowerCase());
    const matchesEntity = (log.entityName || '').toLowerCase().includes(searchEntity.toLowerCase());
    return matchesUser && matchesAction && matchesEntity;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('vi-VN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1>📋 Nhật ký hoạt động</h1>
          <p>Theo dõi lịch sử thao tác của các quản trị viên và thành viên trên hệ thống</p>
        </div>
        <button 
          className="btn btn-ghost btn-sm" 
          onClick={handleRefresh} 
          disabled={loading}
          style={{ gap: 6 }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Tải lại
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: 16, marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input
            placeholder="Lọc theo email / tài khoản..."
            value={searchUser}
            onChange={e => setSearchUser(e.target.value)}
            style={{ width: '100%', paddingLeft: 34, height: 38, background: 'var(--glass-thick)', border: '0.5px solid var(--border-glass-default)', borderRadius: 8, color: 'var(--text-1)', fontSize: '0.84rem', outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', flex: 2 }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 150 }}>
            <Filter size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input
              placeholder="Thao tác (VD: UPDATE, CREATE)..."
              value={searchAction}
              onChange={e => setSearchAction(e.target.value)}
              style={{ width: '100%', paddingLeft: 34, height: 38, background: 'var(--glass-thick)', border: '0.5px solid var(--border-glass-default)', borderRadius: 8, color: 'var(--text-1)', fontSize: '0.84rem', outline: 'none' }}
            />
          </div>

          <div style={{ position: 'relative', flex: 1, minWidth: 150 }}>
            <Filter size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input
              placeholder="Đối tượng (VD: User, Task)..."
              value={searchEntity}
              onChange={e => setSearchEntity(e.target.value)}
              style={{ width: '100%', paddingLeft: 34, height: 38, background: 'var(--glass-thick)', border: '0.5px solid var(--border-glass-default)', borderRadius: 8, color: 'var(--text-1)', fontSize: '0.84rem', outline: 'none' }}
            />
          </div>

          <select 
            value={size} 
            onChange={e => { setSize(parseInt(e.target.value)); setPage(0); }}
            style={{ height: 38, padding: '0 12px', background: 'var(--glass-thick)', border: '0.5px solid var(--border-glass-default)', borderRadius: 8, color: 'var(--text-1)', fontSize: '0.84rem', outline: 'none' }}
          >
            <option value={10}>10 dòng / trang</option>
            <option value={20}>20 dòng / trang</option>
            <option value={50}>50 dòng / trang</option>
            <option value={100}>100 dòng / trang</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ paddingLeft: 20, width: '180px' }}>Thời gian</th>
              <th>Tài khoản</th>
              <th style={{ width: '120px' }}>Thao tác</th>
              <th style={{ width: '150px' }}>Đối tượng</th>
              <th>Chi tiết hoạt động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
                    <RefreshCw size={16} className="animate-spin" /> Đang tải nhật ký...
                  </div>
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-3)' }}>
                  Không tìm thấy nhật ký hoạt động nào.
                </td>
              </tr>
            ) : (
              filteredLogs.map(log => (
                <tr key={log.id}>
                  <td style={{ paddingLeft: 20, fontSize: '0.82rem', color: 'var(--text-3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={12} />
                      {formatDate(log.createdAt)}
                    </div>
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: '0.84rem', fontFamily: 'var(--font-mono)' }}>
                    {log.username}
                  </td>
                  <td>
                    <span 
                      className={`badge ${
                        log.action.includes('CREATE') || log.action.includes('ADD') ? 'badge-green' : 
                        log.action.includes('UPDATE') || log.action.includes('EDIT') ? 'badge-blue' : 
                        log.action.includes('DELETE') || log.action.includes('REMOVE') || log.action.includes('LOCK') ? 'badge-red' : 
                        'badge-purple'
                      }`}
                      style={{ fontSize: '0.68rem', fontWeight: 600 }}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.84rem', color: 'var(--text-2)' }}>
                    {log.entityName ? (
                      <span style={{ fontFamily: 'var(--font-mono)' }}>
                        {log.entityName}{log.entityId ? ` #${log.entityId}` : ''}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ fontSize: '0.84rem', color: 'var(--text-2)', lineHeight: 1.4, wordBreak: 'break-word', paddingRight: 20 }}>
                    {log.details || '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {!loading && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
          <div style={{ fontSize: '0.84rem', color: 'var(--text-3)' }}>
            Tổng số: <strong style={{ color: 'var(--text-2)' }}>{totalElements}</strong> hoạt động
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button 
              className="btn btn-ghost btn-sm btn-icon" 
              disabled={page === 0} 
              onClick={() => setPage(p => p - 1)}
              style={{ borderRadius: 6 }}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: '0.84rem', color: 'var(--text-2)' }}>
              Trang <strong>{page + 1}</strong> / {totalPages}
            </span>
            <button 
              className="btn btn-ghost btn-sm btn-icon" 
              disabled={page >= totalPages - 1} 
              onClick={() => setPage(p => p + 1)}
              style={{ borderRadius: 6 }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

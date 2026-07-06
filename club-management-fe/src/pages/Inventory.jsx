import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  Package, Archive, HelpCircle, AlertCircle, PlusCircle, Check, X, 
  RotateCcw, Info, User, CalendarDays, ClipboardList
} from 'lucide-react';

export default function Inventory() {
  const toast = useToast();
  const { user } = useAuth();
  
  // Tabs: 'catalog' (Kho thiết bị), 'requests' (Duyệt mượn trả)
  const [activeTab, setActiveTab] = useState('catalog');

  // Loading / Data states
  const [items, setItems] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // New item form (Admin/Manager)
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    quantity: 1,
    location: '',
    itemCondition: 'GOOD',
    imageUrl: ''
  });
  const [savingItem, setSavingItem] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Borrow request modal state
  const [borrowModalItem, setBorrowModalItem] = useState(null);
  const [borrowForm, setBorrowForm] = useState({
    quantity: 1,
    borrowDate: new Date().toISOString().slice(0, 10),
    expectedReturnDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10), // 3 days default
    notes: ''
  });
  const [submittingBorrow, setSubmittingBorrow] = useState(false);

  const loadItems = async () => {
    try {
      const res = await api.get('/inventory');
      setItems(res.data?.data || []);
    } catch (e) {
      console.error('Không thể lấy danh mục kho:', e);
    }
  };

  const loadRequests = async () => {
    try {
      const res = await api.get('/inventory/borrow');
      setRequests(res.data?.data || []);
    } catch (e) {
      console.error('Không thể lấy danh sách mượn trả:', e);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadItems(), loadRequests()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Handle create/update item
  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!newItem.name || newItem.quantity < 1) {
      toast('Điền đầy đủ tên và số lượng vật phẩm!', 'error');
      return;
    }
    setSavingItem(true);
    try {
      if (editingItem) {
        const res = await api.put(`/inventory/${editingItem.id}`, newItem);
        toast('Cập nhật thiết bị thành công!', 'success');
        setItems(prev => prev.map(item => item.id === editingItem.id ? res.data.data : item));
        setEditingItem(null);
      } else {
        const res = await api.post('/inventory', newItem);
        toast('Thêm thiết bị mới vào kho thành công!', 'success');
        setItems(prev => [...prev, res.data.data]);
      }
      setNewItem({ name: '', description: '', quantity: 1, location: '', itemCondition: 'GOOD', imageUrl: '' });
      loadItems();
    } catch (err) {
      toast('Lỗi khi lưu thiết bị', 'error');
    } finally {
      setSavingItem(false);
    }
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setNewItem({
      name: item.name,
      description: item.description || '',
      quantity: item.quantity,
      location: item.location || '',
      itemCondition: item.itemCondition || 'GOOD',
      imageUrl: item.imageUrl || ''
    });
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Bạn muốn xóa thiết bị này khỏi danh sách kho đồ?')) return;
    try {
      await api.delete(`/inventory/${id}`);
      toast('Đã xóa thiết bị thành công', 'success');
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (e) {
      toast('Lỗi khi xóa thiết bị', 'error');
    }
  };

  // Submit borrow request
  const handleBorrowSubmit = async (e) => {
    e.preventDefault();
    if (borrowForm.quantity < 1 || borrowForm.quantity > borrowModalItem.availableQuantity) {
      toast('Số lượng mượn không hợp lệ!', 'error');
      return;
    }
    setSubmittingBorrow(true);
    try {
      const res = await api.post('/inventory/borrow', {
        itemId: borrowModalItem.id,
        quantity: Number(borrowForm.quantity),
        borrowDate: borrowForm.borrowDate,
        expectedReturnDate: borrowForm.expectedReturnDate,
        notes: borrowForm.notes
      });
      toast('Đã gửi yêu cầu mượn thiết bị! Vui lòng chờ phê duyệt.', 'success');
      setRequests(prev => [res.data.data, ...prev]);
      setBorrowModalItem(null);
      setBorrowForm({ quantity: 1, borrowDate: new Date().toISOString().slice(0, 10), expectedReturnDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10), notes: '' });
      loadItems();
    } catch (err) {
      toast(err.response?.data?.message || 'Lỗi khi gửi yêu cầu mượn', 'error');
    } finally {
      setSubmittingBorrow(false);
    }
  };

  // Approve/Reject/Return borrow
  const handleBorrowStatus = async (id, status, isRejected = false) => {
    let rejectReason = '';
    if (isRejected) {
      rejectReason = window.prompt('Nhập lý do từ chối mượn thiết bị:');
      if (rejectReason === null) return;
    }
    try {
      const res = await api.put(`/inventory/borrow/${id}/status`, { status, rejectReason });
      toast('Cập nhật trạng thái đơn mượn đồ thành công!', 'success');
      setRequests(prev => prev.map(req => req.id === id ? res.data.data : req));
      loadItems(); // Quantities updated
    } catch (err) {
      toast(err.response?.data?.message || 'Lỗi khi cập nhật trạng thái đơn', 'error');
    }
  };

  const getConditionLabel = (c) => {
    if (c === 'GOOD') return 'Tốt';
    if (c === 'DAMAGED') return 'Hỏng';
    return 'Đang sửa';
  };

  const getConditionStyle = (c) => {
    if (c === 'GOOD') return { color: 'var(--neon-green)', background: 'rgba(0,255,102,0.1)' };
    if (c === 'DAMAGED') return { color: 'var(--neon-orange)', background: 'rgba(255,92,0,0.1)' };
    return { color: 'var(--neon-blue)', background: 'rgba(0,240,255,0.1)' };
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'BORROWED': return { color: '#00f0ff', background: 'rgba(0,240,255,0.1)' };
      case 'RETURNED': return { color: '#00ff66', background: 'rgba(0,255,102,0.1)' };
      case 'REJECTED': return { color: '#ff5c00', background: 'rgba(255,92,0,0.1)' };
      default: return { color: '#9ca3af', background: 'rgba(156,163,175,0.1)' };
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'BORROWED': return 'Đang mượn';
      case 'RETURNED': return 'Đã trả';
      case 'REJECTED': return 'Từ chối';
      default: return 'Chờ duyệt';
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Kho Thiết Bị & Mượn Trả</h1>
        <p>Quản lý trang phục biểu diễn, đạo cụ chuyên môn, hệ thống loa đài và lịch sử mượn trả</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2" style={{ marginBottom: 24, borderBottom: '1px solid var(--border-color)', paddingBottom: 10 }}>
        <button className={`btn btn-sm ${activeTab === 'catalog' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('catalog')}>
          Danh mục Thiết bị
        </button>
        <button className={`btn btn-sm ${activeTab === 'requests' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('requests')}>
          Đơn Mượn Trả ({requests.filter(r => r.status === 'PENDING').length} mới)
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-3" style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
      ) : (
        <>
          {/* TAB 1: CATALOGUE KHO THIẾT BỊ */}
          {activeTab === 'catalog' && (
            <div style={{ display: 'grid', gridTemplateColumns: ['ADMIN', 'MANAGER'].includes(user?.role) ? '1.2fr 1fr' : '1fr', gap: 24 }}>
              {/* Grid of items */}
              <div className="bento-card" style={{ padding: 24 }}>
                <h3 className="mb-3" style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Package size={18} className="text-purple" /> Danh sách thiết bị
                </h3>

                {items.length === 0 ? (
                  <p className="text-muted" style={{ textAlign: 'center', padding: 40 }}>Chưa có đạo cụ hay thiết bị nào trong kho.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                    {items.map(item => (
                      <div key={item.id} className="bento-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {item.imageUrl && (
                          <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border-color)' }} />
                        )}
                        <div>
                          <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 600 }}>{item.name}</h4>
                          <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', minHeight: 34, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.description || 'Không có mô tả.'}</p>
                        </div>
                        <div style={{ fontSize: '0.76rem', borderTop: '1px solid var(--border-color)', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Vị trí:</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{item.location || 'Kho CLB'}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Số lượng:</span>
                            <strong>Có sẵn {item.availableQuantity} / {item.quantity}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Trình trạng:</span>
                            <span style={{ ...getConditionStyle(item.itemCondition), padding: '1px 5px', borderRadius: 4, fontSize: '0.68rem', fontWeight: 600 }}>
                              {getConditionLabel(item.itemCondition)}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2" style={{ marginTop: 8 }}>
                          {item.availableQuantity > 0 ? (
                            <button className="btn btn-ghost btn-sm" onClick={() => setBorrowModalItem(item)} style={{ flex: 1, fontSize: '0.78rem' }}>
                              Đăng ký mượn
                            </button>
                          ) : (
                            <button className="btn btn-ghost btn-sm" disabled style={{ flex: 1, fontSize: '0.78rem', opacity: 0.5 }}>
                              Đã hết đồ
                            </button>
                          )}

                          {['ADMIN', 'MANAGER'].includes(user?.role) && (
                            <div className="flex gap-1">
                              <button className="btn btn-ghost btn-sm" onClick={() => handleEditClick(item)} style={{ padding: '0 8px' }} title="Sửa">
                                📝
                              </button>
                              <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteItem(item.id)} style={{ padding: '0 8px', color: 'var(--neon-red)' }} title="Xóa">
                                🗑️
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form panel for Admin/Manager */}
              {['ADMIN', 'MANAGER'].includes(user?.role) && (
                <div className="bento-card accent-purple" style={{ padding: 24, height: 'fit-content' }}>
                  <h3 className="mb-3" style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                    {editingItem ? 'Sửa thông tin Thiết bị' : 'Thêm Thiết bị mới'}
                  </h3>
                  <form onSubmit={handleSaveItem} className="flex-col gap-3">
                    <div className="form-group">
                      <label className="form-label">Tên thiết bị / Đạo cụ *</label>
                      <input className="form-input" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} placeholder="ví dụ: Loa kéo kéo A, Trang phục nhảy..." required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Mô tả chi tiết</label>
                      <textarea className="form-input" value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} placeholder="Thông số, size trang phục, tình trạng hoạt động..." rows={2} />
                    </div>
                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">Tổng số lượng nhập *</label>
                        <input className="form-input" type="number" min="1" value={newItem.quantity} onChange={e => setNewItem({ ...newItem, quantity: Number(e.target.value) })} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Vị trí lưu kho</label>
                        <input className="form-input" value={newItem.location} onChange={e => setNewItem({ ...newItem, location: e.target.value })} placeholder="Tủ sắt A, kệ 1..." />
                      </div>
                    </div>
                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">Tình trạng</label>
                        <select className="form-select" value={newItem.itemCondition} onChange={e => setNewItem({ ...newItem, itemCondition: e.target.value })}>
                          <option value="GOOD">Tốt (Good)</option>
                          <option value="DAMAGED">Hỏng (Damaged)</option>
                          <option value="REPAIRING">Đang sửa chữa</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Ảnh đại diện URL</label>
                        <input className="form-input" value={newItem.imageUrl} onChange={e => setNewItem({ ...newItem, imageUrl: e.target.value })} placeholder="URL hình ảnh sản phẩm" />
                      </div>
                    </div>
                    <div className="flex gap-2" style={{ marginTop: 10 }}>
                      <button className="btn btn-primary" type="submit" disabled={savingItem} style={{ flex: 1, justifyContent: 'center' }}>
                        {savingItem ? 'Đang lưu...' : 'Lưu vào Kho'}
                      </button>
                      {editingItem && (
                        <button className="btn btn-ghost" type="button" onClick={() => { setEditingItem(null); setNewItem({ name: '', description: '', quantity: 1, location: '', itemCondition: 'GOOD', imageUrl: '' }); }} style={{ flex: 1, justifyContent: 'center' }}>
                          Hủy sửa
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REQUESTS LỊCH SỬ MƯỢN TRẢ */}
          {activeTab === 'requests' && (
            <div className="bento-card" style={{ padding: 24, overflowX: 'auto' }}>
              <h3 className="mb-3" style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClipboardList size={18} className="text-purple" /> Lịch sử yêu cầu mượn trả
              </h3>

              {requests.length === 0 ? (
                <p className="text-muted" style={{ textAlign: 'center', padding: 40 }}>Chưa có yêu cầu mượn trả nào được lập.</p>
              ) : (
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid var(--border-color)' }}>
                      <th style={{ padding: 12 }}>Người mượn</th>
                      <th style={{ padding: 12 }}>Thiết bị</th>
                      <th style={{ padding: 12 }}>Số lượng</th>
                      <th style={{ padding: 12 }}>Thời gian dự kiến</th>
                      <th style={{ padding: 12 }}>Thực tế trả</th>
                      <th style={{ padding: 12 }}>Trạng thái</th>
                      <th style={{ padding: 12 }}>Ghi chú</th>
                      <th style={{ padding: 12 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map(r => (
                      <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: 12 }}>
                          <div style={{ fontWeight: 600 }}>{r.user?.fullName}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{r.user?.email}</div>
                        </td>
                        <td style={{ padding: 12, fontWeight: 600 }}>{r.item?.name}</td>
                        <td style={{ padding: 12, fontWeight: 700 }}>{r.quantity}</td>
                        <td style={{ padding: 12, fontSize: '0.8rem' }}>
                          <div>Mượn: {new Date(r.borrowDate).toLocaleDateString('vi-VN')}</div>
                          <div style={{ color: 'var(--text-secondary)' }}>Trả: {new Date(r.expectedReturnDate).toLocaleDateString('vi-VN')}</div>
                        </td>
                        <td style={{ padding: 12, fontSize: '0.8rem', color: 'var(--neon-green)' }}>
                          {r.actualReturnDate ? new Date(r.actualReturnDate).toLocaleDateString('vi-VN') : '-'}
                        </td>
                        <td style={{ padding: 12 }}>
                          <span style={{
                            ...getStatusStyle(r.status),
                            padding: '3px 8px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 600
                          }}>{getStatusLabel(r.status)}</span>
                        </td>
                        <td style={{ padding: 12, fontSize: '0.78rem', color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.notes}
                          {r.rejectReason && <div style={{ color: 'var(--neon-orange)' }}>Lý do từ chối: {r.rejectReason}</div>}
                        </td>
                        <td style={{ padding: 12 }}>
                          {/* Manager approval options */}
                          {['ADMIN', 'MANAGER'].includes(user?.role) && r.status === 'PENDING' && (
                            <div className="flex gap-1">
                              <button className="btn btn-ghost btn-sm" onClick={() => handleBorrowStatus(r.id, 'REJECTED', true)} style={{ padding: '0 8px', color: 'var(--neon-orange)' }} title="Từ chối">
                                ❌
                              </button>
                              <button className="btn btn-primary btn-sm" onClick={() => handleBorrowStatus(r.id, 'BORROWED')} style={{ padding: '0 8px', background: 'var(--neon-blue)', borderColor: 'var(--neon-blue)' }} title="Duyệt xuất kho">
                                ✔ Duyệt
                              </button>
                            </div>
                          )}
                          {['ADMIN', 'MANAGER'].includes(user?.role) && r.status === 'BORROWED' && (
                            <button className="btn btn-ghost btn-sm" onClick={() => handleBorrowStatus(r.id, 'RETURNED')} style={{ color: 'var(--neon-green)', borderColor: 'rgba(0,255,102,0.2)' }}>
                              ↩ Nhận lại
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Borrow Modal pop up */}
          {borrowModalItem && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
              <div className="bento-card accent-blue" style={{ maxWidth: 450, width: '90%', padding: 24, background: 'var(--bg-surface)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: 10, marginBottom: 16 }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Đăng ký Mượn Thiết bị</h3>
                  <button className="btn btn-ghost btn-sm" onClick={() => setBorrowModalItem(null)}><X size={16} /></button>
                </div>

                <form onSubmit={handleBorrowSubmit} className="flex-col gap-3">
                  <div style={{ display: 'flex', gap: 10, background: 'var(--bg-main)', padding: 12, borderRadius: 6, marginBottom: 10 }}>
                    <Info size={18} className="text-blue" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ fontSize: '0.8rem' }}>
                      <strong>{borrowModalItem.name}</strong> <br />
                      <span style={{ color: 'var(--text-secondary)' }}>Vị trí: {borrowModalItem.location || 'Kho'} | Số lượng còn lại: {borrowModalItem.availableQuantity}</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Số lượng mượn (tối đa {borrowModalItem.availableQuantity}) *</label>
                    <input className="form-input" type="number" min="1" max={borrowModalItem.availableQuantity} value={borrowForm.quantity}
                      onChange={e => setBorrowForm({ ...borrowForm, quantity: Number(e.target.value) })} required />
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Ngày mượn *</label>
                      <input className="form-input" type="date" value={borrowForm.borrowDate}
                        onChange={e => setBorrowForm({ ...borrowForm, borrowDate: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Ngày trả dự kiến *</label>
                      <input className="form-input" type="date" value={borrowForm.expectedReturnDate}
                        onChange={e => setBorrowForm({ ...borrowForm, expectedReturnDate: e.target.value })} required />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mục đích sử dụng / Ghi chú</label>
                    <textarea className="form-input" placeholder="ví dụ: Mượn tập duyệt văn nghệ 20/11..." value={borrowForm.notes} rows={2}
                      onChange={e => setBorrowForm({ ...borrowForm, notes: e.target.value })} />
                  </div>

                  <button className="btn btn-primary" type="submit" disabled={submittingBorrow} style={{ justifyContent: 'center', marginTop: 10 }}>
                    {submittingBorrow ? 'Đang gửi yêu cầu...' : 'Xác nhận Đăng ký mượn'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

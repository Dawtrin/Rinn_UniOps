import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  FolderOpen, Link2, Download, PlusCircle, Trash2, Search, Filter,
  FileText, Video, Award, Image, Settings, Globe
} from 'lucide-react';

export default function Resources() {
  const toast = useToast();
  const { user } = useAuth();
  
  // Data states
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state (Admin/Manager only)
  const [newRes, setNewRes] = useState({
    name: '',
    description: '',
    type: 'LINK',
    url: '',
    fileSize: '',
    category: 'BYLAWS'
  });
  const [saving, setSaving] = useState(false);

  const loadResources = async () => {
    setLoading(true);
    try {
      const res = await api.get('/resources');
      setResources(res.data?.data || []);
    } catch (e) {
      toast('Không thể tải thư viện tài liệu', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadResources(); }, []);

  const handleAddResource = async (e) => {
    e.preventDefault();
    if (!newRes.name || !newRes.url) {
      toast('Vui lòng nhập tên và đường dẫn tài liệu!', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await api.post('/resources', {
        name: newRes.name,
        description: newRes.description,
        type: newRes.type,
        url: newRes.url,
        fileSize: newRes.fileSize ? Number(newRes.fileSize) : null,
        category: newRes.category
      });
      toast('Đã thêm tài liệu mới!', 'success');
      setResources(prev => [res.data.data, ...prev]);
      setNewRes({ name: '', description: '', type: 'LINK', url: '', fileSize: '', category: 'BYLAWS' });
    } catch (err) {
      toast('Lỗi khi lưu tài liệu', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn muốn xóa tài liệu này khỏi thư viện CLB?')) return;
    try {
      await api.delete(`/resources/${id}`);
      toast('Xóa tài nguyên thành công!', 'success');
      setResources(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      toast('Lỗi khi xóa tài nguyên', 'error');
    }
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'BYLAWS': return <Award className="text-orange" size={20} />;
      case 'DESIGN_ASSETS': return <Image className="text-purple" size={20} />;
      case 'PR_GUIDELINES': return <FileText className="text-blue" size={20} />;
      case 'TRAINING_VIDEOS': return <Video className="text-green" size={20} />;
      default: return <FolderOpen className="text-muted" size={20} />;
    }
  };

  const getCategoryLabel = (cat) => {
    switch (cat) {
      case 'BYLAWS': return 'Quy chế & Điều lệ';
      case 'DESIGN_ASSETS': return 'Ấn phẩm & Design';
      case 'PR_GUIDELINES': return 'Bài viết & PR';
      case 'TRAINING_VIDEOS': return 'Bài tập & Choreo';
      default: return 'Tài liệu khác';
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Filter & Search logic
  const filteredResources = resources.filter(res => {
    const matchesCategory = filterCategory === 'ALL' || res.category === filterCategory;
    const matchesSearch = res.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (res.description && res.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div>
      <div className="page-header">
        <h1>Thư Viện Tài Liệu</h1>
        <p>Kho lưu trữ văn bản nội bộ, bài tập chuyên môn, tài nguyên thiết kế và các liên kết dùng chung</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: ['ADMIN', 'MANAGER'].includes(user?.role) ? '1.2fr 1fr' : '1fr', gap: 24 }}>
        {/* Left Side: Filter and Library grid */}
        <div className="flex-col gap-3">
          {/* Filter Bar */}
          <div className="bento-card" style={{ padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
              {[
                { key: 'ALL', label: 'Tất cả' },
                { key: 'BYLAWS', label: 'Quy chế' },
                { key: 'DESIGN_ASSETS', label: 'Thiết kế' },
                { key: 'PR_GUIDELINES', label: 'PR & Content' },
                { key: 'TRAINING_VIDEOS', label: 'Video chuyên môn' },
                { key: 'OTHER', label: 'Tài liệu khác' }
              ].map(opt => (
                <button key={opt.key} className={`btn btn-sm ${filterCategory === opt.key ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilterCategory(opt.key)}>
                  {opt.label}
                </button>
              ))}
            </div>
            {/* Search */}
            <div style={{ position: 'relative', width: 'min(250px, 100%)' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input className="form-input" style={{ paddingLeft: 30, fontSize: '0.82rem' }} placeholder="Tìm tài liệu..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
          </div>

          {/* Library Grid */}
          <div className="bento-card" style={{ padding: 24 }}>
            {loading ? (
              <div className="flex justify-center p-3" style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
            ) : filteredResources.length === 0 ? (
              <p className="text-muted text-center" style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Không tìm thấy tài nguyên nào phù hợp.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {filteredResources.map(res => (
                  <div key={res.id} className="bento-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 160 }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        {getCategoryIcon(res.category)}
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', background: 'var(--bg-main)', padding: '2px 6px', borderRadius: 4 }}>
                          {getCategoryLabel(res.category)}
                        </span>
                      </div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '0.92rem', fontWeight: 600, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{res.name}</h4>
                      <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{res.description}</p>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      <span>{res.type === 'FILE' ? `File: ${formatBytes(res.fileSize)}` : 'Liên kết ngoài'}</span>
                      <div className="flex gap-2">
                        <a href={res.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                          {res.type === 'FILE' ? <Download size={12} /> : <Link2 size={12} />}
                          {res.type === 'FILE' ? 'Tải về' : 'Mở link'}
                        </a>
                        {['ADMIN', 'MANAGER'].includes(user?.role) && (
                          <button onClick={() => handleDelete(res.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neon-red)' }} title="Xóa">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Form (Admin/Manager only) */}
        {['ADMIN', 'MANAGER'].includes(user?.role) && (
          <div className="bento-card accent-purple" style={{ padding: 24, height: 'fit-content' }}>
            <h3 className="mb-3" style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <PlusCircle size={18} className="text-purple" /> Thêm tài nguyên mới
            </h3>
            <form onSubmit={handleAddResource} className="flex-col gap-3">
              <div className="form-group">
                <label className="form-label">Tên tài nguyên / Tài liệu *</label>
                <input className="form-input" value={newRes.name} onChange={e => setNewRes({ ...newRes, name: e.target.value })} placeholder="ví dụ: Quy chế CLB nhiệm kỳ mới, Kho ảnh liveshow..." required />
              </div>
              <div className="form-group">
                <label className="form-label">Mô tả ngắn</label>
                <textarea className="form-input" value={newRes.description} onChange={e => setNewRes({ ...newRes, description: e.target.value })} placeholder="Mô tả tóm tắt nội dung file hoặc liên kết này..." rows={2} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Loại tài nguyên</label>
                  <select className="form-select" value={newRes.type} onChange={e => setNewRes({ ...newRes, type: e.target.value })}>
                    <option value="LINK">Liên kết ngoài (Link)</option>
                    <option value="FILE">Tệp tin (File download)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Danh mục thư mục</label>
                  <select className="form-select" value={newRes.category} onChange={e => setNewRes({ ...newRes, category: e.target.value })}>
                    <option value="BYLAWS">Quy chế & Luật CLB</option>
                    <option value="DESIGN_ASSETS">Tài nguyên Thiết kế/Ấn phẩm</option>
                    <option value="PR_GUIDELINES">Quy chuẩn Bài viết PR/Content</option>
                    <option value="TRAINING_VIDEOS">Video tập luyện / Choreography</option>
                    <option value="OTHER">Tài liệu khác</option>
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group" style={{ gridColumn: newRes.type === 'FILE' ? 'span 1' : 'span 2' }}>
                  <label className="form-label">Đường dẫn URL *</label>
                  <input className="form-input" value={newRes.url} onChange={e => setNewRes({ ...newRes, url: e.target.value })} placeholder="URL driver, notion, figma..." required />
                </div>
                {newRes.type === 'FILE' && (
                  <div className="form-group">
                    <label className="form-label">Dung lượng file (Bytes)</label>
                    <input className="form-input" type="number" placeholder="Ví dụ: 1048576" value={newRes.fileSize} onChange={e => setNewRes({ ...newRes, fileSize: e.target.value })} />
                  </div>
                )}
              </div>
              <button className="btn btn-primary" type="submit" disabled={saving} style={{ justifyContent: 'center', marginTop: 10 }}>
                {saving ? 'Đang lưu...' : 'Thêm vào thư viện'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);

  const iconMap = { success: <CheckCircle size={18} />, error: <AlertCircle size={18} />, info: <Info size={18} /> };
  const colorMap = { success: 'toast-success', error: 'toast-error', info: 'toast-info' };

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${colorMap[t.type]}`}>
            <span className={`text-${t.type === 'success' ? 'green' : t.type === 'error' ? 'red' : 'blue'}`}>
              {iconMap[t.type]}
            </span>
            <span style={{ fontSize: '0.85rem', flex: 1 }}>{t.msg}</span>
            <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))} className="btn btn-ghost btn-sm" style={{ padding: '2px 6px' }}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

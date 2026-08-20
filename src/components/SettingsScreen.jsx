import { useEffect, useState } from 'react';
import { ACTION_ORDER, ACTION_LABELS, loadKeybinds, saveKeybinds, resetKeybinds, keyLabel } from '../game/keybinds.js';
import './SettingsScreen.css';

export default function SettingsScreen({ onBack }) {
  const [binds, setBinds] = useState(loadKeybinds);
  const [listening, setListening] = useState(null); // action key currently waiting for a keypress

  useEffect(() => {
    if (!listening) return;
    const onKey = e => {
      e.preventDefault();
      if (e.code === 'Escape') { setListening(null); return; }
      const next = { ...binds, [listening]: e.code };
      setBinds(next);
      saveKeybinds(next);
      setListening(null);
    };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true });
  }, [listening, binds]);

  useEffect(() => {
    if (listening) return;
    const h = e => { if (e.code === 'Escape') onBack(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [listening, onBack]);

  const reset = () => setBinds(resetKeybinds());

  const usedElsewhere = code => ACTION_ORDER.filter(a => binds[a] === code);

  return (
    <div className="settings-screen">
      <h2 className="settings-title">TÙY CHỈNH PHÍM</h2>
      <div className="settings-list">
        {ACTION_ORDER.map(action => {
          const dupes = usedElsewhere(binds[action]);
          const isDupe = dupes.length > 1;
          return (
            <div className="settings-row" key={action}>
              <span className="settings-label">{ACTION_LABELS[action]}</span>
              <button
                className={`key-btn ${listening === action ? 'listening' : ''} ${isDupe ? 'dupe' : ''}`}
                onClick={() => setListening(action)}
              >
                {listening === action ? 'NHẤN PHÍM...' : keyLabel(binds[action])}
              </button>
            </div>
          );
        })}
      </div>
      <p className="settings-hint">Bấm vào nút rồi nhấn phím bất kỳ để đổi · ESC để hủy</p>
      <div className="settings-actions">
        <button className="ghost-btn" onClick={reset}>KHÔI PHỤC MẶC ĐỊNH</button>
        <button className="start-btn" onClick={onBack}>QUAY LẠI</button>
      </div>
    </div>
  );
}

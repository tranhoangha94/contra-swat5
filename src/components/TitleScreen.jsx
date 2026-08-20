import { useEffect, useState } from 'react';
import { loadKeybinds, keyLabel } from '../game/keybinds.js';
import './TitleScreen.css';

export default function TitleScreen({ onStart, onSettings }) {
  const [binds] = useState(loadKeybinds);

  useEffect(() => {
    const h = e => { if (e.code === 'Enter') onStart(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onStart]);

  return (
    <div className="title-screen">
      <div className="title-vignette" />
      <div className="title-content">
        <h1 className="logo">
          <span className="logo-main">CONTRA</span>
          <span className="logo-sub">JUNGLE ASSAULT</span>
        </h1>
        <img className="title-banner" src="/banner.jpg" alt="SWAT TEAM HEAD OUT" />
        <p className="mission">MÀN 1 · ĐỘT KÍCH RỪNG RẬM</p>
        <button className="start-btn" onClick={onStart}>NHẤN ENTER ĐỂ BẮT ĐẦU</button>
        <div className="controls">
          <div><b>{keyLabel(binds.left)} {keyLabel(binds.right)}</b> di chuyển</div>
          <div><b>{keyLabel(binds.up)}</b> ngắm lên · <b>{keyLabel(binds.down)}</b> nằm/thu người</div>
          <div><b>{keyLabel(binds.jump)}</b> nhảy</div>
          <div><b>{keyLabel(binds.fire)}</b> bắn</div>
        </div>
        <button className="settings-link" onClick={onSettings}>⚙ TÙY CHỈNH PHÍM</button>
      </div>
    </div>
  );
}

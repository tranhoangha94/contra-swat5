import { useEffect, useState } from 'react';
import { loadKeybinds, keyLabel } from '../game/keybinds.js';
import { loadPlayerName, savePlayerName } from '../game/leaderboard.js';
import './TitleScreen.css';

export default function TitleScreen({ onStart, onSettings, onLeaderboard }) {
  const [binds] = useState(loadKeybinds);
  const [name, setName] = useState(loadPlayerName);

  useEffect(() => {
    const h = e => { if (e.code === 'Enter' && document.activeElement?.tagName !== 'INPUT') onStart(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onStart]);

  const changeName = v => {
    const trimmed = v.slice(0, 20);
    setName(trimmed);
    savePlayerName(trimmed);
  };

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
        <input
          className="name-input"
          type="text"
          placeholder="TÊN CỦA BẠN"
          value={name}
          onChange={e => changeName(e.target.value)}
          onKeyDown={e => { if (e.code === 'Enter') { e.currentTarget.blur(); onStart(); } }}
          maxLength={20}
        />
        <button className="start-btn" onClick={onStart}>NHẤN ENTER ĐỂ BẮT ĐẦU</button>
        <div className="controls">
          <div><b>{keyLabel(binds.left)} {keyLabel(binds.right)}</b> di chuyển</div>
          <div><b>{keyLabel(binds.up)}</b> ngắm lên · <b>{keyLabel(binds.down)}</b> nằm/thu người</div>
          <div><b>{keyLabel(binds.jump)}</b> nhảy</div>
          <div><b>{keyLabel(binds.fire)}</b> bắn</div>
        </div>
        <div className="title-links">
          <button className="settings-link" onClick={onSettings}>⚙ TÙY CHỈNH PHÍM</button>
          <button className="settings-link" onClick={onLeaderboard}>🏆 BẢNG XẾP HẠNG</button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import './CharacterSelect.css';

const CHARACTERS = [0, 1, 2, 3, 4].map(i => ({
  id: i,
  portrait: `/faces/p${i}.jpg`,
  face: `/faces/f${i}.png`,
}));

export default function CharacterSelect({ onPick }) {
  const [cursor, setCursor] = useState(0);

  useEffect(() => {
    const h = e => {
      if (e.code === 'ArrowLeft') setCursor(c => (c + CHARACTERS.length - 1) % CHARACTERS.length);
      if (e.code === 'ArrowRight') setCursor(c => (c + 1) % CHARACTERS.length);
      if (e.code === 'Enter' || e.code === 'Space') onPick(CHARACTERS[cursor]);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [cursor, onPick]);

  return (
    <div className="char-select">
      <img className="char-banner" src="/banner.jpg" alt="SWAT TEAM HEAD OUT" />
      <h2 className="char-title">CHỌN NHÂN VẬT</h2>
      <div className="char-grid">
        {CHARACTERS.map(c => (
          <button
            key={c.id}
            className={`char-card ${cursor === c.id ? 'active' : ''}`}
            onClick={() => onPick(c)}
            onMouseEnter={() => setCursor(c.id)}
          >
            <img src={c.portrait} alt={`Lính ${c.id + 1}`} />
            <span>0{c.id + 1}</span>
          </button>
        ))}
      </div>
      <p className="char-hint">◀ ▶ chọn · ENTER xác nhận</p>
    </div>
  );
}

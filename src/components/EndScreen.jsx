import { useEffect } from 'react';
import './EndScreen.css';

export default function EndScreen({ win, score, onRestart }) {
  useEffect(() => {
    const h = e => { if (e.code === 'Enter' || e.code === 'KeyR') onRestart(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onRestart]);

  return (
    <div className={`end-screen ${win ? 'win' : 'lose'}`}>
      <h1>{win ? 'MÀN 1 HOÀN THÀNH' : 'GAME OVER'}</h1>
      <p className="score">SCORE {String(score).padStart(6, '0')}</p>
      <button onClick={onRestart}>NHẤN ENTER / R ĐỂ CHƠI LẠI</button>
    </div>
  );
}

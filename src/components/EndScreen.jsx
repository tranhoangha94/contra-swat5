import { useEffect, useState } from 'react';
import { loadPlayerName, submitScore, fetchLeaderboard } from '../game/leaderboard.js';
import './EndScreen.css';

export default function EndScreen({ win, score, reason, timeBonus, onRestart, onTitle }) {
  const [board, setBoard] = useState(null);
  const [status, setStatus] = useState('saving'); // saving | saved | error
  const [playerName] = useState(loadPlayerName);

  useEffect(() => {
    const h = e => { if (e.code === 'Enter' || e.code === 'KeyR') onRestart(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onRestart]);

  useEffect(() => {
    let cancelled = false;
    const name = playerName || 'ẨN DANH';
    submitScore(name, score)
      .then(list => { if (!cancelled) { setBoard(list); setStatus('saved'); } })
      .catch(() => {
        if (cancelled) return;
        setStatus('error');
        fetchLeaderboard().then(list => { if (!cancelled) setBoard(list); }).catch(() => {});
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const title = win ? 'MÀN 1 HOÀN THÀNH' : reason === 'timeout' ? 'HẾT GIỜ!' : 'GAME OVER';

  return (
    <div className={`end-screen ${win ? 'win' : 'lose'}`}>
      <h1>{title}</h1>
      <p className="score">SCORE {String(score).padStart(6, '0')}</p>
      {win && timeBonus > 0 && <p className="bonus">+{timeBonus} THƯỞNG THỜI GIAN</p>}
      {reason === 'timeout' && <p className="bonus dim">Hết 15 phút mà chưa hạ được boss</p>}

      <div className="board-panel">
        <div className="board-title">🏆 BẢNG XẾP HẠNG</div>
        {status === 'saving' && <div className="board-status">Đang lưu điểm...</div>}
        {status === 'error' && <div className="board-status error">Không lưu được điểm (server tắt?)</div>}
        {board && (
          <ol className="board-list">
            {board.slice(0, 8).map((row, i) => {
              const mine = row.name === (playerName || 'ẨN DANH') && row.score === score;
              return (
                <li key={i} className={mine ? 'mine' : ''}>
                  <span className="rank">{i + 1}</span>
                  <span className="bname">{row.name}</span>
                  <span className="bscore">{row.score}</span>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="end-actions">
        <button onClick={onRestart}>CHƠI LẠI</button>
        {onTitle && <button className="ghost" onClick={onTitle}>VỀ MÀN HÌNH CHÍNH</button>}
      </div>
      <p className="hint">ENTER / R để chơi lại</p>
    </div>
  );
}

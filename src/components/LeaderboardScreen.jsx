import { useEffect, useState } from 'react';
import { fetchLeaderboard } from '../game/leaderboard.js';
import './LeaderboardScreen.css';

export default function LeaderboardScreen({ onBack }) {
  const [board, setBoard] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const h = e => { if (e.code === 'Escape' || e.code === 'Enter') onBack(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onBack]);

  useEffect(() => {
    fetchLeaderboard().then(setBoard).catch(() => setError(true));
  }, []);

  return (
    <div className="lb-screen">
      <h2 className="lb-title">🏆 BẢNG XẾP HẠNG</h2>
      {error && <p className="lb-status">Không tải được bảng xếp hạng (server tắt?)</p>}
      {!error && !board && <p className="lb-status">Đang tải...</p>}
      {board && board.length === 0 && <p className="lb-status">Chưa có ai lập điểm cả — chơi thử xem!</p>}
      {board && board.length > 0 && (
        <ol className="lb-list">
          {board.map((row, i) => (
            <li key={i}>
              <span className="rank">{i + 1}</span>
              <span className="name">{row.name}</span>
              <span className="score">{row.score}</span>
            </li>
          ))}
        </ol>
      )}
      <button className="start-btn" onClick={onBack}>QUAY LẠI</button>
    </div>
  );
}

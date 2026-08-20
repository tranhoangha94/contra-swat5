import { useEffect } from 'react';
import './TitleScreen.css';

export default function TitleScreen({ onStart }) {
  useEffect(() => {
    const h = e => { if (e.code === 'Enter' || e.code === 'Space') onStart(); };
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
          <div><b>◀ ▶</b> di chuyển</div>
          <div><b>▲</b> ngắm lên · <b>▼</b> nằm/thu người</div>
          <div><b>SPACE</b> nhảy</div>
          <div><b>Z</b> bắn</div>
        </div>
      </div>
    </div>
  );
}

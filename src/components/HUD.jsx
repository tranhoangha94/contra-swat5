import './HUD.css';

function LifeIcon({ lit }) {
  return (
    <svg className={`life-icon ${lit ? '' : 'dim'}`} viewBox="0 0 20 20">
      <circle cx="10" cy="9" r="6" fill="#e0a878" />
      <rect x="4" y="6.5" width="12" height="2.6" fill="#c0392b" />
      <rect x="4" y="14" width="12" height="4" fill="#3f6b3a" />
    </svg>
  );
}

export default function HUD({ score, lives, weapon, rapidFire, boss }) {
  return (
    <div className="hud">
      <div className="hud-top">
        <div className="hud-lives">
          {[0, 1, 2].map(i => <LifeIcon key={i} lit={i < lives} />)}
        </div>
        <div className="hud-weapon">
          <span className="weapon-chip" style={{ borderColor: weapon.color, color: weapon.color }}>{weapon.letter}</span>
          {weapon.name}
          {rapidFire && <span className="rapid-chip">R</span>}
        </div>
        <div className="hud-score">SCORE {String(score).padStart(6, '0')}</div>
      </div>
      {boss && (
        <div className="boss-bar-wrap">
          <div className="boss-label">CORE WALL</div>
          <div className="boss-bar-bg">
            <div className="boss-bar-fill" style={{ width: `${(boss.hp / boss.maxHp) * 100}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

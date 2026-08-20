import { useEffect, useRef, useState } from 'react';
import { ContraEngine } from '../game/engine.js';
import { CANVAS_W, CANVAS_H, WEAPONS } from '../game/constants.js';
import { setPlayerFace } from '../game/sprites.js';
import HUD from './HUD.jsx';
import './GameCanvas.css';

export default function GameCanvas({ faceSrc, onGameOver, onWin }) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [weaponKey, setWeaponKey] = useState('machinegun');
  const [rapidFire, setRapidFire] = useState(false);
  const [boss, setBoss] = useState(null);

  useEffect(() => {
    if (faceSrc) setPlayerFace(faceSrc);
    const engine = new ContraEngine(canvasRef.current, {
      onScore: setScore,
      onLives: setLives,
      onWeapon: setWeaponKey,
      onRapid: setRapidFire,
      onBoss: setBoss,
      onGameOver: score => onGameOver(score),
      onWin: score => onWin(score),
    });
    engineRef.current = engine;
    if (import.meta.env.DEV) window.__engine = engine;
    engine.start();
    return () => engine.stop();
  }, [faceSrc, onGameOver, onWin]);

  return (
    <div className="game-canvas-wrap">
      <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} />
      <HUD score={score} lives={lives} weapon={WEAPONS[weaponKey]} rapidFire={rapidFire} boss={boss} />
    </div>
  );
}

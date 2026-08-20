import { useCallback, useState } from 'react';
import TitleScreen from './components/TitleScreen.jsx';
import CharacterSelect from './components/CharacterSelect.jsx';
import SettingsScreen from './components/SettingsScreen.jsx';
import LeaderboardScreen from './components/LeaderboardScreen.jsx';
import GameCanvas from './components/GameCanvas.jsx';
import EndScreen from './components/EndScreen.jsx';
import './App.css';

export default function App() {
  const [screen, setScreen] = useState('title'); // title | settings | leaderboard | select | playing | gameover | win
  const [finalScore, setFinalScore] = useState(0);
  const [endReason, setEndReason] = useState(null);
  const [timeBonus, setTimeBonus] = useState(0);
  const [runId, setRunId] = useState(0);
  const [character, setCharacter] = useState(null);

  const start = useCallback(() => {
    setScreen('select');
  }, []);

  const openSettings = useCallback(() => setScreen('settings'), []);
  const openLeaderboard = useCallback(() => setScreen('leaderboard'), []);
  const backToTitle = useCallback(() => setScreen('title'), []);

  const pick = useCallback(c => {
    setCharacter(c);
    setRunId(id => id + 1);
    setScreen('playing');
  }, []);

  const restart = useCallback(() => {
    setRunId(id => id + 1);
    setScreen('playing');
  }, []);

  const handleGameOver = useCallback((score, reason) => {
    setFinalScore(score);
    setEndReason(reason || 'dead');
    setScreen('gameover');
  }, []);

  const handleWin = useCallback((score, bonus) => {
    setFinalScore(score);
    setTimeBonus(bonus || 0);
    setScreen('win');
  }, []);

  return (
    <div id="stage">
      {screen === 'title' && <TitleScreen onStart={start} onSettings={openSettings} onLeaderboard={openLeaderboard} />}
      {screen === 'settings' && <SettingsScreen onBack={backToTitle} />}
      {screen === 'leaderboard' && <LeaderboardScreen onBack={backToTitle} />}
      {screen === 'select' && <CharacterSelect onPick={pick} />}
      {screen === 'playing' && (
        <GameCanvas key={runId} faceSrc={character?.face} onGameOver={handleGameOver} onWin={handleWin} />
      )}
      {screen === 'gameover' && (
        <EndScreen win={false} score={finalScore} reason={endReason} onRestart={restart} onTitle={backToTitle} />
      )}
      {screen === 'win' && (
        <EndScreen win={true} score={finalScore} timeBonus={timeBonus} onRestart={restart} onTitle={backToTitle} />
      )}
    </div>
  );
}

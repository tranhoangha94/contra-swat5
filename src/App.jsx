import { useCallback, useState } from 'react';
import TitleScreen from './components/TitleScreen.jsx';
import CharacterSelect from './components/CharacterSelect.jsx';
import GameCanvas from './components/GameCanvas.jsx';
import EndScreen from './components/EndScreen.jsx';
import './App.css';

export default function App() {
  const [screen, setScreen] = useState('title'); // title | select | playing | gameover | win
  const [finalScore, setFinalScore] = useState(0);
  const [runId, setRunId] = useState(0);
  const [character, setCharacter] = useState(null);

  const start = useCallback(() => {
    setScreen('select');
  }, []);

  const pick = useCallback(c => {
    setCharacter(c);
    setRunId(id => id + 1);
    setScreen('playing');
  }, []);

  const restart = useCallback(() => {
    setRunId(id => id + 1);
    setScreen('playing');
  }, []);

  const handleGameOver = useCallback(score => {
    setFinalScore(score);
    setScreen('gameover');
  }, []);

  const handleWin = useCallback(score => {
    setFinalScore(score);
    setScreen('win');
  }, []);

  return (
    <div id="stage">
      {screen === 'title' && <TitleScreen onStart={start} />}
      {screen === 'select' && <CharacterSelect onPick={pick} />}
      {screen === 'playing' && (
        <GameCanvas key={runId} faceSrc={character?.face} onGameOver={handleGameOver} onWin={handleWin} />
      )}
      {screen === 'gameover' && <EndScreen win={false} score={finalScore} onRestart={restart} />}
      {screen === 'win' && <EndScreen win={true} score={finalScore} onRestart={restart} />}
    </div>
  );
}

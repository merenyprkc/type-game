// src/pages/Home.tsx

import { useTypingGame } from '../hooks/useTypingGame';
import GameControls from '../components/game/GameControls';
import TypingArea from '../components/game/TypingArea';
import ResultScreen from '../components/game/ResultScreen';
import { useGameStore } from '../store/gameStore';
import { useI18n } from '../store/i18nStore';
import './Home.css';

export default function Home() {
  const {
    words,
    typedText,
    currentWordIndex,
    wpm,
    accuracy,
    timeLeft,
    isLoading,
    isFinished,
    isTyping,
    progress,
    handleInput,
    handleKeyDown,
    resetGame,
    quoteAuthor,
    codeLanguage,
  } = useTypingGame();

  const { lastResult, settings, customText } = useGameStore();
  const { t } = useI18n();

  return (
    <main className="home-page">
      <div className="home-game-area">

        {/* Mode / Settings Controls */}
        {!isFinished && (
          <GameControls onReset={resetGame} />
        )}

        {/* Game Area or Result */}
        {isFinished && lastResult ? (
          <ResultScreen result={lastResult} onRestart={resetGame} />
        ) : settings.mode === 'custom' && !customText.trim() && !isLoading ? (
          <div className="custom-empty-state">
            {t('customEmptyHint')}
          </div>
        ) : (
          <TypingArea
            words={words}
            typedText={typedText}
            currentWordIndex={currentWordIndex}
            wpm={wpm}
            accuracy={accuracy}
            timeLeft={timeLeft}
            isLoading={isLoading}
            isTyping={isTyping}
            progress={progress}
            quoteAuthor={quoteAuthor}
            codeLanguage={codeLanguage}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
          />
        )}

      </div>
    </main>
  );
}

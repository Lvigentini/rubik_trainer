import { useState } from 'react';
import type { SelfCheck } from '../selfChecks';
import { checkAnswer } from '../selfChecks';

type Props = {
  selfCheck: SelfCheck;
  onPractice?: () => void;
  onResult?: (correct: boolean) => void;
  allowRetry?: boolean;
};

export function SelfCheckCard({ selfCheck, onPractice, onResult, allowRetry }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  const isCorrect = selected ? checkAnswer(selfCheck, [selected]) : false;
  const selectedOption = selfCheck.options.find((o) => o.id === selected);

  function handleSelect(optionId: string) {
    if (answered) return;
    setSelected(optionId);
    setAnswered(true);
    onResult?.(checkAnswer(selfCheck, [optionId]));
  }

  return (
    <div className="self-check-card" data-testid="self-check-card">
      <h4 className="self-check-prompt">{selfCheck.prompt}</h4>
      <div className="self-check-options">
        {selfCheck.options.map((option) => (
          <button
            key={option.id}
            className={`self-check-option ${answered && option.id === selected ? (isCorrect ? 'correct' : 'incorrect') : ''} ${answered && selfCheck.answerIds.includes(option.id) ? 'correct-answer' : ''}`}
            onClick={() => handleSelect(option.id)}
            disabled={answered}
            aria-pressed={option.id === selected}
          >
            {option.label}
          </button>
        ))}
      </div>
      {answered && selectedOption && (
        <div className={`self-check-feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
          <p>{selectedOption.explanation}</p>
          {isCorrect && onPractice && (
            <button className="primary" onClick={onPractice}>Practise this skill</button>
          )}
          {!isCorrect && allowRetry && (
            <button onClick={() => { setSelected(null); setAnswered(false); }}>Try again</button>
          )}
        </div>
      )}
    </div>
  );
}

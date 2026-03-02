interface Props {
  correct: boolean;
  correctName: string;
}

export function FeedbackBanner({ correct, correctName }: Props) {
  return (
    <div
      role="alert"
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm
        ${correct
          ? 'bg-green-100 border border-green-400 text-green-800'
          : 'bg-red-100 border border-red-400 text-red-800'
        }
      `}
    >
      <span className="text-xl" aria-hidden>
        {correct ? '✓' : '✗'}
      </span>
      <span>
        {correct
          ? 'Correct!'
          : <>Wrong — the correct answer was <strong>{correctName}</strong>.</>
        }
      </span>
    </div>
  );
}

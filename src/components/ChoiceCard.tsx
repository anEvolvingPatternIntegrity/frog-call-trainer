import type { Species } from '../types';

type CardState = 'default' | 'selected-correct' | 'selected-wrong' | 'revealed-correct' | 'locked';

interface Props {
  species: Species;
  state: CardState;
  onClick?: () => void;
  disabled?: boolean;
}

export function ChoiceCard({ species, state, onClick, disabled }: Props) {
  const base = 'w-full text-left px-4 py-3 rounded-lg border-2 font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 min-h-[56px]';

  const styles: Record<CardState, string> = {
    default: 'border-gray-200 bg-white hover:border-green-400 hover:bg-green-50 focus:ring-green-400 cursor-pointer',
    'selected-correct': 'border-green-500 bg-green-50 text-green-800 cursor-default focus:ring-green-400',
    'selected-wrong': 'border-red-400 bg-red-50 text-red-800 cursor-default focus:ring-red-400',
    'revealed-correct': 'border-green-400 bg-green-50 text-green-700 cursor-default focus:ring-green-400',
    locked: 'border-gray-100 bg-gray-50 text-gray-400 cursor-default focus:ring-gray-300',
  };

  const icon = state === 'selected-correct'
    ? '✓ '
    : state === 'selected-wrong'
    ? '✗ '
    : state === 'revealed-correct'
    ? '✓ '
    : '';

  return (
    <button
      onClick={onClick}
      disabled={disabled || state !== 'default'}
      className={`${base} ${styles[state]}`}
      aria-pressed={state === 'selected-correct' || state === 'selected-wrong'}
    >
      <span className="block text-sm leading-tight">
        {icon}<strong>{species.commonName}</strong>
      </span>
      <span className="block text-xs text-gray-500 italic mt-0.5">{species.scientificName}</span>
    </button>
  );
}

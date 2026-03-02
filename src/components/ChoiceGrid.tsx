import type { Species } from '../types';
import { ChoiceCard } from './ChoiceCard';

interface Props {
  choices: Species[];
  correctId: string;
  selectedId: string | null;
  isAnswered: boolean;
  onSelect: (id: string) => void;
}

export function ChoiceGrid({ choices, correctId, selectedId, isAnswered, onSelect }: Props) {
  function getState(species: Species) {
    if (!isAnswered) return 'default' as const;
    if (species.id === selectedId) {
      return species.id === correctId ? 'selected-correct' as const : 'selected-wrong' as const;
    }
    if (species.id === correctId) return 'revealed-correct' as const;
    return 'locked' as const;
  }

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 gap-2"
      role="group"
      aria-label="Species choices"
    >
      {choices.map((species) => (
        <ChoiceCard
          key={species.id}
          species={species}
          state={getState(species)}
          onClick={() => onSelect(species.id)}
          disabled={isAnswered}
        />
      ))}
    </div>
  );
}

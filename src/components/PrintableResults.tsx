import type { Answer, Species } from '../types';

interface Props {
  testerName?: string;
  hostName?: string;
  answers: Answer[];
  allSpecies: Species[];
  date: string;
}

export function PrintableResults({ testerName, hostName, answers, allSpecies, date }: Props) {
  const score = answers.filter((a) => a.correct).length;
  const total = answers.length;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;

  function resolveSpeciesName(id: string | null): string {
    if (!id) return '(no answer)';
    return allSpecies.find((s) => s.id === id)?.commonName ?? id;
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-6">
      {/* Header */}
      <div className="mb-6 border-b border-gray-300 pb-4">
        <h1 className="text-2xl font-bold text-gray-800">Frog Call Quiz Results</h1>
        <div className="mt-2 grid grid-cols-2 gap-1 text-sm text-gray-600">
          {testerName && <div><span className="font-medium">Name:</span> {testerName}</div>}
          {hostName && <div><span className="font-medium">Hosted by:</span> {hostName}</div>}
          <div><span className="font-medium">Date:</span> {date}</div>
          <div>
            <span className="font-medium">Score:</span>{' '}
            <span className={`font-bold ${pct >= 80 ? 'text-green-700' : pct >= 60 ? 'text-yellow-700' : 'text-red-700'}`}>
              {score}/{total} ({pct}%)
            </span>
          </div>
        </div>
      </div>

      {/* Results table */}
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="px-3 py-2 border border-gray-300 w-8">#</th>
            <th className="px-3 py-2 border border-gray-300">Your Answer</th>
            <th className="px-3 py-2 border border-gray-300">Correct Answer</th>
            <th className="px-3 py-2 border border-gray-300 w-10 text-center">Result</th>
          </tr>
        </thead>
        <tbody>
          {answers.map((answer, i) => {
            const correct = answer.correct;
            const correctName = answer.question.species.commonName;
            const selectedName = resolveSpeciesName(answer.selectedId);

            return (
              <tr key={i} className={correct ? 'bg-green-50' : 'bg-red-50'}>
                <td className="px-3 py-2 border border-gray-300 text-center font-mono">{i + 1}</td>
                <td className="px-3 py-2 border border-gray-300">{selectedName}</td>
                <td className="px-3 py-2 border border-gray-300 font-medium">{correctName}</td>
                <td className="px-3 py-2 border border-gray-300 text-center text-base">
                  {correct ? '✓' : '✗'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

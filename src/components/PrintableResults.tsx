import { useEffect, useRef, useState } from 'react';
import type { Answer, Species } from '../types';

interface Props {
  testerName?: string;
  hostName?: string;
  answers: Answer[];
  allSpecies: Species[];
  date: string;
}

function SpeakerButton({ file }: { file: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = new Audio(`/audio/${file}`);
    audio.addEventListener('ended', () => setIsPlaying(false));
    audio.addEventListener('pause', () => setIsPlaying(false));
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [file]);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.currentTime = 0;
      audio.play().catch(() => {});
      setIsPlaying(true);
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={isPlaying ? 'Pause' : 'Play sample'}
      className="no-print ml-1.5 inline-flex items-center justify-center w-6 h-6 rounded-full text-gray-500 hover:text-green-700 hover:bg-green-100 transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 align-middle"
    >
      {isPlaying ? <PauseIcon /> : <SpeakerIcon />}
    </button>
  );
}

function SpeakerIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
    </svg>
  );
}

export function PrintableResults({ testerName, hostName, answers, allSpecies, date }: Props) {
  const score = answers.filter((a) => a.correct).length;
  const total = answers.length;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;

  function resolveSpecies(id: string | null): Species | undefined {
    if (!id) return undefined;
    return allSpecies.find((s) => s.id === id);
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-6">
      {/* Header */}
      <div className="mb-6 border-b border-gray-300 pb-4">
        <h1 className="text-2xl font-bold text-gray-800">Frog Call Test Results</h1>
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
            const correctSpecies = answer.question.species;
            const selectedSpecies = resolveSpecies(answer.selectedId);
            const selectedName = selectedSpecies?.commonName ?? (answer.selectedId ? answer.selectedId : '(no answer)');

            return (
              <tr key={i} className={correct ? 'bg-green-50' : 'bg-red-50'}>
                <td className="px-3 py-2 border border-gray-300 text-center font-mono">{i + 1}</td>
                <td className="px-3 py-2 border border-gray-300">
                  {selectedName}
                  {!correct && selectedSpecies?.audio[0] && (
                    <SpeakerButton file={selectedSpecies.audio[0].file} />
                  )}
                </td>
                <td className="px-3 py-2 border border-gray-300 font-medium">
                  {correctSpecies.commonName}
                  {!correct && correctSpecies.audio[0] && (
                    <SpeakerButton file={correctSpecies.audio[0].file} />
                  )}
                </td>
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

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { QuizMode } from '../types';
import { REGIONS } from '../data';
import { useQuiz } from '../hooks/useQuiz';
import { AudioPlayer } from '../components/AudioPlayer';
import { ChoiceGrid } from '../components/ChoiceGrid';
import { FeedbackBanner } from '../components/FeedbackBanner';
import { SpeciesReveal } from '../components/SpeciesReveal';
import { AttributionFooter } from '../components/AttributionFooter';

export function QuizPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const regionId = searchParams.get('region') ?? REGIONS[0]?.id ?? '';
  const modeParam = searchParams.get('mode');
  const hostName = searchParams.get('host') ?? undefined;
  const mode: QuizMode = modeParam === 'test' ? 'test' : 'training';

  const region = REGIONS.find((r) => r.id === regionId) ?? REGIONS[0];

  // Test mode: collect tester name before starting
  const [testerName, setTesterName] = useState('');
  const [quizStarted, setQuizStarted] = useState(mode === 'training');

  const {
    session,
    currentQuestion,
    currentAnswer,
    choiceOrder,
    isAnswered,
    isComplete,
    score,
    submitAnswer,
    nextQuestion,
    getAnotherSample,
    restart,
  } = useQuiz(region!, mode, hostName, quizStarted ? testerName : undefined);

  // Name entry form for test mode
  if (!quizStarted && mode === 'test') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Frog Call Quiz
              {hostName && <span className="block text-sm font-normal text-gray-500 mt-0.5">Hosted by {hostName}</span>}
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              You'll hear {region!.species.length} calls and identify each species — no feedback until the end.
            </p>
          </div>
          <div>
            <label htmlFor="tester-name" className="block text-sm font-medium text-gray-700 mb-1">
              Your name
            </label>
            <input
              id="tester-name"
              type="text"
              value={testerName}
              onChange={(e) => setTesterName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && testerName.trim()) setQuizStarted(true); }}
              placeholder="Enter your name"
              autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          <button
            onClick={() => setQuizStarted(true)}
            disabled={!testerName.trim()}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl text-base transition-colors focus:outline-none focus:ring-4 focus:ring-green-400 disabled:opacity-50"
          >
            Begin Quiz
          </button>
        </div>
      </div>
    );
  }

  // Quiz complete — training mode inline summary
  if (isComplete && mode === 'training') {
    const total = session.questions.length;
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center space-y-4">
          <div className="text-5xl">🐸</div>
          <h2 className="text-2xl font-bold text-gray-800">Quiz Complete!</h2>
          <p className="text-4xl font-bold text-green-700">{score}/{total}</p>
          <p className="text-gray-500">{pct}% correct</p>
          <div className="flex flex-col gap-2 mt-4">
            <button
              onClick={restart}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors focus:outline-none focus:ring-4 focus:ring-green-400"
            >
              Start Over
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz complete — test mode: navigate to results
  if (isComplete && mode === 'test') {
    navigate('/results', { state: { session } });
    return null;
  }

  if (!currentQuestion || !region) {
    return null;
  }

  const total = session.questions.length;
  const questionNum = session.currentIndex + 1;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-100 flex flex-col">
      {/* Nav */}
      <header className="bg-green-800 text-white px-6 py-3 flex items-center justify-between shadow-md">
        <button
          onClick={() => navigate('/')}
          className="text-green-200 hover:text-white text-sm underline focus:outline-none focus:ring-2 focus:ring-white rounded"
        >
          ← Home
        </button>
        <span className="text-sm font-medium">
          {region.name}
          {mode === 'test' && hostName && ` — ${hostName}`}
        </span>
      </header>

      <main className="flex-1 flex justify-center p-4 sm:p-6">
        <div className="w-full max-w-2xl space-y-5">
          {/* Progress */}
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-green-100 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((session.currentIndex) / total) * 100}%` }}
              />
            </div>
            <span className="text-sm text-gray-600 whitespace-nowrap font-medium">
              Question {questionNum} of {total}
            </span>
          </div>

          {/* Audio card */}
          <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-6 flex flex-col items-center gap-3">
            <p className="text-sm text-gray-500 font-medium">Listen and identify the call</p>
            <AudioPlayer
              audioFile={currentQuestion.audioFile}
              showAnotherSample={mode === 'training'}
              hasMultipleSamples={currentQuestion.species.audio.length > 1}
              onAnotherSample={getAnotherSample}
            />
          </div>

          {/* Choices */}
          <ChoiceGrid
            choices={choiceOrder}
            correctId={currentQuestion.species.id}
            selectedId={currentAnswer?.selectedId ?? null}
            isAnswered={isAnswered}
            onSelect={submitAnswer}
          />

          {/* Training mode: feedback + reveal */}
          {mode === 'training' && isAnswered && currentAnswer && (
            <div className="space-y-3">
              <FeedbackBanner
                correct={currentAnswer.correct}
                correctName={currentQuestion.species.commonName}
              />
              <SpeciesReveal species={currentQuestion.species} />
            </div>
          )}

          {/* Next button (shown after answering) */}
          {isAnswered && (
            <button
              onClick={nextQuestion}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl text-base transition-colors focus:outline-none focus:ring-4 focus:ring-green-400"
            >
              {session.currentIndex < total - 1 ? 'Next Question →' : mode === 'test' ? 'See Results' : 'See Score'}
            </button>
          )}
        </div>
      </main>

      <AttributionFooter
        audio={currentQuestion.audioFile}
        photos={
          mode === 'training' && isAnswered && currentQuestion.species.photos[0]
            ? [{ speciesName: currentQuestion.species.commonName, credit: currentQuestion.species.photos[0] }]
            : []
        }
      />
    </div>
  );
}

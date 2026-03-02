import { useCallback, useMemo, useState } from 'react';
import type { Answer, Question, QuizMode, QuizSession, Region } from '../types';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestions(region: Region): Question[] {
  const shuffledSpecies = shuffle(region.species);
  return shuffledSpecies.map((species) => {
    const audioFile = species.audio[Math.floor(Math.random() * species.audio.length)]!;
    return { species, audioFile };
  });
}

export function useQuiz(region: Region, mode: QuizMode, hostName?: string, testerName?: string) {
  const initialQuestions = useMemo(() => buildQuestions(region), [region]);

  const [session, setSession] = useState<QuizSession>({
    mode,
    hostName,
    testerName,
    region,
    questions: initialQuestions,
    currentIndex: 0,
    answers: [],
  });

  // The display order of choices (shuffled once per session, stable)
  const choiceOrder = useMemo(() => shuffle(region.species), [region]);

  const currentQuestion = session.questions[session.currentIndex] ?? null;
  const currentAnswer = session.answers[session.currentIndex] ?? null;
  const isAnswered = currentAnswer !== null;
  const isComplete = session.currentIndex >= session.questions.length && session.answers.length === session.questions.length;

  const submitAnswer = useCallback((selectedId: string) => {
    setSession((prev) => {
      if (prev.answers[prev.currentIndex]) return prev; // already answered
      const question = prev.questions[prev.currentIndex];
      if (!question) return prev;
      const answer: Answer = {
        question,
        selectedId,
        correct: selectedId === question.species.id,
      };
      const newAnswers = [...prev.answers];
      newAnswers[prev.currentIndex] = answer;
      return { ...prev, answers: newAnswers };
    });
  }, []);

  const nextQuestion = useCallback(() => {
    setSession((prev) => {
      if (prev.currentIndex >= prev.questions.length - 1) {
        // Move past the last question to signal completion
        return { ...prev, currentIndex: prev.questions.length };
      }
      return { ...prev, currentIndex: prev.currentIndex + 1 };
    });
  }, []);

  const getAnotherSample = useCallback(() => {
    setSession((prev) => {
      const question = prev.questions[prev.currentIndex];
      if (!question || question.species.audio.length <= 1) return prev;

      // Pick a different audio file
      const currentFile = question.audioFile.file;
      const others = question.species.audio.filter((a) => a.file !== currentFile);
      const nextAudio = others[Math.floor(Math.random() * others.length)]!;

      const newQuestions = [...prev.questions];
      newQuestions[prev.currentIndex] = { ...question, audioFile: nextAudio };
      return { ...prev, questions: newQuestions };
    });
  }, []);

  const restart = useCallback(() => {
    setSession({
      mode,
      hostName,
      testerName,
      region,
      questions: buildQuestions(region),
      currentIndex: 0,
      answers: [],
    });
  }, [mode, hostName, testerName, region]);

  const score = session.answers.filter((a) => a.correct).length;

  return {
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
  };
}

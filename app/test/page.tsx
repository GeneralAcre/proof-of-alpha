"use client";

import { useState } from "react";
import Link from "next/link";
import { Nav } from "../components/Nav";

type Option = { label: string; points: number };
type Question = { scenario: string; question: string; options: Option[] };

const QUESTIONS: Question[] = [
  {
    scenario: "You're at a coffee shop. A girl across the room makes eye contact and smiles.",
    question: "What do you do?",
    options: [
      { label: "Immediately look down at my phone", points: 4 },
      { label: "Smile back then look away", points: 2 },
      { label: "Hold eye contact and nod", points: 1 },
      { label: "Walk over and say hi", points: 0 },
    ],
  },
  {
    scenario: "You're texting a girl you like. She replies with just 'lol'.",
    question: "Your next move?",
    options: [
      { label: "Send 3 more messages to keep it going", points: 4 },
      { label: "Ask 'are you okay?' because maybe she's upset", points: 3 },
      { label: "Reply with something short and chill", points: 1 },
      { label: "Leave her on read — she can do better", points: 0 },
    ],
  },
  {
    scenario: "You finally approach a girl at a party. She says 'I have a boyfriend.'",
    question: "How do you respond?",
    options: [
      { label: "Apologize 4 times and run to the bathroom", points: 4 },
      { label: "Say 'oh… okay…' and slowly back away", points: 3 },
      { label: "'Cool, I was just being friendly' and exit clean", points: 1 },
      { label: "Laugh it off and keep the convo going normally", points: 0 },
    ],
  },
  {
    scenario: "You're about to approach someone you find really attractive. Your heart is racing.",
    question: "What happens?",
    options: [
      { label: "I walk past her and go home and overthink it for 3 days", points: 4 },
      { label: "I wait for the 'perfect moment' that never comes", points: 3 },
      { label: "I take a breath and walk over after a minute", points: 1 },
      { label: "I go immediately — waiting makes it worse", points: 0 },
    ],
  },
  {
    scenario: "She asks what you do for fun. You work and play games mostly.",
    question: "What do you say?",
    options: [
      { label: "'Nothing really…' and stare at the floor", points: 4 },
      { label: "Give a boring 1-sentence answer and go quiet", points: 3 },
      { label: "Answer honestly and ask what she does", points: 1 },
      { label: "Make it sound interesting and flip it back to her", points: 0 },
    ],
  },
  {
    scenario: "She invites you to hang with her friend group for the first time.",
    question: "How does it go?",
    options: [
      { label: "I cancel last minute — too much pressure", points: 4 },
      { label: "I show up and barely talk to anyone", points: 3 },
      { label: "I'm a bit quiet but have a few good conversations", points: 1 },
      { label: "I end up being the most fun person there", points: 0 },
    ],
  },
];

type Result = {
  title: string;
  tag: string;
  desc: string;
  color: string;
};

function getResult(score: number): Result {
  if (score >= 20) return {
    title: "Wall Hugger",
    tag: "High Anxiety",
    desc: "You're letting fear run the whole show. You've got something to offer — fear is just a habit you haven't broken yet. Start small: make eye contact, hold it for 2 seconds, move on. That's the rep.",
    color: "#a09ab8",
  };
  if (score >= 14) return {
    title: "The Overthinker",
    tag: "Paralysis Mode",
    desc: "You know what to do, you just wait too long and talk yourself out of it. The moment you start analyzing, you've already lost momentum. Act first. Think after.",
    color: "#a09ab8",
  };
  if (score >= 7) return {
    title: "Almost There",
    tag: "Warming Up",
    desc: "You can hold a conversation, but nerves still cost you. You're not scared — you're just not used to this yet. A few more reps and the hesitation disappears. Keep going.",
    color: "#E4D474",
  };
  return {
    title: "Sigma Mode",
    tag: "Natural",
    desc: "You're not trying to impress anyone — you're just showing up as yourself. That's the whole game. You move with intention, keep your cool, and let her come to you. Rare.",
    color: "#E4D474",
  };
}

export default function TestPage() {
  const [started,   setStarted]   = useState(false);
  const [current,   setCurrent]   = useState(0);
  const [score,     setScore]     = useState(0);
  const [chosen,    setChosen]    = useState<number | null>(null);
  const [finished,  setFinished]  = useState(false);
  const [answers,   setAnswers]   = useState<number[]>([]);

  function handleSelect(idx: number) {
    if (chosen !== null) return;
    setChosen(idx);
  }

  function handleNext() {
    if (chosen === null) return;
    const pts = QUESTIONS[current].options[chosen].points;
    const newScore = score + pts;
    const newAnswers = [...answers, chosen];
    setScore(newScore);
    setAnswers(newAnswers);
    setChosen(null);

    if (current + 1 >= QUESTIONS.length) {
      setFinished(true);
    } else {
      setCurrent((c) => c + 1);
    }
  }

  function reset() {
    setStarted(false);
    setCurrent(0);
    setScore(0);
    setChosen(null);
    setFinished(false);
    setAnswers([]);
  }

  const result = getResult(score);
  const progress = ((current + (chosen !== null ? 1 : 0)) / QUESTIONS.length) * 100;

  return (
    <div className="min-h-screen bg-[#24153E] text-[#E4D474]">
      <Nav />
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">

        {/* ── INTRO ── */}
        {!started && !finished && (
          <div className="space-y-8">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#a09ab8]">Rizz Diagnostic</p>
              <h1 className="mt-2 text-5xl font-black uppercase sm:text-6xl">How Do You<br />Talk To Women?</h1>
              <p className="mt-4 font-mono text-sm leading-6 text-[#a09ab8]">
                6 real scenarios. Pick what you'd actually do — not what sounds good.
                No filter. We'll tell you exactly where you're at.
              </p>
            </div>

            <div className="border border-[#a09ab8]/30 bg-[#2d1a4a] divide-y divide-[#a09ab8]/20">
              {[
                { label: "Questions",  value: "6 scenarios" },
                { label: "Time",       value: "~2 minutes" },
                { label: "Result",     value: "4 archetypes" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-5 py-3.5">
                  <span className="font-mono text-xs uppercase tracking-[0.14em] text-[#a09ab8]">{label}</span>
                  <span className="font-mono text-xs font-black text-[#E4D474]">{value}</span>
                </div>
              ))}
            </div>

            <button
              className="w-full border-2 border-[#E4D474] bg-[#E4D474] py-4 font-mono text-sm font-black uppercase tracking-[0.2em] text-[#24153E] shadow-[6px_6px_0_#a09ab8] transition hover:bg-transparent hover:text-[#E4D474]"
              onClick={() => setStarted(true)}
              type="button"
            >
              Start Test
            </button>
          </div>
        )}

        {/* ── QUESTIONS ── */}
        {started && !finished && (
          <div className="space-y-8">

            {/* Progress */}
            <div>
              <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-[#a09ab8]">
                <span>Question {current + 1} of {QUESTIONS.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1 w-full bg-[#a09ab8]/20">
                <div
                  className="h-full bg-[#E4D474] transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Scenario */}
            <div className="border-l-2 border-[#a09ab8]/40 pl-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#a09ab8]">Scenario</p>
              <p className="mt-2 text-sm leading-6 text-[#ffffff]">{QUESTIONS[current].scenario}</p>
            </div>

            {/* Question */}
            <div>
              <p className="text-2xl font-black uppercase sm:text-3xl">{QUESTIONS[current].question}</p>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {QUESTIONS[current].options.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelect(i)}
                  className={`w-full border px-5 py-4 text-left transition touch-manipulation ${
                    chosen === i
                      ? "border-[#E4D474] bg-[#E4D474]/10 text-[#E4D474]"
                      : chosen !== null
                      ? "border-[#a09ab8]/20 text-[#a09ab8]/40 cursor-default"
                      : "border-[#a09ab8]/40 text-[#ffffff] hover:border-[#E4D474] hover:text-[#E4D474]"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className={`mt-px shrink-0 font-mono text-[10px] font-black uppercase ${chosen === i ? "text-[#E4D474]" : "text-[#a09ab8]/50"}`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="font-mono text-sm leading-5">{opt.label}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Next */}
            <button
              type="button"
              disabled={chosen === null}
              onClick={handleNext}
              className="w-full border-2 border-[#E4D474] bg-[#E4D474] py-4 font-mono text-sm font-black uppercase tracking-[0.18em] text-[#24153E] shadow-[4px_4px_0_#a09ab8] transition hover:bg-transparent hover:text-[#E4D474] disabled:border-[#a09ab8]/30 disabled:bg-transparent disabled:text-[#a09ab8]/30 disabled:shadow-none"
            >
              {current + 1 === QUESTIONS.length ? "See Result" : "Next"}
            </button>
          </div>
        )}

        {/* ── RESULT ── */}
        {finished && (
          <div className="space-y-8">

            {/* Score header */}
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#a09ab8]">Your Result</p>
              <h1 className="mt-2 text-5xl font-black uppercase sm:text-6xl" style={{ color: result.color }}>
                {result.title}
              </h1>
              <span className="mt-2 inline-block border border-[#a09ab8]/40 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#a09ab8]">
                {result.tag}
              </span>
            </div>

            {/* Description */}
            <div className="border border-[#a09ab8]/30 bg-[#2d1a4a] p-6 shadow-[4px_4px_0_#a09ab8]">
              <p className="font-mono text-sm leading-7 text-[#ffffff]">{result.desc}</p>
            </div>

            {/* Score breakdown */}
            <div className="border border-[#a09ab8]/30 bg-[#160c2c]">
              <div className="border-b border-[#a09ab8]/20 px-5 py-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#a09ab8]">Score Breakdown</p>
              </div>
              {QUESTIONS.map((q, i) => {
                const chosen = answers[i];
                const opt    = q.options[chosen];
                return (
                  <div key={i} className="flex items-start gap-4 border-b border-[#a09ab8]/10 px-5 py-3 last:border-0">
                    <span className="shrink-0 font-mono text-[10px] text-[#a09ab8]/50 mt-0.5">Q{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs text-[#a09ab8] truncate">{opt?.label}</p>
                    </div>
                    <span className={`shrink-0 font-mono text-xs font-black ${opt?.points === 0 ? "text-[#E4D474]" : opt?.points <= 1 ? "text-[#E4D474]/70" : "text-[#a09ab8]"}`}>
                      {opt?.points === 0 ? "Clean" : opt?.points <= 1 ? "Decent" : opt?.points <= 3 ? "Nervous" : "Scared"}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/character-select"
                className="flex-1 border-2 border-[#E4D474] bg-[#E4D474] py-4 text-center font-mono text-sm font-black uppercase tracking-[0.18em] text-[#24153E] shadow-[4px_4px_0_#a09ab8] transition hover:bg-transparent hover:text-[#E4D474]"
              >
                Practice in Game
              </Link>
              <button
                type="button"
                onClick={reset}
                className="flex-1 border border-[#a09ab8]/40 py-4 font-mono text-sm uppercase tracking-[0.14em] text-[#a09ab8] transition hover:border-[#E4D474] hover:text-[#E4D474]"
              >
                Retake Test
              </button>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}

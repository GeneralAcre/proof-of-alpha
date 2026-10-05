"use client";

import { useState } from "react";

const QUESTIONS = [
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
    scenario: "You're about to approach someone you find really attractive.",
    question: "What happens?",
    options: [
      { label: "I walk past and go home to overthink it for 3 days", points: 4 },
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

function getResult(score: number) {
  if (score >= 20) return {
    title: "Wall Hugger",
    tag: "High Anxiety",
    desc: "Fear is running the whole show. Start small — make eye contact, hold it 2 seconds, move on. That's the rep.",
    color: "#716a7e",
  };
  if (score >= 14) return {
    title: "The Overthinker",
    tag: "Paralysis Mode",
    desc: "You know what to do, you just talk yourself out of it. Act first. Think after.",
    color: "#716a7e",
  };
  if (score >= 7) return {
    title: "Almost There",
    tag: "Warming Up",
    desc: "You can hold a conversation but nerves still cost you. A few more reps and the hesitation disappears.",
    color: "#5e548e",
  };
  return {
    title: "Sigma Mode",
    tag: "Natural",
    desc: "You move with intention, keep your cool, and let her come to you. Rare.",
    color: "#5e548e",
  };
}

const STORAGE_KEY = "poa_rizz_test_done";

export function markRizzTestDone() {
  try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
}

export function hasSeenRizzTest(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) === "1"; } catch { return false; }
}

export function RizzTestModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState(0);
  const [score,   setScore]   = useState(0);
  const [chosen,  setChosen]  = useState<number | null>(null);
  const [done,    setDone]    = useState(false);

  function handleNext() {
    if (chosen === null) return;
    const pts = QUESTIONS[current].options[chosen].points;
    const newScore = score + pts;
    setScore(newScore);
    setChosen(null);
    if (current + 1 >= QUESTIONS.length) {
      setDone(true);
    } else {
      setCurrent((c) => c + 1);
    }
  }

  function handleClose() {
    markRizzTestDone();
    onClose();
  }

  const result   = getResult(score);
  const progress = ((current + (chosen !== null ? 1 : 0)) / QUESTIONS.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000]/70 backdrop-blur-sm">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto border border-[#ddd6ea] bg-[#f8f7fc] shadow-[8px_8px_0_#f3f0fa]">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#ddd6ea]/30 bg-[#f8f7fc] px-5 py-4">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#716a7e]">Quick Diagnostic</p>
            <p className="font-mono text-sm font-black uppercase text-[#5e548e]">How Do You Talk To Women?</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="border border-[#ddd6ea]/40 px-3 py-1 font-mono text-[10px] font-black uppercase tracking-[0.15em] text-[#5e548e] transition hover:border-[#5e548e]"
          >
            Skip
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* Questions */}
          {!done && (
            <>
              {/* Progress */}
              <div>
                <div className="mb-1.5 flex justify-between font-mono text-xs font-black uppercase tracking-widest text-[#716a7e]">
                  <span>{current + 1} / {QUESTIONS.length}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-0.5 w-full bg-[#716a7e]/20">
                  <div className="h-full bg-[#5e548e] transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>

              {/* Scenario */}
              <div className="border-l-2 border-[#ddd6ea]/30 pl-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#716a7e]">Scenario</p>
                <p className="mt-1 text-sm leading-6 text-[#231942]">{QUESTIONS[current].scenario}</p>
              </div>

              <p className="text-xl font-black uppercase text-[#5e548e]">{QUESTIONS[current].question}</p>

              {/* Options */}
              <div className="space-y-2">
                {QUESTIONS[current].options.map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setChosen(i)}
                    className={`w-full border px-4 py-3 text-left transition touch-manipulation ${
                      chosen === i
                        ? "border-[#5e548e] bg-[#5e548e]/10 text-[#5e548e]"
                        : "border-[#ddd6ea]/30 text-[#231942] hover:border-[#5e548e] hover:text-[#5e548e]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="shrink-0 font-mono text-[9px] font-black text-[#716a7e]/50 mt-0.5">{String.fromCharCode(65 + i)}</span>
                      <span className="font-mono text-xs leading-5">{opt.label}</span>
                    </div>
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={chosen === null}
                onClick={handleNext}
                className="w-full border-2 border-[#5e548e] bg-[#5e548e] py-3 font-mono text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-transparent hover:text-[#5e548e] disabled:border-[#ddd6ea]/20 disabled:bg-transparent disabled:text-[#716a7e]/20"
              >
                {current + 1 === QUESTIONS.length ? "See Result" : "Next"}
              </button>
            </>
          )}

          {/* Result */}
          {done && (
            <>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#716a7e]">Your Result</p>
                <h2 className="mt-1 text-4xl font-black uppercase" style={{ color: result.color }}>{result.title}</h2>
                <span className="mt-1 inline-block border border-[#ddd6ea]/30 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-[#716a7e]">
                  {result.tag}
                </span>
              </div>

              <div className="border border-[#ddd6ea]/30 bg-white p-4">
                <p className="font-mono text-sm leading-6 text-[#231942]">{result.desc}</p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 border-2 border-[#5e548e] bg-[#5e548e] py-3 font-mono text-xs font-black uppercase tracking-widest text-white transition hover:bg-transparent hover:text-[#5e548e]"
                >
                  Play Game
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="border border-[#ddd6ea]/30 px-5 py-3 font-mono text-xs uppercase text-[#716a7e] transition hover:border-[#5e548e] hover:text-[#5e548e]"
                >
                  Close
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export type ScenarioCategory = "anniversary" | "trip" | "conflict" | "daily" | "special";
export type ScenarioDifficulty = "easy" | "medium" | "hard";
export type ScenarioCloser = "own-it" | "play-it-cool" | "sidestep";

export type Scenario = {
  id: string;
  title: string;
  subtitle: string;
  category: ScenarioCategory;
  difficulty: ScenarioDifficulty;
  approachCost: number;
  ownItWin: number;     // AURA for "own-it" win (direct accountability)
  coolWin: number;      // AURA for "play-it-cool" win (graceful)
  setup: string;        // Situation briefing shown to player
  tips: string[];       // What works
  pitfalls: string[];   // What fails
  chatPrompt: string;   // LLM system prompt
};

export const SCENARIOS: readonly Scenario[] = [

  // ── EASY ──────────────────────────────────────────────────────────────────

  {
    id: "date-night-panic",
    title: "Date Night Panic",
    subtitle: "She asked what's the plan. You have none.",
    category: "daily",
    difficulty: "easy",
    approachCost: 5,
    ownItWin: 20,
    coolWin: 12,
    setup: "It's 5pm Friday. She just texted: 'Sooo what are we doing tonight? 👀' You made zero plans. You have 4 messages to pull something together.",
    tips: ["Name a specific place or activity", "Show you know what she enjoys", "Be decisive — don't ask her to decide"],
    pitfalls: ["'I don't know, what do you want to do?'", "Vague non-answers", "Suggesting somewhere you've both complained about"],
    chatPrompt: `You are playing a girlfriend who just asked your boyfriend what the plan is for tonight. He hasn't made any plans. You're not angry — yet — but you're watching how he handles this. You want him to be decisive and show he thought about you.

SCORING:
+7 to +10: names a specific place/activity, explains why you'd love it, shows initiative
+3 to +6: has something in mind, not totally clueless, somewhat specific
0 to +2: vague but not offensive, no plan but trying
-3 to -6: "I don't know, what do you want?" or "whatever you want babe"
-7 to -10: completely ignores the question, suggests somewhere you both hate, makes it her problem

Reply in 1-2 sentences as the girlfriend reacting to his response. New line: [SCORE: X]`,
  },

  {
    id: "cold-texts",
    title: "The Cold Text",
    subtitle: "One-word answers for two hours straight.",
    category: "conflict",
    difficulty: "easy",
    approachCost: 5,
    ownItWin: 20,
    coolWin: 12,
    setup: "She's been replying with 'ok', 'sure', 'yeah' for the last two hours. Something's off. You have 4 messages to figure out what's wrong without making it worse.",
    tips: ["Acknowledge you notice something's off", "Ask gently, not accusingly", "Don't demand an answer — create space"],
    pitfalls: ["'Are you mad at me?'", "Ignoring the obvious", "Listing everything you think you did wrong"],
    chatPrompt: `You are playing a girlfriend who is clearly bothered by something but hasn't said what yet. You've been giving one-word answers. You're not trying to start a fight — you just want him to notice and ask properly. You don't want to be interrogated; you want to feel like he cares.

SCORING:
+7 to +10: notices and asks gently with genuine care, creates space without pressure, doesn't assume or project
+3 to +6: asks if you're okay in a non-defensive way, shows he's paying attention
0 to +2: neutral check-in, not great but not offensive
-3 to -6: "are you mad at me?" in a needy way, immediately defensive, lists his excuses
-7 to -10: ignores it completely, "you're being weird", starts listing things he did wrong unprompted

Reply in 1-2 sentences as the girlfriend. Warm up slightly if the score is positive. New line: [SCORE: X]`,
  },

  {
    id: "weekend-trip",
    title: "Trip Suggestion",
    subtitle: "'You choose where we go this weekend.'",
    category: "trip",
    difficulty: "easy",
    approachCost: 5,
    ownItWin: 20,
    coolWin: 12,
    setup: "She says: 'You pick where we go this weekend — somewhere fun.' She means it. She's tired of deciding everything. You have 4 messages to pitch a destination she'll actually be excited about.",
    tips: ["Commit to a specific place", "Explain what makes it good for her", "Show you thought about what she likes"],
    pitfalls: ["'Wherever you want babe'", "Suggesting your favorite place with no thought about hers", "Being so vague it's still her decision"],
    chatPrompt: `You are playing a girlfriend who genuinely wants her boyfriend to pick a weekend destination. You're tired of always being the planner. You want him to commit to something specific and show he thought about what you'd enjoy — not just what he wants.

SCORING:
+7 to +10: names a specific place and explains why you'd love it based on your interests, sounds genuinely thought through
+3 to +6: has a real suggestion with some reasoning, not just his interests
0 to +2: vague but at least trying to decide
-3 to -6: "wherever you want" or somewhere clearly just for him
-7 to -10: turns the decision back to her, total non-answer, suggests something she's mentioned hating

Reply in 1-2 sentences as the girlfriend. New line: [SCORE: X]`,
  },

  // ── MEDIUM ────────────────────────────────────────────────────────────────

  {
    id: "forgotten-anniversary",
    title: "The Forgotten Anniversary",
    subtitle: "She texted first. You just realized.",
    category: "anniversary",
    difficulty: "medium",
    approachCost: 30,
    ownItWin: 80,
    coolWin: 50,
    setup: "It's 11:48pm. She sent 'Happy anniversary ❤️' two hours ago. You just saw it. You forgot completely. No dinner. No gift. Nothing planned. You have 4 messages to handle this.",
    tips: ["Acknowledge you forgot — don't pretend", "Pivot to making it right NOW, not tomorrow", "Make a real plan, not vague promises"],
    pitfalls: ["Pretending you were 'waiting to surprise her'", "'It's just a day'", "Saying 'I'll make it up to you' with no specifics"],
    chatPrompt: `You are playing a girlfriend who just realized her boyfriend forgot your anniversary. You're hurt but you're not looking for a fight — you're watching how he handles this. You can tell if he's making excuses or if he's genuinely stepping up. You want accountability and a real effort, not word salad.

SCORING:
+7 to +10: admits he forgot cleanly with no excuse, pivots to a specific real plan to make it right tonight or tomorrow, makes you feel like he means it
+3 to +6: acknowledges it somewhat, shows he cares even if clumsy, has some idea to make it right
0 to +2: tries but comes across weak, at least acknowledges the situation
-3 to -6: makes excuses, pretends he had something planned, vague "I'll make it up to you"
-7 to -10: "it's just a day", defensive, implies you're overreacting, no plan whatsoever

Reply in 1-2 sentences as the girlfriend. Let warmth creep in if the score is positive. New line: [SCORE: X]`,
  },

  {
    id: "im-fine",
    title: "I'm Fine",
    subtitle: "She's clearly not fine.",
    category: "conflict",
    difficulty: "medium",
    approachCost: 30,
    ownItWin: 80,
    coolWin: 50,
    setup: "She's been quiet all evening. You asked what's wrong. She said 'I'm fine.' The tone said otherwise. You have 4 messages to get through the wall without making it worse.",
    tips: ["Don't accept 'I'm fine' and move on", "Acknowledge what you observe without assuming", "Give her room to open up on her own terms"],
    pitfalls: ["'Ok if you say so'", "'You're clearly not fine' (accusatory)", "Immediately assuming it's your fault and listing apologies"],
    chatPrompt: `You are playing a girlfriend who said "I'm fine" but is clearly not fine. You're not ready to talk yet. You want to feel like he actually sees you and cares — without being interrogated or pressured. If he handles it right, you'll open up. If he dismisses you or makes it about him, you'll shut down further.

SCORING:
+7 to +10: gently acknowledges he can tell something's up, doesn't push but makes clear he's there, creates real space for you to open up
+3 to +6: tries to check in with actual care, doesn't just move on, shows he's paying attention
0 to +2: awkward but at least not making it worse
-3 to -6: accepts "I'm fine" at face value and moves on, or immediately makes it about himself
-7 to -10: "you're clearly not fine" accusatory, lists things he thinks he did wrong, pressures you to talk

Reply in 1-2 sentences as the girlfriend. If score is positive, hint that you might be ready to talk. New line: [SCORE: X]`,
  },

  {
    id: "meet-the-parents",
    title: "Meet The Parents",
    subtitle: "Dinner in 2 hours. She's quizzing you.",
    category: "special",
    difficulty: "medium",
    approachCost: 30,
    ownItWin: 80,
    coolWin: 50,
    setup: "You're meeting her parents for the first time in 2 hours. She's asking you questions to check if you're prepared. You have 4 messages to prove you've been paying attention and you're taking this seriously.",
    tips: ["Know the basics — her parents' names, jobs, interests", "Show you've thought about making a good impression", "Ask smart questions that show you're listening"],
    pitfalls: ["'It'll be fine, don't stress'", "Not knowing basic facts about her parents", "Treating it like it's not a big deal"],
    chatPrompt: `You are playing a girlfriend whose boyfriend is about to meet her parents for the first time in 2 hours. You're quizzing him to see if he's been paying attention and if he's taking it seriously. This matters a lot to you. You want him to know at least the basics about your family and show he's actually prepared — not just winging it.

SCORING:
+7 to +10: knows key details about your parents, asks smart clarifying questions, shows he's taking it seriously and thinking about what matters to them
+3 to +6: mostly prepared, shows he cares about the impression, asks reasonable questions
0 to +2: not well prepared but at least nervous in the right direction
-3 to -6: doesn't know basic things he should know, "it'll be fine" dismissively
-7 to -10: clearly hasn't thought about it at all, makes you feel like it's no big deal to him

Reply in 1-2 sentences as the girlfriend reacting to how he responds. New line: [SCORE: X]`,
  },

  // ── HARD ──────────────────────────────────────────────────────────────────

  {
    id: "valentines-emergency",
    title: "Valentine's Emergency",
    subtitle: "9am. Feb 14th. She wakes up soon.",
    category: "special",
    difficulty: "hard",
    approachCost: 70,
    ownItWin: 200,
    coolWin: 120,
    setup: "It's 9:02am on Valentine's Day. You have nothing planned. No reservation. No gift. She's still asleep. You have 4 messages to manage this before it becomes a disaster.",
    tips: ["Own it fast, then immediately pivot to what you're doing about it", "Name specific plans — a real restaurant, a real idea", "Show urgency and actual effort, not just words"],
    pitfalls: ["'I don't believe in commercial holidays'", "'I was going to surprise you tonight' (lie)", "Promising a vague 'special day' with no specifics"],
    chatPrompt: `You are playing a girlfriend who just woke up on Valentine's Day to find your boyfriend has nothing planned. You've been together long enough that this stings. You're not trying to explode — but you are watching to see if he rises to the occasion or makes excuses. You've heard every excuse in the book. You want to see real action, not word magic.

SCORING:
+7 to +10: admits he dropped the ball immediately, has a real plan (specific restaurant/activity/idea) already set in motion, makes you feel like he's fighting for it
+3 to +6: acknowledges the situation with actual effort and a real-ish plan, not just vibes
0 to +2: at least doesn't make it worse, tries something even if weak
-3 to -6: "I was going to surprise you", "I don't believe in Valentine's Day", vague promises with no plan
-7 to -10: makes excuses, implies you're materialistic for caring, has zero plan and doesn't sound like he's getting one

Reply in 1-2 sentences as the girlfriend. New line: [SCORE: X]`,
  },

  {
    id: "paris-dream",
    title: "The Paris Dream",
    subtitle: "She finally asked directly. No more hints.",
    category: "trip",
    difficulty: "hard",
    approachCost: 70,
    ownItWin: 200,
    coolWin: 120,
    setup: "She's been dropping Paris hints for 6 months. Tonight she asked directly: 'Are we actually ever going to go?' She sounds tired of waiting. You have 4 messages to handle this without killing the dream or making an empty promise.",
    tips: ["Commit to a real timeline", "Show you've actually thought about it", "Acknowledge you've heard her — don't act surprised"],
    pitfalls: ["'Maybe someday'", "Talking about money problems first thing", "Overpromising with zero follow-through plan"],
    chatPrompt: `You are playing a girlfriend who has been hinting about Paris for half a year and just finally asked directly if it's ever happening. You're not angry — you're tired of feeling like it's just a fantasy he doesn't take seriously. You want him to either commit with a real plan or be honest. Empty "someday" promises are worse than nothing at this point.

SCORING:
+7 to +10: gives a real timeline, shows he's actually thought about it (budget, time of year, what you'd do), acknowledges he's heard you wanting this
+3 to +6: commits to making it happen with some specificity, doesn't dismiss it
0 to +2: doesn't shut it down but still vague, at least engaging
-3 to -6: "maybe someday", leads with money complaints, "I didn't know you were serious"
-7 to -10: dismisses it entirely, implies it's unrealistic, makes you feel foolish for wanting it

Reply in 1-2 sentences as the girlfriend. New line: [SCORE: X]`,
  },

  {
    id: "the-fight",
    title: "The Invisible Fight",
    subtitle: "She's upset about something you barely remember saying.",
    category: "conflict",
    difficulty: "hard",
    approachCost: 70,
    ownItWin: 200,
    coolWin: 120,
    setup: "Three days ago you said something offhand. You barely remember it. She's been off ever since, and tonight she brought it up. She's not yelling — she's calm, which is worse. You have 4 messages to navigate this without escalating.",
    tips: ["Listen to understand, not to defend", "Validate her feeling without being a doormat", "Don't bring up other arguments to balance the scale"],
    pitfalls: ["'I barely even said that'", "'You're overreacting'", "Immediately countering with something she did"],
    chatPrompt: `You are playing a girlfriend calmly bringing up something her boyfriend said three days ago that stuck with her. You're not screaming — you're worse than that. You're measured. You want to see if he actually hears you or if he immediately gets defensive, minimizes what happened, or tries to redirect. What he said wasn't catastrophic but it was careless, and the fact that he probably barely remembers it makes it worse.

SCORING:
+7 to +10: actually listens, acknowledges the impact without over-apologizing or being a pushover, validates that it landed wrong even if unintentional
+3 to +6: takes it seriously, shows he's hearing her, some acknowledgment of the impact
0 to +2: doesn't make it worse, at least tries to understand
-3 to -6: minimizes it "I barely said that", gets defensive, brings up what she did last month
-7 to -10: "you're overreacting", completely dismisses it, turns it into an argument about something else

Reply in 1-2 sentences as the girlfriend. Calm but watching closely. New line: [SCORE: X]`,
  },
];

// ─── Generation helpers ───────────────────────────────────────────────────────

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}

export function getScenariosByDifficulty(difficulty: ScenarioDifficulty): Scenario[] {
  return SCENARIOS.filter((s) => s.difficulty === difficulty);
}

export const SCENARIO_CATEGORY_LABEL: Record<ScenarioCategory, string> = {
  anniversary: "Anniversary",
  trip:        "Trip Planning",
  conflict:    "Conflict",
  daily:       "Daily Life",
  special:     "Special Occasion",
};

export const SCENARIO_DIFF_LABEL: Record<ScenarioDifficulty, string> = {
  easy:   "ROOKIE",
  medium: "TESTED",
  hard:   "HARD MODE",
};

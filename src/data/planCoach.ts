export type ChatRole = 'user' | 'assistant'

export type CoachPhase = 'meet' | 'chat' | 'planGenerating' | 'planReady'

export type ChatTurnState =
  | 'idle'
  | 'generating'
  | 'streaming'
  | 'awaitingUser'
  | 'planThinking'

export type ChatMessage = {
  id: string
  role: ChatRole
  text: string
  isStreaming?: boolean
}

export type DayPlan = {
  label: string
  focus: string
  duration: string
  moves: string[]
  note?: string
}

export type WeekPlan = {
  id: string
  title: string
  dayRange: string
  summary: string
  sessions: number
  days: DayPlan[]
}

export type ScriptBeat = {
  assistantFull: string
  followUps: string[]
}

export const PLAN_COACH_GOAL_CHIP = 'Lose 3 kg in 15 days'
export const PLAN_COACH_CONFIRM_CHIP = 'Yes, generate my plan'
export const PLAN_COACH_LIKE_CHIP = '☺ That’s it!'
export const PLAN_COACH_DISLIKE_CHIP = '☹ i don’t like it'

export const PLAN_COACH_MEET_CHIPS = [
  PLAN_COACH_GOAL_CHIP,
  'High-intensity training plan',
  "I'm a serious runner",
  'I want to lose fat',
] as const

export const PLAN_COACH_CONFIRM_CHIPS = [
  PLAN_COACH_CONFIRM_CHIP,
  'Looks good — generate it',
  'Make it easier first',
] as const

export const PLAN_COACH_FEEDBACK_CHIPS = [PLAN_COACH_LIKE_CHIP, PLAN_COACH_DISLIKE_CHIP] as const

export const PLAN_COACH_THINKING_LINES = [
  'Considering your weekly training days…',
  'Arranging the right training sessions…',
  'Balancing strength and cardio…',
  'Creating reward stickers…',
  'Locking your 15-day plan framework…',
] as const

export const PLAN_COACH_READY_MESSAGE =
  'I’ve added your generated plan to the Today page. I’ll adjust it anytime based on your status. Let’s get started!'

export const PLAN_COACH_HI = 'Hi Sifan,'
export const PLAN_COACH_SUB = 'i am your personal coach'
export const PLAN_COACH_TIP =
  'In one sentence, tell me the goal and the timeframe — I’ll build a detailed plan for you.'

const GOAL_BEAT: ScriptBeat = {
  assistantFull:
    'Got it — lose 3 kg in 15 days.\nThat’s aggressive (~0.2 kg/day). I can draft a tight plan, but I need two constraints first:\n1) How many days/week can you train?\n2) Gym or home only?',
  followUps: ['3 days / week · Home only', 'Gym OK · 4 days', 'Knees sensitive'],
}

const FRAMEWORK_BEAT: ScriptBeat = {
  assistantFull:
    'Here’s a rough framework for −3 kg / 15 days · 3×/week · home:\n\nWeek shape\n• Day A — Full-body strength 35–40 min\n• Day B — Zone-2 cardio 30 min + core\n• Day C — Strength + finishers 40 min\n\nDaily non-negotiables\n• Protein ~1.6 g/kg · ~500 kcal deficit\n• 7k–9k steps · sleep 7h+\n\nThis is only the skeleton. Confirm and I’ll generate your weekly plan cards.',
  followUps: [...PLAN_COACH_CONFIRM_CHIPS],
}

const EASIER_BEAT: ScriptBeat = {
  assistantFull:
    'Softer framework: still −3 kg / 15 days, but volume −20%.\n• Shorter finishers · deficit closer to 400 kcal\n• Add one full rest day if sleep <6.5h\n\nConfirm when you want me to generate the weekly cards.',
  followUps: [...PLAN_COACH_CONFIRM_CHIPS],
}

export function isPlanConfirm(userText: string) {
  const t = userText.toLowerCase().trim()
  if (t.includes('generate my plan')) return true
  if (t.includes('generate it')) return true
  if (t === 'yes' || t.startsWith('yes,')) return true
  if (t.includes('looks good') && t.includes('generate')) return true
  return false
}

export function isPlanFeedback(userText: string) {
  const t = userText.trim()
  if (t === PLAN_COACH_LIKE_CHIP || t === PLAN_COACH_DISLIKE_CHIP) return true
  const lower = t.toLowerCase()
  if (lower.includes('☺') || lower.includes('☹')) return true
  if (lower.includes("that's it") || lower.includes('that’s it')) return true
  if (lower.includes("don't like") || lower.includes('dont like') || lower.includes('don’t like')) {
    return true
  }
  return false
}

export function beatForUserTurn(userTurnIndex: number, userText: string): ScriptBeat {
  if (userTurnIndex <= 1) return GOAL_BEAT
  if (userText.toLowerCase().includes('easier')) return EASIER_BEAT
  return FRAMEWORK_BEAT
}

export const PLAN_COACH_WEEKS: WeekPlan[] = [
  {
    id: 'w1',
    title: 'Week 1',
    dayRange: 'Days 1–7',
    summary: 'Build the habit · 3 home sessions',
    sessions: 3,
    days: [
      {
        label: 'Day 1 · Mon',
        focus: 'Day A — Full-body strength',
        duration: '35–40 min',
        moves: [
          'Goblet squat 4×8',
          'Push-up / knee push-up 3×10',
          'Backpack RDL 3×10',
          'Reverse lunge 3×8/leg',
          'Plank 3×40s',
        ],
        note: 'Rest 60–90s. Keep effort ≤8/10.',
      },
      {
        label: 'Day 3 · Wed',
        focus: 'Day B — Zone-2 + core',
        duration: '≈30 min',
        moves: ['Brisk walk / easy bike 25 min', 'Dead bug 3×8/side', 'Side plank 2×30s/side'],
        note: 'Talk-pace heart rate only.',
      },
      {
        label: 'Day 5 · Fri',
        focus: 'Day C — Strength + finishers',
        duration: '≈40 min',
        moves: [
          'Split squat 3×8/leg',
          'Pike push-up 3×8',
          'Hip thrust 3×12',
          'Farmer carry 3×40s',
          'Finisher: mountain climber 2×30s',
        ],
      },
    ],
  },
  {
    id: 'w2',
    title: 'Week 2',
    dayRange: 'Days 8–14',
    summary: 'Add density · keep recovery honest',
    sessions: 3,
    days: [
      {
        label: 'Day 8 · Mon',
        focus: 'Day A — Strength (progress)',
        duration: '40 min',
        moves: [
          'Goblet squat 4×10',
          'Push-up 3×12',
          'Backpack RDL 3×12',
          'Reverse lunge 3×10/leg',
          'Plank 3×45s',
        ],
      },
      {
        label: 'Day 10 · Wed',
        focus: 'Day B — Zone-2 + core',
        duration: '35 min',
        moves: ['Brisk walk / bike 28 min', 'Dead bug 3×10/side', 'Bird dog 3×8/side'],
      },
      {
        label: 'Day 12 · Fri',
        focus: 'Day C — Strength + finishers',
        duration: '40 min',
        moves: [
          'Split squat 3×10/leg',
          'Pike push-up 3×10',
          'Hip thrust 3×12',
          'Finisher: jump rope or high knees 3×40s',
        ],
        note: 'If sleep <6.5h, drop the finisher.',
      },
    ],
  },
  {
    id: 'w3',
    title: 'Week 3',
    dayRange: 'Day 15',
    summary: 'Lock-in day · measure & reward',
    sessions: 1,
    days: [
      {
        label: 'Day 15',
        focus: 'Check-in + light Day A',
        duration: '30 min',
        moves: ['Weigh-in & waist note', 'Goblet squat 3×8', 'Push-up 2×10', 'Easy walk 15 min'],
        note: 'Claim your reward sticker — you finished the block.',
      },
    ],
  },
]

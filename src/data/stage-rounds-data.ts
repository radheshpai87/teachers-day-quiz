export interface StageRule {
  text: string
  highlight?: string
}

export interface StageMcqQuestion {
  id: string
  number: number
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface StageImageQuestion {
  id: string
  number: number
  type: 'image'
  question: string
  imageUrl: string
  answer: string
  explanation: string
}

export interface StageAudioQuestion {
  id: string
  number: number
  type: 'audio'
  question: string
  audioUrl: string
  answer: string
  quote?: string
  explanation: string
}

export interface RapidFireQuestionItem {
  number: number
  category: string
  prompt: string
  answer: string
}

export interface RapidFireSet {
  participantIndex: number
  participantLabel: string
  setNumber: number
  questions: RapidFireQuestionItem[]
}

export interface StageData {
  title: string
  subtitle: string
  rules: string[]
  round1: {
    name: string
    points: { correct: number; wrong: number }
    ruleText: string
    questions: StageMcqQuestion[]
  }
  round2: {
    name: string
    points: { directCorrect: number; directWrong: number; passedCorrect: number; passedWrong: number }
    ruleText: string
    images: StageImageQuestion[]
    audios: StageAudioQuestion[]
  }
  round3: {
    name: string
    points: { correct: number; wrong: number }
    ruleText: string
    timerSeconds: number
    sets: RapidFireSet[]
  }
  round4: {
    name: string
    points: { correct: number; wrong: number }
    ruleText: string
  }
}

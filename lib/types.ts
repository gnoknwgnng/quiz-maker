export interface Quiz {
  quiz_id: string
  title: string
  topic: string
  difficulty: 'easy' | 'medium' | 'hard'
  created_by: string
  shareable_link: string
  expiry_date?: string
  created_at: string
  description?: string
  category?: string
  tags?: string[]
  time_limit?: number // in minutes, null for no limit
  questions_per_page?: number
  shuffle_questions?: boolean
  show_results_immediately?: boolean
}

export interface Question {
  question_id: string
  quiz_id: string
  question_text: string
  question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'fill_blank' | 'multi_select'
  options?: string[]
  correct_answer: string
  image_url?: string
  points?: number
}

export interface Participant {
  participant_id: string
  name: string
  profile_photo?: string
  joined_at: string
}

export interface Attempt {
  attempt_id: string
  quiz_id: string
  participant_id: string
  score: number
  time_taken: number
  attempt_date: string
}

export interface Answer {
  answer_id: string
  attempt_id: string
  question_id: string
  selected_answer: string
  is_correct: boolean
}

export interface GroqModel {
  id: string
  name: string
}

export const GROQ_MODELS: GroqModel[] = [
  { id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout 17B' },
  { id: 'meta-llama/llama-4-maverick-17b-128e-instruct', name: 'Llama 4 Maverick 17B' },
  { id: 'meta-llama/llama-guard-4-12b', name: 'Llama Guard 4 12B' },
  { id: 'meta-llama/llama-prompt-guard-2-22m', name: 'Llama Prompt Guard 2 22M' },
  { id: 'openai/gpt-oss-120b', name: 'GPT OSS 120B' },
  { id: 'openai/gpt-oss-20b', name: 'GPT OSS 20B' },
  { id: 'qwen/qwen3-32b', name: 'Qwen3 32B' },
  { id: 'meta-llama/llama-prompt-guard-2-86m', name: 'Llama Prompt Guard 2 86M' }
]
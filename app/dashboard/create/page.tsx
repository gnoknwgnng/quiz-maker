'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

import { GROQ_MODELS } from '@/lib/types'
import toast from 'react-hot-toast'
import { ArrowLeft, Wand2, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface QuestionForm {
  question_text: string
  question_type: 'multiple_choice' | 'true_false' | 'fill_blank' | 'multi_select'
  options: string[]
  correct_answer: string | string[]
  image_url?: string
  points?: number
}

export default function CreateQuizPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [topic, setTopic] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [timeLimit, setTimeLimit] = useState<number>(0) // 0 means no limit
  const [shuffleQuestions, setShuffleQuestions] = useState(false)
  const [showResultsImmediately, setShowResultsImmediately] = useState(true)
  const [selectedModel, setSelectedModel] = useState(GROQ_MODELS[0].id)
  const [questionCount, setQuestionCount] = useState(5)
  const [questions, setQuestions] = useState<QuestionForm[]>([])
  const [loading, setLoading] = useState(false)
  const [generatingQuestions, setGeneratingQuestions] = useState(false)
  const router = useRouter()

  const categories = [
    'Education', 'Science', 'Technology', 'History', 'Geography', 
    'Literature', 'Mathematics', 'Sports', 'Entertainment', 'Business',
    'Health', 'Art', 'Music', 'General Knowledge', 'Other'
  ]

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 5) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const generateAIQuestions = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic first')
      return
    }

    setGeneratingQuestions(true)
    try {
      toast.loading('🤖 AI is generating your questions...', { duration: 2000 })
      
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic.trim(),
          difficulty,
          count: questionCount,
          model: selectedModel
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate questions')
      }

      const data = await response.json()
      
      const formattedQuestions: QuestionForm[] = data.questions.map((q: any) => ({
        question_text: q.question,
        question_type: q.type,
        options: q.options || ['True', 'False'],
        correct_answer: q.correct_answer
      }))
      
      setQuestions(formattedQuestions)
      
      // Show different success messages based on source
      if (data.source === 'ai') {
        toast.success(`🎉 Generated ${data.questions.length} AI questions successfully!`)
      } else {
        toast.success(`📝 Generated ${data.questions.length} sample questions for ${topic}!`)
        toast('💡 Tip: Add GROQ_API_KEY to environment variables for AI-powered questions', {
          duration: 4000,
          icon: '💡'
        })
      }
    } catch (error) {
      toast.error('⚠️ Failed to generate questions. Please try again.')
      console.error('Error generating questions:', error)
    } finally {
      setGeneratingQuestions(false)
    }
  }

  const addManualQuestion = () => {
    setQuestions([...questions, {
      question_text: '',
      question_type: 'multiple_choice',
      options: ['', '', '', ''],
      correct_answer: ''
    }])
  }

  const updateQuestion = (index: number, field: keyof QuestionForm, value: any) => {
    const updated = [...questions]
    updated[index] = { ...updated[index], [field]: value }
    setQuestions(updated)
  }

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const createQuiz = async () => {
    if (!title.trim() || !topic.trim() || questions.length === 0) {
      toast.error('Please fill in all required fields and add at least one question')
      return
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      const hasCorrectAnswer = Array.isArray(q.correct_answer) 
        ? q.correct_answer.length > 0 
        : q.correct_answer.trim()
      
      if (!q.question_text.trim() || !hasCorrectAnswer) {
        toast.error(`Question ${i + 1} is incomplete`)
        return
      }
      if (q.question_type === 'multiple_choice' && q.options.some(opt => !opt.trim())) {
        toast.error(`Question ${i + 1} has empty options`)
        return
      }
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please log in to create a quiz')
        return
      }

      // Generate unique shareable link
      const shareableLink = `quiz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Create quiz
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          topic: topic.trim(),
          category: category || null,
          tags: tags.length > 0 ? tags : null,
          difficulty,
          time_limit: timeLimit > 0 ? timeLimit : null,
          shuffle_questions: shuffleQuestions,
          show_results_immediately: showResultsImmediately,
          created_by: user.id,
          shareable_link: shareableLink
        })
        .select()
        .single()

      if (quizError) {
        toast.error('Failed to create quiz')
        return
      }

      // Add questions
      const questionsToInsert = questions.map(q => ({
        quiz_id: quizData.quiz_id,
        question_text: q.question_text.trim(),
        question_type: q.question_type,
        options: q.options.filter(opt => opt.trim()),
        correct_answer: Array.isArray(q.correct_answer) 
          ? q.correct_answer.join(', ') 
          : q.correct_answer.trim()
      }))

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert)

      if (questionsError) {
        toast.error('Failed to add questions')
        return
      }

      // Track quiz creation
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'quiz_created', {
          event_category: 'engagement',
          event_label: topic.trim(),
          value: questions.length
        })
      }

      toast.success('Quiz created successfully!')
      router.push(`/dashboard/quiz/${quizData.quiz_id}`)
    } catch (error) {
      toast.error('An error occurred while creating the quiz')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Link href="/dashboard" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mr-4">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Create New Quiz</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Quiz Details */}
          <div className="card hover-lift animate-fadeInUp">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 animate-pulse"></span>
              Quiz Details
            </h2>
            <div className="space-y-4">
              {/* First row */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Quiz Title *
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Enter quiz title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    className="input-field"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Second row */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  className="input-field"
                  rows={2}
                  placeholder="Brief description of your quiz (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Third row */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Topic *
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g., JavaScript, History, Science"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Difficulty
                  </label>
                  <select
                    className="input-field"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tags (max 5)
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input-field flex-1"
                    placeholder="Add a tag and press Enter"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addTag()
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    disabled={!tagInput.trim() || tags.length >= 5}
                    className="btn-secondary px-4"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Quiz Settings */}
              <div className="border-t pt-4">
                <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Quiz Settings</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Time Limit (minutes)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="180"
                      className="input-field"
                      placeholder="0 = No limit"
                      value={timeLimit || ''}
                      onChange={(e) => setTimeLimit(parseInt(e.target.value) || 0)}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Leave 0 for no time limit
                    </p>
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={shuffleQuestions}
                        onChange={(e) => setShuffleQuestions(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Shuffle questions for each participant
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={showResultsImmediately}
                        onChange={(e) => setShowResultsImmediately(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Show results immediately after completion
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Question Generation */}
          <div className="card hover-lift animate-fadeInUp" style={{animationDelay: '0.2s'}}>
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Wand2 className="w-5 h-5 text-purple-500 mr-3 animate-float" />
              AI Question Generation
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  AI Model
                </label>
                <select
                  className="input-field"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                >
                  {GROQ_MODELS.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Questions
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  className="input-field"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value) || 5)}
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={generateAIQuestions}
                  disabled={generatingQuestions}
                  className="btn-primary w-full flex items-center justify-center space-x-2 relative overflow-hidden group"
                >
                  {generatingQuestions ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 group-hover:animate-bounce" />
                      <span>Generate Questions</span>
                    </>
                  )}
                  {generatingQuestions && (
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-20 animate-pulse"></div>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="card hover-lift animate-fadeInUp" style={{animationDelay: '0.4s'}}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3 animate-pulse"></span>
                Questions ({questions.length})
              </h2>
              <button
                onClick={addManualQuestion}
                className="btn-secondary flex items-center space-x-2 hover-scale group"
              >
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                <span>Add Manual Question</span>
              </button>
            </div>

            {questions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No questions yet. Generate questions with AI or add them manually.
              </p>
            ) : (
              <div className="space-y-6">
                {questions.map((question, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover-lift animate-bounce-in bg-gradient-to-r from-white to-gray-50">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-medium">Question {index + 1}</h3>
                      <button
                        onClick={() => removeQuestion(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Question Text *
                        </label>
                        <textarea
                          className="input-field"
                          rows={2}
                          placeholder="Enter your question"
                          value={question.question_text}
                          onChange={(e) => updateQuestion(index, 'question_text', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Question Type
                        </label>
                        <select
                          className="input-field"
                          value={question.question_type}
                          onChange={(e) => {
                            const newType = e.target.value as 'multiple_choice' | 'true_false'
                            updateQuestion(index, 'question_type', newType)
                            if (newType === 'true_false') {
                              updateQuestion(index, 'options', ['True', 'False'])
                            } else {
                              updateQuestion(index, 'options', ['', '', '', ''])
                            }
                          }}
                        >
                          <option value="multiple_choice">Multiple Choice</option>
                          <option value="true_false">True/False</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Options *
                        </label>
                        <div className="space-y-2">
                          {question.options.map((option, optIndex) => (
                            <input
                              key={optIndex}
                              type="text"
                              className="input-field"
                              placeholder={`Option ${optIndex + 1}`}
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...question.options]
                                newOptions[optIndex] = e.target.value
                                updateQuestion(index, 'options', newOptions)
                              }}
                              disabled={question.question_type === 'true_false'}
                            />
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Correct Answer *
                        </label>
                        <select
                          className="input-field"
                          value={question.correct_answer}
                          onChange={(e) => updateQuestion(index, 'correct_answer', e.target.value)}
                        >
                          <option value="">Select correct answer</option>
                          {question.options.filter(opt => opt.trim()).map((option, optIndex) => (
                            <option key={optIndex} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create Quiz Button */}
          <div className="flex justify-end animate-fadeInUp" style={{animationDelay: '0.6s'}}>
            <button
              onClick={createQuiz}
              disabled={loading || questions.length === 0}
              className="btn-primary px-8 py-3 text-lg hover-scale group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    Creating Quiz...
                  </>
                ) : (
                  <>
                    <span>Create Quiz</span>
                    <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">🚀</span>
                  </>
                )}
              </span>
              {!loading && (
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
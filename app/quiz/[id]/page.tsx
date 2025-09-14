'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Quiz, Question } from '@/lib/types'
import toast from 'react-hot-toast'
import { Clock, User, CheckCircle, AlertTriangle } from 'lucide-react'
import { QuizTimer } from '@/components/QuizTimer'

interface QuizPageProps {
  params: { id: string }
}

export default function QuizPage({ params }: QuizPageProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [participant, setParticipant] = useState<any>(null)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [multiSelectAnswers, setMultiSelectAnswers] = useState<Record<string, string[]>>({})
  const router = useRouter()

  useEffect(() => {
    // Check if participant data exists
    const participantData = localStorage.getItem('participant')
    if (!participantData) {
      router.push('/quiz/join')
      return
    }
    
    setParticipant(JSON.parse(participantData))
    fetchQuizData()
  }, [params.id])

  useEffect(() => {
    if (startTime && !quizCompleted) {
      const interval = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [startTime, quizCompleted])

  const fetchQuizData = async () => {
    try {
      // Fetch quiz by shareable_link
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('shareable_link', params.id)
        .single()

      if (quizError || !quizData) {
        toast.error('Quiz not found')
        router.push('/quiz/join')
        return
      }

      // Check if quiz is expired
      if (quizData.expiry_date && new Date(quizData.expiry_date) < new Date()) {
        toast.error('This quiz has expired')
        router.push('/quiz/join')
        return
      }

      setQuiz(quizData)

      // Set timer if quiz has time limit
      if (quizData.time_limit && quizData.time_limit > 0) {
        setTimeRemaining(quizData.time_limit * 60) // Convert minutes to seconds
      }

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', quizData.quiz_id)
        .order('question_id')

      if (questionsError) {
        toast.error('Failed to load questions')
        return
      }

      let processedQuestions = questionsData || []
      
      // Shuffle questions if enabled
      if (quizData.shuffle_questions) {
        processedQuestions = [...processedQuestions].sort(() => Math.random() - 0.5)
      }

      setQuestions(processedQuestions)
      setStartTime(new Date())
    } catch (error) {
      toast.error('An error occurred while loading the quiz')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const handleMultiSelectAnswer = (questionId: string, option: string) => {
    setMultiSelectAnswers(prev => {
      const currentAnswers = prev[questionId] || []
      const isSelected = currentAnswers.includes(option)
      
      if (isSelected) {
        return {
          ...prev,
          [questionId]: currentAnswers.filter(a => a !== option)
        }
      } else {
        return {
          ...prev,
          [questionId]: [...currentAnswers, option]
        }
      }
    })
  }

  const handleTimeUp = () => {
    toast.error('Time is up! Submitting quiz automatically.')
    submitQuiz()
  }

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const submitQuiz = async () => {
    if (!participant || !quiz || !startTime) return

    // Check if all questions are answered
    const unansweredQuestions = questions.filter(q => !answers[q.question_id])
    if (unansweredQuestions.length > 0) {
      const proceed = confirm(`You have ${unansweredQuestions.length} unanswered questions. Submit anyway?`)
      if (!proceed) return
    }

    setSubmitting(true)
    try {
      // Create participant record
      const { data: participantData, error: participantError } = await supabase
        .from('participants')
        .insert({
          name: participant.name,
          profile_photo: participant.profilePhoto,
          joined_at: participant.joinedAt
        })
        .select()
        .single()

      if (participantError) {
        toast.error('Failed to save participant data')
        return
      }

      // Calculate score
      let correctAnswers = 0
      const answerRecords = questions.map(question => {
        let selectedAnswer = ''
        let isCorrect = false

        if (question.question_type === 'multi-select') {
          const selectedOptions = multiSelectAnswers[question.question_id] || []
          selectedAnswer = selectedOptions.join(', ')
          // For multi-select, check if all correct answers are selected
          const correctOptions = question.correct_answer?.split(', ') || []
          isCorrect = correctOptions.length === selectedOptions.length && 
                     correctOptions.every(option => selectedOptions.includes(option))
        } else {
          selectedAnswer = answers[question.question_id] || ''
          isCorrect = selectedAnswer === question.correct_answer
        }

        if (isCorrect) correctAnswers++

        return {
          question_id: question.question_id,
          selected_answer: selectedAnswer,
          is_correct: isCorrect
        }
      })

      const score = Math.round((correctAnswers / questions.length) * 100)
      const timeTaken = Math.floor((Date.now() - startTime.getTime()) / 1000)

      // Create attempt record
      const { data: attemptData, error: attemptError } = await supabase
        .from('attempts')
        .insert({
          quiz_id: quiz.quiz_id,
          participant_id: participantData.participant_id,
          score,
          time_taken: timeTaken,
          attempt_date: new Date().toISOString()
        })
        .select()
        .single()

      if (attemptError) {
        toast.error('Failed to save attempt')
        return
      }

      // Save individual answers
      const answersToInsert = answerRecords.map(answer => ({
        attempt_id: attemptData.attempt_id,
        ...answer
      }))

      const { error: answersError } = await supabase
        .from('answers')
        .insert(answersToInsert)

      if (answersError) {
        toast.error('Failed to save answers')
        return
      }

      // Store results for results page
      localStorage.setItem('quizResults', JSON.stringify({
        score,
        correctAnswers,
        totalQuestions: questions.length,
        timeTaken,
        quizTitle: quiz.title
      }))

      // Track quiz completion
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'quiz_completed', {
          event_category: 'engagement',
          event_label: quiz.title,
          value: score
        })
      }

      setQuizCompleted(true)
      toast.success('Quiz submitted successfully!')
      
      // Redirect to results page
      setTimeout(() => {
        router.push(`/quiz/${params.id}/results`)
      }, 2000)

    } catch (error) {
      toast.error('An error occurred while submitting the quiz')
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quiz...</p>
        </div>
      </div>
    )
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Quiz not found or has no questions</p>
        </div>
      </div>
    )
  }

  if (quizCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Completed!</h2>
          <p className="text-gray-600">Redirecting to results...</p>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{quiz.title}</h1>
              <p className="text-sm text-gray-600">{quiz.topic} • {quiz.difficulty}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <User className="w-4 h-4" />
                <span className="text-sm">{participant?.name}</span>
              </div>
              {timeRemaining !== null ? (
                <QuizTimer 
                  initialTime={timeRemaining} 
                  onTimeUp={handleTimeUp}
                />
              ) : (
                <div className="flex items-center space-x-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-mono">{formatTime(timeElapsed)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question */}
        <div className="card mb-8 animate-fadeInUp">
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 animate-slideInLeft">
              {currentQuestion.question_text}
            </h2>
            {currentQuestion.points && (
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">
                {currentQuestion.points} pts
              </span>
            )}
          </div>

          {/* Image if present */}
          {currentQuestion.image_url && (
            <div className="mb-6">
              <img 
                src={currentQuestion.image_url} 
                alt="Question image" 
                className="max-w-full h-auto rounded-lg shadow-md"
              />
            </div>
          )}

          <div className="space-y-3">
            {/* Multiple Choice / True-False */}
            {(currentQuestion.question_type === 'multiple-choice' || currentQuestion.question_type === 'true-false') && 
              currentQuestion.options?.map((option, index) => (
                <label
                  key={index}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-[1.02] hover:shadow-md ${
                    answers[currentQuestion.question_id] === option
                      ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md scale-[1.02]'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.question_id}`}
                    value={option}
                    checked={answers[currentQuestion.question_id] === option}
                    onChange={() => handleAnswerSelect(currentQuestion.question_id, option)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center transition-all duration-300 ${
                    answers[currentQuestion.question_id] === option
                      ? 'border-blue-500 bg-blue-500 scale-110'
                      : 'border-gray-300 hover:border-blue-400'
                  }`}>
                    {answers[currentQuestion.question_id] === option && (
                      <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                    )}
                  </div>
                  <span className={`text-gray-900 transition-colors duration-300 ${
                    answers[currentQuestion.question_id] === option ? 'font-semibold text-blue-900' : ''
                  }`}>
                    {option}
                  </span>
                  {answers[currentQuestion.question_id] === option && (
                    <span className="ml-auto text-blue-500 animate-bounce">✓</span>
                  )}
                </label>
              ))
            }

            {/* Multi-Select */}
            {currentQuestion.question_type === 'multi-select' && 
              currentQuestion.options?.map((option, index) => {
                const isSelected = multiSelectAnswers[currentQuestion.question_id]?.includes(option) || false
                return (
                  <label
                    key={index}
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-[1.02] hover:shadow-md ${
                      isSelected
                        ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md scale-[1.02]'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleMultiSelectAnswer(currentQuestion.question_id, option)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 mr-4 flex items-center justify-center transition-all duration-300 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500 scale-110'
                        : 'border-gray-300 hover:border-blue-400'
                    }`}>
                      {isSelected && (
                        <span className="text-white text-xs animate-pulse">✓</span>
                      )}
                    </div>
                    <span className={`text-gray-900 transition-colors duration-300 ${
                      isSelected ? 'font-semibold text-blue-900' : ''
                    }`}>
                      {option}
                    </span>
                    {isSelected && (
                      <span className="ml-auto text-blue-500 animate-bounce">✓</span>
                    )}
                  </label>
                )
              })
            }

            {/* Fill in the Blank */}
            {currentQuestion.question_type === 'fill-blank' && (
              <div className="space-y-4">
                <input
                  type="text"
                  value={answers[currentQuestion.question_id] || ''}
                  onChange={(e) => handleAnswerSelect(currentQuestion.question_id, e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                />
                <p className="text-sm text-gray-500">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  Please type your answer carefully. Spelling and capitalization matter.
                </p>
              </div>
            )}
          </div>

          {/* Multi-select instruction */}
          {currentQuestion.question_type === 'multi-select' && (
            <p className="mt-4 text-sm text-gray-500 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-1" />
              Select all correct answers
            </p>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={previousQuestion}
            disabled={currentQuestionIndex === 0}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="flex space-x-4">
            {currentQuestionIndex === questions.length - 1 ? (
              <button
                onClick={submitQuiz}
                disabled={submitting}
                className="btn-primary px-8"
              >
                {submitting ? 'Submitting...' : 'Submit Quiz'}
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                className="btn-primary"
              >
                Next
              </button>
            )}
          </div>
        </div>

        {/* Question Navigation */}
        <div className="mt-8 p-4 bg-white rounded-lg border">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Question Overview</h3>
          <div className="grid grid-cols-10 gap-2">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-8 h-8 rounded text-xs font-medium ${
                  index === currentQuestionIndex
                    ? 'bg-blue-600 text-white'
                    : answers[questions[index].question_id]
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
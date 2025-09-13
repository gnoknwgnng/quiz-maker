'use client'

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Quiz, Question } from '@/lib/types'
import toast from 'react-hot-toast'
import { ArrowLeft, Share2, Eye, Users, Copy, ExternalLink } from 'lucide-react'

interface QuizViewProps {
  params: { id: string }
}

export default function QuizViewPage({ params }: QuizViewProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchQuizData()
  }, [params.id])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
    }
  }

  const fetchQuizData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch quiz
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('quiz_id', params.id)
        .eq('created_by', user.id)
        .single()

      if (quizError || !quizData) {
        toast.error('Quiz not found')
        router.push('/dashboard')
        return
      }

      setQuiz(quizData)

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', params.id)
        .order('question_id')

      if (questionsError) {
        toast.error('Failed to load questions')
      } else {
        setQuestions(questionsData || [])
      }
    } catch (error) {
      toast.error('An error occurred while loading the quiz')
    } finally {
      setLoading(false)
    }
  }

  const copyShareLink = () => {
    if (!quiz) return
    
    const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/quiz/${quiz.shareable_link}`
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl)
      toast.success('Share link copied to clipboard!')
    }
  }

  const openQuizPreview = () => {
    if (!quiz) return
    
    const previewUrl = `/quiz/${quiz.shareable_link}`
    if (typeof window !== 'undefined') {
      window.open(previewUrl, '_blank')
    }
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

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Quiz not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mr-4">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
                <p className="text-sm text-gray-600">{quiz.topic} • {quiz.difficulty}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={copyShareLink}
                className="btn-secondary flex items-center space-x-2"
              >
                <Copy className="w-4 h-4" />
                <span>Copy Link</span>
              </button>
              
              <button
                onClick={openQuizPreview}
                className="btn-secondary flex items-center space-x-2"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Preview</span>
              </button>
              
              <Link
                href={`/dashboard/quiz/${quiz.quiz_id}/results`}
                className="btn-primary flex items-center space-x-2"
              >
                <Users className="w-4 h-4" />
                <span>View Results</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Quiz Info */}
          <div className="lg:col-span-1">
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Quiz Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <p className="text-gray-900">{quiz.title}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Topic</label>
                  <p className="text-gray-900">{quiz.topic}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Difficulty</label>
                  <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                    quiz.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                    quiz.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {quiz.difficulty}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Questions</label>
                  <p className="text-gray-900">{questions.length} questions</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="text-gray-900">
                    {new Date(quiz.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Share Link</label>
                  <div className="flex items-center space-x-2">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1 truncate">
                      {quiz.shareable_link}
                    </code>
                    <button
                      onClick={copyShareLink}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="text-lg font-semibold mb-6">Questions ({questions.length})</h2>
              
              {questions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No questions found</p>
              ) : (
                <div className="space-y-6">
                  {questions.map((question, index) => (
                    <div key={question.question_id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-medium text-gray-900">
                          Question {index + 1}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          question.question_type === 'multiple_choice' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {question.question_type === 'multiple_choice' ? 'Multiple Choice' : 'True/False'}
                        </span>
                      </div>
                      
                      <p className="text-gray-900 mb-4">{question.question_text}</p>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Options:</p>
                        {question.options?.map((option, optIndex) => (
                          <div
                            key={optIndex}
                            className={`flex items-center p-2 rounded ${
                              option === question.correct_answer
                                ? 'bg-green-50 border border-green-200'
                                : 'bg-gray-50'
                            }`}
                          >
                            <div className={`w-3 h-3 rounded-full mr-3 ${
                              option === question.correct_answer
                                ? 'bg-green-500'
                                : 'bg-gray-300'
                            }`}></div>
                            <span className={
                              option === question.correct_answer
                                ? 'text-green-800 font-medium'
                                : 'text-gray-700'
                            }>
                              {option}
                            </span>
                            {option === question.correct_answer && (
                              <span className="ml-2 text-xs text-green-600 font-medium">
                                (Correct Answer)
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
'use client'

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Trophy, Clock, CheckCircle, XCircle, Home } from 'lucide-react'

interface QuizResults {
  score: number
  correctAnswers: number
  totalQuestions: number
  timeTaken: number
  quizTitle: string
}

interface ResultsPageProps {
  params: { id: string }
}

export default function ResultsPage({ params }: ResultsPageProps) {
  const [results, setResults] = useState<QuizResults | null>(null)
  const router = useRouter()

  useEffect(() => {
    const resultsData = localStorage.getItem('quizResults')
    if (!resultsData) {
      router.push('/quiz/join')
      return
    }
    
    setResults(JSON.parse(resultsData))
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreMessage = (score: number) => {
    if (score >= 90) return 'Excellent! Outstanding performance!'
    if (score >= 80) return 'Great job! Well done!'
    if (score >= 70) return 'Good work! Nice effort!'
    if (score >= 60) return 'Not bad! Keep practicing!'
    return 'Keep studying and try again!'
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading results...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-4">
              <Trophy className={`w-16 h-16 mx-auto ${getScoreColor(results.score)}`} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Quiz Completed!
            </h1>
            <p className="text-xl text-gray-600">
              {results.quizTitle}
            </p>
          </div>

          {/* Results Card */}
          <div className="card mb-8">
            <div className="text-center mb-6">
              <div className={`text-6xl font-bold mb-2 ${getScoreColor(results.score)}`}>
                {results.score}%
              </div>
              <p className="text-lg text-gray-600">
                {getScoreMessage(results.score)}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                  <span className="text-2xl font-bold text-green-600">
                    {results.correctAnswers}
                  </span>
                </div>
                <p className="text-sm text-gray-600">Correct Answers</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <XCircle className="w-6 h-6 text-red-600 mr-2" />
                  <span className="text-2xl font-bold text-red-600">
                    {results.totalQuestions - results.correctAnswers}
                  </span>
                </div>
                <p className="text-sm text-gray-600">Incorrect Answers</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="w-6 h-6 text-blue-600 mr-2" />
                  <span className="text-2xl font-bold text-blue-600">
                    {formatTime(results.timeTaken)}
                  </span>
                </div>
                <p className="text-sm text-gray-600">Time Taken</p>
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Total Questions: {results.totalQuestions}</span>
                <span>Accuracy: {results.score}%</span>
              </div>
            </div>
          </div>

          {/* Performance Breakdown */}
          <div className="card mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Performance Breakdown
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Correct Answers</span>
                  <span className="text-sm text-gray-600">
                    {results.correctAnswers}/{results.totalQuestions}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${(results.correctAnswers / results.totalQuestions) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Overall Score</span>
                  <span className="text-sm text-gray-600">{results.score}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      results.score >= 80 ? 'bg-green-600' :
                      results.score >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                    }`}
                    style={{ width: `${results.score}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/quiz/join" className="btn-primary text-center">
              Take Another Quiz
            </Link>
            <Link href="/" className="btn-secondary flex items-center justify-center space-x-2">
              <Home className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
          </div>

          {/* Share Results */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-600 mb-4">
              Share your results with friends!
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  const text = `I just scored ${results.score}% on "${results.quizTitle}"! 🎉`
                  if (typeof navigator !== 'undefined') {
                    if (navigator.share) {
                      navigator.share({ text })
                    } else if (navigator.clipboard) {
                      navigator.clipboard.writeText(text)
                      alert('Results copied to clipboard!')
                    }
                  }
                }}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Share Results
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
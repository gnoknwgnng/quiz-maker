'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Quiz } from '@/lib/types'
import toast from 'react-hot-toast'
import { Plus, LogOut, Eye, Users, Clock, Tag } from 'lucide-react'
import Link from 'next/link'
import ShareQuiz from '@/components/ShareQuiz'
import CopyLinkButton from '@/components/CopyLinkButton'
import QuizMetadata from '@/components/QuizMetadata'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkUser()
    fetchQuizzes()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
    } else {
      setUser(user)
    }
    setLoading(false)
  }

  const fetchQuizzes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        toast.error('Failed to fetch quizzes')
      } else {
        setQuizzes(data || [])
      }
    } catch (error) {
      toast.error('An error occurred while fetching quizzes')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Quiz Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.email}</span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-semibold text-gray-900">Your Quizzes</h2>
          <Link href="/dashboard/create" className="btn-primary flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Create New Quiz</span>
          </Link>
        </div>

        {quizzes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Plus className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No quizzes yet</h3>
            <p className="text-gray-600 mb-6">Create your first quiz to get started</p>
            <Link href="/dashboard/create" className="btn-primary">
              Create Your First Quiz
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((quiz) => (
              <div key={quiz.quiz_id} className="card hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {quiz.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{quiz.topic}</p>
                    {quiz.description && (
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">{quiz.description}</p>
                    )}
                    
                    {/* Quiz Metadata */}
                    <QuizMetadata 
                      createdAt={quiz.created_at}
                      category={quiz.category}
                      tags={quiz.tags}
                      difficulty={quiz.difficulty}
                      questionCount={quiz.question_count || 0}
                    />
                    
                    {/* Categories and Tags */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {quiz.category && (
                        <span className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          <Tag className="w-3 h-3 mr-1" />
                          {quiz.category}
                        </span>
                      )}
                      {quiz.tags && quiz.tags.map((tag: string, index: number) => (
                        <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      quiz.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      quiz.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {quiz.difficulty}
                    </span>
                    
                    {quiz.time_limit && (
                      <span className="inline-flex items-center px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                        <Clock className="w-3 h-3 mr-1" />
                        {quiz.time_limit}m
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex space-x-3">
                    <Link
                      href={`/dashboard/quiz/${quiz.quiz_id}`}
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </Link>
                    <Link
                      href={`/dashboard/quiz/${quiz.quiz_id}/results`}
                      className="flex items-center space-x-1 text-green-600 hover:text-green-700 text-sm font-medium transition-colors"
                    >
                      <Users className="w-4 h-4" />
                      <span>Results</span>
                    </Link>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <CopyLinkButton 
                      url={`${window.location.origin}/quiz/${quiz.shareable_link}`}
                      text="Copy"
                      className="text-xs px-2 py-1"
                    />
                    <ShareQuiz 
                      quizId={quiz.quiz_id}
                      quizTitle={quiz.title}
                      shareableLink={quiz.shareable_link}
                    />
                  </div>
                </div>
                
                {/* Share Link */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 truncate flex-1 mr-2">
                      <span className="font-medium">Link:</span> {quiz.shareable_link}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
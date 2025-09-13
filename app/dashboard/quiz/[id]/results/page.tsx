'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Quiz, Attempt, Participant } from '@/lib/types'
import toast from 'react-hot-toast'
import { ArrowLeft, Users, Trophy, Clock, Download } from 'lucide-react'

interface AttemptWithParticipant extends Attempt {
    participant: Participant
}

interface ResultsPageProps {
    params: { id: string }
}

export default function QuizResultsPage({ params }: ResultsPageProps) {
    const [quiz, setQuiz] = useState<Quiz | null>(null)
    const [attempts, setAttempts] = useState<AttemptWithParticipant[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalAttempts: 0,
        averageScore: 0,
        averageTime: 0,
        highestScore: 0
    })
    const router = useRouter()

    useEffect(() => {
        checkAuth()
        fetchData()
    }, [params.id])

    const checkAuth = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/auth/login')
        }
    }

    const fetchData = async () => {
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

            // Fetch attempts with participant data, ordered by score (highest first)
            const { data: attemptsData, error: attemptsError } = await supabase
                .from('attempts')
                .select(`
          *,
          participants (*)
        `)
                .eq('quiz_id', params.id)
                .order('score', { ascending: false })
                .order('time_taken', { ascending: true })

            if (attemptsError) {
                toast.error('Failed to load results')
            } else {
                const formattedAttempts = (attemptsData || []).map((attempt: any) => ({
                    ...attempt,
                    participant: attempt.participants
                })) as AttemptWithParticipant[]
                setAttempts(formattedAttempts)

                // Calculate stats
                if (formattedAttempts.length > 0) {
                    const totalScore = formattedAttempts.reduce((sum, attempt) => sum + attempt.score, 0)
                    const totalTime = formattedAttempts.reduce((sum, attempt) => sum + attempt.time_taken, 0)
                    const highestScore = Math.max(...formattedAttempts.map(attempt => attempt.score))

                    setStats({
                        totalAttempts: formattedAttempts.length,
                        averageScore: Math.round(totalScore / formattedAttempts.length),
                        averageTime: Math.round(totalTime / formattedAttempts.length),
                        highestScore
                    })
                }
            }
        } catch (error) {
            toast.error('An error occurred while loading results')
        } finally {
            setLoading(false)
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600'
        if (score >= 60) return 'text-yellow-600'
        return 'text-red-600'
    }

    const exportResults = () => {
        if (attempts.length === 0) {
            toast.error('No results to export')
            return
        }

        const csvContent = [
            ['Participant Name', 'Score (%)', 'Time Taken', 'Attempt Date'].join(','),
            ...attempts.map(attempt => [
                `"${attempt.participant.name}"`,
                attempt.score.toString(),
                `"${formatTime(attempt.time_taken)}"`,
                `"${new Date(attempt.attempt_date).toLocaleString()}"`
            ].join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${quiz?.title || 'quiz'}-results.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)

        toast.success('Results exported successfully!')
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading results...</p>
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
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-4">
                        <div className="flex items-center">
                            <Link href={`/dashboard/quiz/${quiz.quiz_id}`} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mr-4">
                                <ArrowLeft className="w-4 h-4" />
                                <span>Back to Quiz</span>
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Quiz Results</h1>
                                <p className="text-sm text-gray-600">{quiz.title}</p>
                            </div>
                        </div>

                        <button
                            onClick={exportResults}
                            disabled={attempts.length === 0}
                            className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                        >
                            <Download className="w-4 h-4" />
                            <span>Export CSV</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Cards */}
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                    <div className="card text-center">
                        <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900">{stats.totalAttempts}</div>
                        <div className="text-sm text-gray-600">Total Attempts</div>
                    </div>

                    <div className="card text-center">
                        <Trophy className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900">{stats.averageScore}%</div>
                        <div className="text-sm text-gray-600">Average Score</div>
                    </div>

                    <div className="card text-center">
                        <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900">{formatTime(stats.averageTime)}</div>
                        <div className="text-sm text-gray-600">Average Time</div>
                    </div>

                    <div className="card text-center">
                        <Trophy className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900">{stats.highestScore}%</div>
                        <div className="text-sm text-gray-600">Highest Score</div>
                    </div>
                </div>

                {/* Results Table */}
                <div className="card">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold">Participant Results</h2>
                        <span className="text-sm text-gray-600">{attempts.length} attempts</span>
                    </div>

                    {attempts.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No attempts yet</h3>
                            <p className="text-gray-600 mb-6">Share your quiz link to start collecting responses</p>
                            <div className="bg-gray-100 rounded-lg p-4 max-w-md mx-auto">
                                <p className="text-sm text-gray-600 mb-2">Share this link:</p>
                                <code className="text-sm bg-white px-2 py-1 rounded border">
                                    /quiz/{quiz.shareable_link}
                                </code>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Rank & Participant
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Score
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Time Taken
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Attempt Date
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {attempts.map((attempt, index) => (
                                        <tr 
                                            key={attempt.attempt_id} 
                                            className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 transform hover:scale-[1.01] ${
                                                index === 0 ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-400' :
                                                index === 1 ? 'bg-gradient-to-r from-gray-50 to-slate-50 border-l-4 border-gray-400' :
                                                index === 2 ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-orange-400' : ''
                                            }`}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    {/* Rank Badge */}
                                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${
                                                        index === 0 ? 'bg-yellow-400 text-yellow-900' :
                                                        index === 1 ? 'bg-gray-400 text-gray-900' :
                                                        index === 2 ? 'bg-orange-400 text-orange-900' :
                                                        'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                                                    </div>
                                                    
                                                    {/* Profile Photo */}
                                                    {attempt.participant.profile_photo ? (
                                                        <img
                                                            className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-md"
                                                            src={attempt.participant.profile_photo}
                                                            alt={attempt.participant.name}
                                                        />
                                                    ) : (
                                                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center border-2 border-white shadow-md">
                                                            <span className="text-lg font-bold text-white">
                                                                {attempt.participant.name.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                    )}
                                                    
                                                    {/* Name */}
                                                    <div className="ml-4">
                                                        <div className="text-sm font-semibold text-gray-900 flex items-center">
                                                            {attempt.participant.name}
                                                            {index < 3 && (
                                                                <span className="ml-2 text-xs px-2 py-1 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 font-medium">
                                                                    Top {index + 1}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className={`text-lg font-bold ${getScoreColor(attempt.score)} mr-2`}>
                                                        {attempt.score}%
                                                    </div>
                                                    {/* Score bar */}
                                                    <div className="w-20 bg-gray-200 rounded-full h-2">
                                                        <div 
                                                            className={`h-2 rounded-full transition-all duration-1000 ${
                                                                attempt.score >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                                                                attempt.score >= 60 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                                                                'bg-gradient-to-r from-red-400 to-red-600'
                                                            }`}
                                                            style={{ width: `${attempt.score}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 flex items-center">
                                                    <span className="mr-2">⏱️</span>
                                                    {formatTime(attempt.time_taken)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(attempt.attempt_date).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
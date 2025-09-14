'use client'

import Link from 'next/link'
import { BookOpen, Users, Trophy, Sparkles, Zap, Target } from 'lucide-react'
import { useState, useEffect } from 'react'
import ThemeToggle from '@/components/ThemeToggle'

export default function HomePage() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 overflow-hidden">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-300 dark:bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-300 dark:bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-indigo-300 dark:bg-indigo-600 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative container mx-auto px-4 py-16">
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="flex items-center justify-center mb-6">
            <Sparkles className="w-8 h-8 text-yellow-500 mr-3 animate-pulse" />
            <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Quiz Maker
            </h1>
            <Sparkles className="w-8 h-8 text-yellow-500 ml-3 animate-pulse" />
          </div>
          
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Create engaging quizzes with <span className="font-semibold text-indigo-600 dark:text-indigo-400">AI-powered question generation</span> and share them with participants worldwide
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/login" className="group relative btn-primary text-lg px-8 py-4 transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <Zap className="w-5 h-5 mr-2 group-hover:animate-bounce" />
              Create Quiz
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </Link>
            <Link href="/quiz/join" className="group btn-secondary text-lg px-8 py-4 transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <Target className="w-5 h-5 mr-2 group-hover:animate-spin" />
              Join Quiz
            </Link>
          </div>
        </div>

        <div className={`grid md:grid-cols-3 gap-8 max-w-5xl mx-auto transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="group card text-center transform transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:-translate-y-2 cursor-pointer">
            <div className="relative">
              <BookOpen className="w-16 h-16 text-blue-600 mx-auto mb-4 group-hover:animate-bounce transition-all duration-300" />
              <div className="absolute inset-0 bg-blue-100 rounded-full w-20 h-20 mx-auto -z-10 group-hover:scale-110 transition-transform duration-300"></div>
            </div>
            <h3 className="text-xl font-semibold mb-3 group-hover:text-blue-600 transition-colors">AI-Powered Questions</h3>
            <p className="text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
              Generate quiz questions automatically using advanced AI models from Groq Cloud
            </p>
          </div>
          
          <div className="group card text-center transform transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:-translate-y-2 cursor-pointer">
            <div className="relative">
              <Users className="w-16 h-16 text-green-600 mx-auto mb-4 group-hover:animate-pulse transition-all duration-300" />
              <div className="absolute inset-0 bg-green-100 dark:bg-green-900 rounded-full w-20 h-20 mx-auto -z-10 group-hover:scale-110 transition-transform duration-300"></div>
            </div>
            <h3 className="text-xl font-semibold mb-3 group-hover:text-green-600 transition-colors">Easy Sharing</h3>
            <p className="text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
              Share quizzes with unique links. Participants join instantly without accounts
            </p>
          </div>
          
          <div className="group card text-center transform transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:-translate-y-2 cursor-pointer">
            <div className="relative">
              <Trophy className="w-16 h-16 text-yellow-600 mx-auto mb-4 group-hover:animate-bounce transition-all duration-300" />
              <div className="absolute inset-0 bg-yellow-100 dark:bg-yellow-900 rounded-full w-20 h-20 mx-auto -z-10 group-hover:scale-110 transition-transform duration-300"></div>
            </div>
            <h3 className="text-xl font-semibold mb-3 group-hover:text-yellow-600 transition-colors">Real-time Results</h3>
            <p className="text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
              Track participant scores and performance with detailed analytics
            </p>
          </div>
        </div>


      </div>
    </div>
  )
}
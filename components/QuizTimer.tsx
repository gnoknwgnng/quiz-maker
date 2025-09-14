'use client'

import { useState, useEffect } from 'react'
import { Clock, AlertTriangle } from 'lucide-react'

interface QuizTimerProps {
  timeLimit: number // in minutes
  onTimeUp: () => void
  isActive: boolean
}

export default function QuizTimer({ timeLimit, onTimeUp, isActive }: QuizTimerProps) {
  const [timeLeft, setTimeLeft] = useState(timeLimit * 60) // convert to seconds
  const [isWarning, setIsWarning] = useState(false)

  useEffect(() => {
    if (!isActive) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onTimeUp()
          return 0
        }
        
        // Show warning when 5 minutes or less remaining
        if (prev <= 300 && !isWarning) {
          setIsWarning(true)
        }
        
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isActive, onTimeUp, isWarning])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getTimerColor = () => {
    if (timeLeft <= 60) return 'text-red-600 dark:text-red-400' // Last minute
    if (timeLeft <= 300) return 'text-orange-600 dark:text-orange-400' // Last 5 minutes
    return 'text-green-600 dark:text-green-400'
  }

  const getProgressPercentage = () => {
    return ((timeLimit * 60 - timeLeft) / (timeLimit * 60)) * 100
  }

  if (timeLimit <= 0) return null

  return (
    <div className={`fixed top-4 left-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border-2 ${
      isWarning ? 'border-orange-400 animate-pulse' : 'border-gray-200 dark:border-gray-600'
    }`}>
      <div className="flex items-center space-x-3">
        {isWarning ? (
          <AlertTriangle className={`w-5 h-5 ${getTimerColor()}`} />
        ) : (
          <Clock className={`w-5 h-5 ${getTimerColor()}`} />
        )}
        
        <div>
          <div className={`text-lg font-bold ${getTimerColor()}`}>
            {formatTime(timeLeft)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Time Remaining
          </div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="mt-2 w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-1000 ${
            timeLeft <= 60 ? 'bg-red-500' : 
            timeLeft <= 300 ? 'bg-orange-500' : 
            'bg-green-500'
          }`}
          style={{ width: `${getProgressPercentage()}%` }}
        />
      </div>
      
      {isWarning && (
        <div className="mt-2 text-xs text-orange-600 dark:text-orange-400 font-medium">
          ⚠️ Hurry up! Time is running out
        </div>
      )}
    </div>
  )
}
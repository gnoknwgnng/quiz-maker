'use client'

import { Calendar, Clock, User, Tag, Folder } from 'lucide-react'

interface QuizMetadataProps {
  createdAt: string
  totalTime?: number
  category?: string
  tags?: string[]
  difficulty: string
  questionCount?: number
  className?: string
}

export default function QuizMetadata({ 
  createdAt, 
  totalTime, 
  category, 
  tags, 
  difficulty, 
  questionCount,
  className = "" 
}: QuizMetadataProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30'
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30'
      case 'hard': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30'
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30'
    }
  }

  return (
    <div className={`flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 ${className}`}>
      {/* Creation Date */}
      <div className="flex items-center space-x-1">
        <Calendar className="w-4 h-4" />
        <span>Created {formatDate(createdAt)}</span>
      </div>

      {/* Total Time */}
      {totalTime && (
        <div className="flex items-center space-x-1">
          <Clock className="w-4 h-4" />
          <span>Completed in {formatTime(totalTime)}</span>
        </div>
      )}

      {/* Question Count */}
      {questionCount !== undefined && (
        <div className="flex items-center space-x-1">
          <User className="w-4 h-4" />
          <span>{questionCount} questions</span>
        </div>
      )}

      {/* Difficulty */}
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(difficulty)}`}>
        {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
      </span>

      {/* Category */}
      {category && (
        <div className="flex items-center space-x-1">
          <Folder className="w-4 h-4" />
          <span>{category}</span>
        </div>
      )}

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="flex items-center space-x-2">
          <Tag className="w-4 h-4" />
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs"
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-xs">
                +{tags.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
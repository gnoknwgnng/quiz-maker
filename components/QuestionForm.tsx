'use client'

import { useState } from 'react'
import { Trash2, Plus, Image, Upload } from 'lucide-react'

export interface QuestionFormData {
  question_text: string
  question_type: 'multiple_choice' | 'true_false' | 'fill_blank' | 'multi_select'
  options: string[]
  correct_answer: string | string[]
  image_url?: string
  points?: number
}

interface QuestionFormProps {
  question: QuestionFormData
  index: number
  onUpdate: (index: number, field: keyof QuestionFormData, value: any) => void
  onRemove: (index: number) => void
}

export default function QuestionForm({ question, index, onUpdate, onRemove }: QuestionFormProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const questionTypes = [
    { value: 'multiple_choice', label: 'Multiple Choice' },
    { value: 'true_false', label: 'True/False' },
    { value: 'fill_blank', label: 'Fill in the Blank' },
    { value: 'multi_select', label: 'Multi-Select' }
  ]

  const handleTypeChange = (newType: string) => {
    onUpdate(index, 'question_type', newType)
    
    // Reset options based on type
    if (newType === 'true_false') {
      onUpdate(index, 'options', ['True', 'False'])
      onUpdate(index, 'correct_answer', '')
    } else if (newType === 'multiple_choice') {
      onUpdate(index, 'options', ['', '', '', ''])
      onUpdate(index, 'correct_answer', '')
    } else if (newType === 'fill_blank') {
      onUpdate(index, 'options', [])
      onUpdate(index, 'correct_answer', '')
    } else if (newType === 'multi_select') {
      onUpdate(index, 'options', ['', '', '', ''])
      onUpdate(index, 'correct_answer', [])
    }
  }

  const addOption = () => {
    if (question.options.length < 6) {
      onUpdate(index, 'options', [...question.options, ''])
    }
  }

  const removeOption = (optionIndex: number) => {
    if (question.options.length > 2) {
      const newOptions = question.options.filter((_, i) => i !== optionIndex)
      onUpdate(index, 'options', newOptions)
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setImagePreview(result)
        onUpdate(index, 'image_url', result)
      }
      reader.readAsDataURL(file)
    }
  }

  const isCorrectAnswer = (option: string) => {
    if (question.question_type === 'multi_select') {
      return Array.isArray(question.correct_answer) && question.correct_answer.includes(option)
    }
    return question.correct_answer === option
  }

  const toggleMultiSelectAnswer = (option: string) => {
    if (question.question_type === 'multi_select') {
      const currentAnswers = Array.isArray(question.correct_answer) ? question.correct_answer : []
      if (currentAnswers.includes(option)) {
        onUpdate(index, 'correct_answer', currentAnswers.filter(a => a !== option))
      } else {
        onUpdate(index, 'correct_answer', [...currentAnswers, option])
      }
    }
  }

  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-6 hover-lift animate-bounce-in bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-700">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-medium text-gray-900 dark:text-gray-100">Question {index + 1}</h3>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Points: {question.points || 1}
          </span>
          <button
            onClick={() => onRemove(index)}
            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        {/* Question Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Question Text *
          </label>
          <textarea
            className="input-field"
            rows={2}
            placeholder="Enter your question"
            value={question.question_text}
            onChange={(e) => onUpdate(index, 'question_text', e.target.value)}
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Question Image (Optional)
          </label>
          <div className="flex items-center space-x-4">
            <label className="cursor-pointer btn-secondary flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>Upload Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
            {imagePreview && (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Question preview"
                  className="w-20 h-20 object-cover rounded-lg border"
                />
                <button
                  onClick={() => {
                    setImagePreview(null)
                    onUpdate(index, 'image_url', undefined)
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Question Type and Points */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Question Type
            </label>
            <select
              className="input-field"
              value={question.question_type}
              onChange={(e) => handleTypeChange(e.target.value)}
            >
              {questionTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Points
            </label>
            <input
              type="number"
              min="1"
              max="10"
              className="input-field"
              value={question.points || 1}
              onChange={(e) => onUpdate(index, 'points', parseInt(e.target.value) || 1)}
            />
          </div>
        </div>
        
        {/* Options (for multiple choice, true/false, multi-select) */}
        {['multiple_choice', 'true_false', 'multi_select'].includes(question.question_type) && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Options *
              </label>
              {question.question_type === 'multiple_choice' && question.options.length < 6 && (
                <button
                  onClick={addOption}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Option</span>
                </button>
              )}
            </div>
            <div className="space-y-2">
              {question.options.map((option, optIndex) => (
                <div key={optIndex} className="flex items-center space-x-2">
                  {question.question_type === 'multi_select' ? (
                    <input
                      type="checkbox"
                      checked={isCorrectAnswer(option)}
                      onChange={() => toggleMultiSelectAnswer(option)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  ) : (
                    <input
                      type="radio"
                      name={`correct-${index}`}
                      checked={isCorrectAnswer(option)}
                      onChange={() => onUpdate(index, 'correct_answer', option)}
                      className="border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  )}
                  <input
                    type="text"
                    className="input-field flex-1"
                    placeholder={`Option ${optIndex + 1}`}
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...question.options]
                      newOptions[optIndex] = e.target.value
                      onUpdate(index, 'options', newOptions)
                    }}
                    disabled={question.question_type === 'true_false'}
                  />
                  {question.question_type === 'multiple_choice' && question.options.length > 2 && (
                    <button
                      onClick={() => removeOption(optIndex)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fill in the blank */}
        {question.question_type === 'fill_blank' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Correct Answer *
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Enter the correct answer"
              value={question.correct_answer as string}
              onChange={(e) => onUpdate(index, 'correct_answer', e.target.value)}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Use underscores (_____) in your question text to indicate where the blank should be.
            </p>
          </div>
        )}

        {/* Multi-select instructions */}
        {question.question_type === 'multi_select' && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              💡 <strong>Multi-Select:</strong> Check all correct answers above. Participants can select multiple options.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
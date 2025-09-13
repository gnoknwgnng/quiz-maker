'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload } from 'lucide-react'
import toast from 'react-hot-toast'

export default function JoinQuizPage() {
  const [quizLink, setQuizLink] = useState('')
  const [participantName, setParticipantName] = useState('')
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Photo must be less than 5MB')
        return
      }
      
      setProfilePhoto(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoPreview(event.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const joinQuiz = async () => {
    if (!quizLink.trim()) {
      toast.error('Please enter a quiz link')
      return
    }
    
    if (!participantName.trim()) {
      toast.error('Please enter your name')
      return
    }

    // Extract quiz ID from link
    let quizId = ''
    try {
      if (quizLink.includes('/quiz/')) {
        quizId = quizLink.split('/quiz/')[1].split('?')[0]
      } else if (quizLink.startsWith('quiz-')) {
        quizId = quizLink
      } else {
        toast.error('Invalid quiz link format')
        return
      }
    } catch (error) {
      toast.error('Invalid quiz link')
      return
    }

    setLoading(true)
    
    // Store participant data in localStorage for now
    const participantData = {
      name: participantName.trim(),
      profilePhoto: photoPreview,
      joinedAt: new Date().toISOString()
    }
    
    localStorage.setItem('participant', JSON.stringify(participantData))
    
    // Redirect to quiz
    router.push(`/quiz/${quizId}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mr-4">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Join Quiz</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Ready to take a quiz?
            </h2>
            <p className="text-gray-600">
              Enter the quiz link and your details to get started
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quiz Link *
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Paste the quiz link here or enter quiz ID"
                value={quizLink}
                onChange={(e) => setQuizLink(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Example: https://yoursite.com/quiz/quiz-123456 or just quiz-123456
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name *
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Enter your full name"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Photo (Optional)
              </label>
              <div className="flex items-center space-x-4">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Profile preview"
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="btn-secondary cursor-pointer inline-flex items-center space-x-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Choose Photo</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Max 5MB. JPG, PNG, or GIF
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={joinQuiz}
              disabled={loading}
              className="w-full btn-primary py-3 text-lg"
            >
              {loading ? 'Joining Quiz...' : 'Join Quiz'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
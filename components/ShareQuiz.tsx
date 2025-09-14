'use client'

import { useState } from 'react'
import { Share2, Copy, Facebook, Twitter, MessageCircle, Mail, Check } from 'lucide-react'
import toast from 'react-hot-toast'

interface ShareQuizProps {
  quizId: string
  quizTitle: string
  shareableLink: string
}

export default function ShareQuiz({ quizId, quizTitle, shareableLink }: ShareQuizProps) {
  const [copied, setCopied] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)

  const quizUrl = `${window.location.origin}/quiz/${shareableLink}`
  const shareText = `Check out this quiz: "${quizTitle}" - Test your knowledge!`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(quizUrl)
      setCopied(true)
      toast.success('Quiz link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const shareOnFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(quizUrl)}&quote=${encodeURIComponent(shareText)}`
    window.open(url, '_blank', 'width=600,height=400')
  }

  const shareOnTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(quizUrl)}`
    window.open(url, '_blank', 'width=600,height=400')
  }

  const shareOnWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${quizUrl}`)}`
    window.open(url, '_blank')
  }

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Quiz: ${quizTitle}`)
    const body = encodeURIComponent(`${shareText}\n\nTake the quiz here: ${quizUrl}`)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  const shareViaWebAPI = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Quiz: ${quizTitle}`,
          text: shareText,
          url: quizUrl,
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      setShowShareMenu(true)
    }
  }

  return (
    <div className="relative">
      {/* Main Share Button */}
      <button
        onClick={shareViaWebAPI}
        className="btn-primary flex items-center space-x-2 hover:scale-105 transition-transform duration-300"
      >
        <Share2 className="w-4 h-4" />
        <span>Share Quiz</span>
      </button>

      {/* Share Menu (fallback for browsers without Web Share API) */}
      {showShareMenu && (
        <div className="absolute top-full mt-2 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 p-4 z-50 min-w-80">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Share Quiz</h3>
            <button
              onClick={() => setShowShareMenu(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ×
            </button>
          </div>

          {/* Copy Link */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quiz Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={quizUrl}
                readOnly
                className="input-field flex-1 text-sm"
              />
              <button
                onClick={copyToClipboard}
                className="btn-secondary px-3 flex items-center space-x-1"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Share on social media
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={shareOnFacebook}
                className="flex items-center space-x-2 p-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-300"
              >
                <Facebook className="w-4 h-4" />
                <span className="text-sm">Facebook</span>
              </button>
              
              <button
                onClick={shareOnTwitter}
                className="flex items-center space-x-2 p-3 rounded-lg bg-sky-500 hover:bg-sky-600 text-white transition-colors duration-300"
              >
                <Twitter className="w-4 h-4" />
                <span className="text-sm">Twitter</span>
              </button>
              
              <button
                onClick={shareOnWhatsApp}
                className="flex items-center space-x-2 p-3 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors duration-300"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm">WhatsApp</span>
              </button>
              
              <button
                onClick={shareViaEmail}
                className="flex items-center space-x-2 p-3 rounded-lg bg-gray-600 hover:bg-gray-700 text-white transition-colors duration-300"
              >
                <Mail className="w-4 h-4" />
                <span className="text-sm">Email</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {showShareMenu && (
        <div
          className="fixed inset-0 bg-black bg-opacity-25 z-40"
          onClick={() => setShowShareMenu(false)}
        />
      )}
    </div>
  )
}
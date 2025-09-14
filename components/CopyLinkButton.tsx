'use client'

import { useState } from 'react'
import { Copy, Check, Link } from 'lucide-react'
import toast from 'react-hot-toast'

interface CopyLinkButtonProps {
  url: string
  text?: string
  className?: string
}

export default function CopyLinkButton({ url, text = "Copy Link", className = "" }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Link copied to clipboard! 📋')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      
      setCopied(true)
      toast.success('Link copied to clipboard! 📋')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={copyToClipboard}
      className={`btn-secondary flex items-center space-x-2 hover:scale-105 transition-all duration-300 ${className}`}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-green-600" />
          <span className="text-green-600">Copied!</span>
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          <span>{text}</span>
        </>
      )}
    </button>
  )
}
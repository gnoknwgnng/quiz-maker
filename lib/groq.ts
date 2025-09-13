const GROQ_API_KEY = process.env.GROQ_API_KEY || ''
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export interface GeneratedQuestion {
  question: string
  type: 'multiple_choice' | 'true_false'
  options?: string[]
  correct_answer: string
}

export async function generateQuestions(
  topic: string,
  difficulty: string,
  count: number,
  model: string
): Promise<GeneratedQuestion[]> {
  // Check if API key is available
  if (!GROQ_API_KEY) {
    throw new Error('Groq API key is not configured. Please check your environment variables.')
  }

  const prompt = `Generate ${count} ${difficulty} level quiz questions about ${topic}. 
  
  Return ONLY a valid JSON array with this exact format:
  [
    {
      "question": "Question text here?",
      "type": "multiple_choice",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A"
    }
  ]
  
  Rules:
  - Mix multiple choice and true/false questions
  - For multiple choice: provide exactly 4 options
  - For true/false: use options ["True", "False"]
  - Make questions clear and unambiguous
  - Ensure correct_answer matches exactly one of the options
  - No explanations, just the JSON array`

  try {
    console.log('Making request to Groq API with model:', model)
    
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    })

    console.log('Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Groq API error response:', errorText)
      
      // If API fails, return fallback questions
      console.log('API failed, using fallback questions')
      return getFallbackQuestions(topic, count)
    }

    const data = await response.json()
    console.log('Groq API response:', data)
    
    const content = data.choices[0]?.message?.content

    if (!content) {
      console.log('No content received, using fallback questions')
      return getFallbackQuestions(topic, count)
    }

    // Clean the content and parse JSON
    let cleanContent = content.trim()
    
    // Remove any markdown code blocks if present
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/```json\n?/, '').replace(/\n?```$/, '')
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/```\n?/, '').replace(/\n?```$/, '')
    }

    console.log('Cleaned content:', cleanContent)

    const questions = JSON.parse(cleanContent)
    
    if (!Array.isArray(questions)) {
      console.log('Invalid response format, using fallback questions')
      return getFallbackQuestions(topic, count)
    }

    // Validate question format
    const validQuestions = questions.filter(q => 
      q.question && q.type && q.options && q.correct_answer
    )

    if (validQuestions.length === 0) {
      console.log('No valid questions received, using fallback questions')
      return getFallbackQuestions(topic, count)
    }

    return validQuestions
  } catch (error) {
    console.error('Error generating questions:', error)
    
    // Always provide fallback questions if anything fails
    console.log('Exception occurred, using fallback questions')
    return getFallbackQuestions(topic, count)
  }
}

// Fallback questions when API fails
function getFallbackQuestions(topic: string, count: number): GeneratedQuestion[] {
  const fallbackQuestions: GeneratedQuestion[] = [
    {
      question: `What is a fundamental concept in ${topic}?`,
      type: 'multiple_choice',
      options: ['Basic principles', 'Advanced theories', 'Historical context', 'Future applications'],
      correct_answer: 'Basic principles'
    },
    {
      question: `Is ${topic} considered an important field of study?`,
      type: 'true_false',
      options: ['True', 'False'],
      correct_answer: 'True'
    },
    {
      question: `Which approach is commonly used in ${topic}?`,
      type: 'multiple_choice',
      options: ['Systematic methodology', 'Random approach', 'Intuitive guessing', 'Avoiding the subject'],
      correct_answer: 'Systematic methodology'
    },
    {
      question: `Does ${topic} require continuous learning and practice?`,
      type: 'true_false',
      options: ['True', 'False'],
      correct_answer: 'True'
    },
    {
      question: `What is the best way to master ${topic}?`,
      type: 'multiple_choice',
      options: ['Regular practice and study', 'Memorizing facts only', 'Avoiding difficult concepts', 'Relying on luck'],
      correct_answer: 'Regular practice and study'
    }
  ]

  return fallbackQuestions.slice(0, Math.min(count, fallbackQuestions.length))
}
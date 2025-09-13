import { NextRequest, NextResponse } from 'next/server'

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

interface GeneratedQuestion {
  question: string
  type: 'multiple_choice' | 'true_false'
  options?: string[]
  correct_answer: string
}

// Fallback questions when API fails
function getFallbackQuestions(topic: string, count: number): GeneratedQuestion[] {
  const topicLower = topic.toLowerCase()
  
  // Topic-specific question templates
  const getTopicQuestions = (topic: string) => {
    if (topicLower.includes('javascript') || topicLower.includes('js')) {
      return [
        {
          question: 'What is the correct way to declare a variable in JavaScript?',
          type: 'multiple_choice' as const,
          options: ['var myVar = 5;', 'variable myVar = 5;', 'v myVar = 5;', 'declare myVar = 5;'],
          correct_answer: 'var myVar = 5;'
        },
        {
          question: 'JavaScript is a compiled language.',
          type: 'true_false' as const,
          options: ['True', 'False'],
          correct_answer: 'False'
        },
        {
          question: 'Which method is used to add an element to the end of an array?',
          type: 'multiple_choice' as const,
          options: ['push()', 'add()', 'append()', 'insert()'],
          correct_answer: 'push()'
        }
      ]
    }
    
    if (topicLower.includes('python')) {
      return [
        {
          question: 'What is the correct file extension for Python files?',
          type: 'multiple_choice' as const,
          options: ['.py', '.python', '.pt', '.pyt'],
          correct_answer: '.py'
        },
        {
          question: 'Python is case-sensitive.',
          type: 'true_false' as const,
          options: ['True', 'False'],
          correct_answer: 'True'
        },
        {
          question: 'Which function is used to display output in Python?',
          type: 'multiple_choice' as const,
          options: ['print()', 'echo()', 'display()', 'show()'],
          correct_answer: 'print()'
        }
      ]
    }
    
    if (topicLower.includes('history')) {
      return [
        {
          question: 'World War II ended in which year?',
          type: 'multiple_choice' as const,
          options: ['1944', '1945', '1946', '1947'],
          correct_answer: '1945'
        },
        {
          question: 'The Great Wall of China was built to keep out invaders.',
          type: 'true_false' as const,
          options: ['True', 'False'],
          correct_answer: 'True'
        },
        {
          question: 'Who was the first person to walk on the moon?',
          type: 'multiple_choice' as const,
          options: ['Neil Armstrong', 'Buzz Aldrin', 'John Glenn', 'Alan Shepard'],
          correct_answer: 'Neil Armstrong'
        }
      ]
    }
    
    if (topicLower.includes('science') || topicLower.includes('physics') || topicLower.includes('chemistry')) {
      return [
        {
          question: 'What is the chemical symbol for water?',
          type: 'multiple_choice' as const,
          options: ['H2O', 'HO2', 'H3O', 'OH2'],
          correct_answer: 'H2O'
        },
        {
          question: 'Light travels faster than sound.',
          type: 'true_false' as const,
          options: ['True', 'False'],
          correct_answer: 'True'
        },
        {
          question: 'How many planets are in our solar system?',
          type: 'multiple_choice' as const,
          options: ['7', '8', '9', '10'],
          correct_answer: '8'
        }
      ]
    }
    
    // Generic fallback questions
    return [
      {
        question: `What is a fundamental concept in ${topic}?`,
        type: 'multiple_choice' as const,
        options: ['Basic principles', 'Advanced theories', 'Historical context', 'Future applications'],
        correct_answer: 'Basic principles'
      },
      {
        question: `Is ${topic} considered an important field of study?`,
        type: 'true_false' as const,
        options: ['True', 'False'],
        correct_answer: 'True'
      },
      {
        question: `Which approach is commonly used in ${topic}?`,
        type: 'multiple_choice' as const,
        options: ['Systematic methodology', 'Random approach', 'Intuitive guessing', 'Avoiding the subject'],
        correct_answer: 'Systematic methodology'
      },
      {
        question: `Does ${topic} require continuous learning and practice?`,
        type: 'true_false' as const,
        options: ['True', 'False'],
        correct_answer: 'True'
      },
      {
        question: `What is the best way to master ${topic}?`,
        type: 'multiple_choice' as const,
        options: ['Regular practice and study', 'Memorizing facts only', 'Avoiding difficult concepts', 'Relying on luck'],
        correct_answer: 'Regular practice and study'
      }
    ]
  }
  
  const topicQuestions = getTopicQuestions(topic)
  
  // Add more generic questions if needed
  const additionalQuestions: GeneratedQuestion[] = [
    {
      question: `Which of the following is most important when learning ${topic}?`,
      type: 'multiple_choice',
      options: ['Practice and repetition', 'Memorizing definitions', 'Reading only', 'Avoiding challenges'],
      correct_answer: 'Practice and repetition'
    },
    {
      question: `${topic} concepts can be applied in real-world scenarios.`,
      type: 'true_false',
      options: ['True', 'False'],
      correct_answer: 'True'
    },
    {
      question: `What is the best resource for learning ${topic}?`,
      type: 'multiple_choice',
      options: ['Multiple sources and practice', 'Single textbook only', 'Videos only', 'Theory without practice'],
      correct_answer: 'Multiple sources and practice'
    }
  ]
  
  const allQuestions = [...topicQuestions, ...additionalQuestions]
  return allQuestions.slice(0, Math.min(count, allQuestions.length))
}

export async function POST(request: NextRequest) {
  try {
    const { topic, difficulty, count, model } = await request.json()

    // Validate input
    if (!topic || !difficulty || !count || !model) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Check if API key is available
    if (!GROQ_API_KEY) {
      console.log('Groq API key not configured, using fallback questions')
      const fallbackQuestions = getFallbackQuestions(topic, count)
      return NextResponse.json({ 
        questions: fallbackQuestions,
        source: 'fallback',
        message: 'Using sample questions (AI API key not configured)'
      })
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
      const fallbackQuestions = getFallbackQuestions(topic, count)
      return NextResponse.json({ 
        questions: fallbackQuestions,
        source: 'fallback',
        message: 'AI generation failed, using sample questions'
      })
    }

    const data = await response.json()
    console.log('Groq API response:', data)
    
    const content = data.choices[0]?.message?.content

    if (!content) {
      console.log('No content received, using fallback questions')
      const fallbackQuestions = getFallbackQuestions(topic, count)
      return NextResponse.json({ 
        questions: fallbackQuestions,
        source: 'fallback',
        message: 'No AI response received, using sample questions'
      })
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
      const fallbackQuestions = getFallbackQuestions(topic, count)
      return NextResponse.json({ 
        questions: fallbackQuestions,
        source: 'fallback',
        message: 'Invalid AI response format, using sample questions'
      })
    }

    // Validate question format
    const validQuestions = questions.filter(q => 
      q.question && q.type && q.options && q.correct_answer
    )

    if (validQuestions.length === 0) {
      console.log('No valid questions received, using fallback questions')
      const fallbackQuestions = getFallbackQuestions(topic, count)
      return NextResponse.json({ 
        questions: fallbackQuestions,
        source: 'fallback',
        message: 'No valid AI questions received, using sample questions'
      })
    }

    return NextResponse.json({ 
      questions: validQuestions,
      source: 'ai',
      message: `Generated ${validQuestions.length} AI questions successfully`
    })

  } catch (error) {
    console.error('Error in generate-questions API:', error)
    
    // Always provide fallback questions if anything fails
    const { topic, count } = await request.json().catch(() => ({ topic: 'General Knowledge', count: 5 }))
    const fallbackQuestions = getFallbackQuestions(topic, count)
    
    return NextResponse.json({ 
      questions: fallbackQuestions,
      source: 'fallback',
      message: 'Error occurred, using sample questions'
    })
  }
}
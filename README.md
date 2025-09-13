# Quiz Maker - Full-Stack Quiz Application

A modern, full-stack quiz maker application built with Next.js, Supabase, and AI-powered question generation using Groq Cloud API.

## Features

### For Quiz Creators (Admins)
- **Authentication**: Secure login/signup with Supabase Auth
- **AI Question Generation**: Generate quiz questions using Groq Cloud API with multiple AI models
- **Quiz Management**: Create, view, edit, and delete quizzes
- **Manual Question Creation**: Add custom questions alongside AI-generated ones
- **Results Dashboard**: View participant attempts, scores, and analytics
- **Export Results**: Download quiz results as CSV files
- **Shareable Links**: Generate unique links for quiz distribution

### For Participants
- **No Account Required**: Join quizzes with just name and optional profile photo
- **Interactive Quiz Taking**: Clean, responsive quiz interface
- **Real-time Progress**: Track progress and time during quiz
- **Instant Results**: View scores and performance immediately after completion
- **Question Navigation**: Jump between questions and review answers

### AI Integration
- **Multiple AI Models**: Choose from 8 different Groq Cloud models
- **Smart Question Generation**: Generate questions based on topic and difficulty
- **Mixed Question Types**: Support for multiple choice and true/false questions

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: TailwindCSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **AI**: Groq Cloud API
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## Database Schema

The application uses the following Supabase tables:

- `quizzes`: Quiz metadata and settings
- `questions`: Quiz questions with options and correct answers
- `participants`: Participant information (name, profile photo)
- `attempts`: Quiz attempt records with scores and timing
- `answers`: Individual question responses

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project
- A Groq Cloud API account

### 1. Clone and Install

```bash
git clone <repository-url>
cd quiz-maker
npm install
```

### 2. Environment Setup

Create a `.env.local` file in your project root:

```bash
# Required - Supabase Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional - AI Question Generation (fallback questions used if not provided)
GROQ_API_KEY=your_groq_api_key

# Optional - Analytics
NEXT_PUBLIC_GA_ID=your_google_analytics_id
```

### Getting API Keys:

1. **Supabase** (Required):
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Go to Settings > API
   - Copy the Project URL and anon/public key

2. **Groq AI** (Optional):
   - Go to [console.groq.com](https://console.groq.com)
   - Create an account and get your API key
   - If not provided, the app will use sample questions

3. **Google Analytics** (Optional):
   - Create a GA4 property
   - Get your Measurement ID (G-XXXXXXXXXX)

**Note:** The app works without the Groq API key by using intelligent fallback questions.

### 3. Database Setup

Ensure your Supabase database has the following tables created:

```sql
-- Quizzes table
CREATE TABLE quizzes (
  quiz_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  shareable_link TEXT UNIQUE NOT NULL,
  expiry_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions table
CREATE TABLE questions (
  question_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID REFERENCES quizzes(quiz_id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer')) NOT NULL,
  options TEXT[],
  correct_answer TEXT NOT NULL
);

-- Participants table
CREATE TABLE participants (
  participant_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  profile_photo TEXT,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attempts table
CREATE TABLE attempts (
  attempt_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID REFERENCES quizzes(quiz_id) ON DELETE CASCADE NOT NULL,
  participant_id UUID REFERENCES participants(participant_id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL,
  time_taken INTEGER NOT NULL,
  attempt_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Answers table
CREATE TABLE answers (
  answer_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id UUID REFERENCES attempts(attempt_id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES questions(question_id) ON DELETE CASCADE NOT NULL,
  selected_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL
);
```

### 4. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Usage Guide

### Creating a Quiz

1. **Sign Up/Login**: Create an account or login at `/auth/signup` or `/auth/login`
2. **Create Quiz**: Go to dashboard and click "Create New Quiz"
3. **Fill Details**: Enter quiz title, topic, and difficulty
4. **Generate Questions**: 
   - Select an AI model from the dropdown
   - Set number of questions (1-20)
   - Click "Generate Questions" to create AI-powered questions
   - Or manually add questions using "Add Manual Question"
5. **Review & Edit**: Review generated questions and edit as needed
6. **Create**: Click "Create Quiz" to save

### Sharing a Quiz

1. **Get Share Link**: From the quiz view page, copy the shareable link
2. **Share**: Send the link to participants via email, social media, etc.
3. **Monitor**: View real-time results in the Results dashboard

### Taking a Quiz

1. **Join**: Visit `/quiz/join` or use the shared link
2. **Enter Details**: Provide name and optional profile photo
3. **Take Quiz**: Answer questions at your own pace
4. **Submit**: Review answers and submit when ready
5. **View Results**: See your score and performance immediately

## Available AI Models

The application supports 8 different Groq Cloud models:

1. **Llama 4 Scout 17B** - `meta-llama/llama-4-scout-17b-16e-instruct`
2. **Llama 4 Maverick 17B** - `meta-llama/llama-4-maverick-17b-128e-instruct`
3. **Llama Guard 4 12B** - `meta-llama/llama-guard-4-12b`
4. **Llama Prompt Guard 2 22M** - `meta-llama/llama-prompt-guard-2-22m`
5. **GPT OSS 120B** - `openai/gpt-oss-120b`
6. **GPT OSS 20B** - `openai/gpt-oss-20b`
7. **Qwen3 32B** - `qwen/qwen3-32b`
8. **Llama Prompt Guard 2 86M** - `meta-llama/llama-prompt-guard-2-86m`

## Project Structure

```
quiz-maker/
├── app/                          # Next.js app directory
│   ├── auth/                     # Authentication pages
│   ├── dashboard/                # Quiz creator dashboard
│   ├── quiz/                     # Quiz taking and results
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── lib/                          # Utility libraries
│   ├── supabase.ts              # Supabase client
│   ├── groq.ts                  # Groq API integration
│   └── types.ts                 # TypeScript types
├── components/                   # Reusable components (if needed)
└── public/                       # Static assets
```

## Key Features Explained

### AI Question Generation
- Uses Groq Cloud API for generating contextual questions
- Supports multiple AI models for different question styles
- Automatically formats questions with options and correct answers
- Handles both multiple choice and true/false question types

### Real-time Quiz Taking
- Progress tracking with visual indicators
- Timer functionality to track time spent
- Question navigation allowing users to jump between questions
- Answer validation and submission handling

### Results Analytics
- Comprehensive statistics for quiz creators
- Individual participant performance tracking
- Export functionality for data analysis
- Visual score representations with color coding

### Security & Performance
- Supabase Row Level Security (RLS) for data protection
- Optimized database queries with proper indexing
- Client-side validation with server-side verification
- Responsive design for all device types

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically with zero configuration

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- Heroku
- AWS Amplify

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the existing issues on GitHub
2. Create a new issue with detailed description
3. Include steps to reproduce any bugs

## Roadmap

Future enhancements planned:
- [ ] Question categories and tags
- [ ] Timed quizzes with auto-submission
- [ ] Quiz templates and sharing
- [ ] Advanced analytics and reporting
- [ ] Mobile app development
- [ ] Integration with learning management systems
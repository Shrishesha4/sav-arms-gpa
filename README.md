# ARMS GPA Calculator

An intelligent CGPA calculator web application with AI-powered grade extraction from transcript screenshots and direct portal integration for Saveetha University students.

## Overview

ARMS GPA is a modern web application designed to help students calculate their Cumulative Grade Point Average (CGPA) with ease. The application features two primary methods of data input:
1. **Portal Login**: Direct integration with the Saveetha ARMS portal to automatically fetch and organize course grades
2. **AI-Powered Screenshot Analysis**: Upload transcript screenshots and let AI extract course information using Google's Gemini API

## Key Features

- **🌐 Portal Integration**: Direct login to Saveetha ARMS portal to automatically fetch course data
- **🤖 AI-Powered Grade Extraction**: Upload transcript screenshots and leverage Gemini AI to automatically extract course codes, names, grades, and credits
- **📊 Real-Time CGPA Calculation**: Automatic calculation based on the standard grade scale (S=9.5, A=8.5, B=7.5, C=6.5, D=5.5, F=0)
- **📈 Statistics Dashboard**: Comprehensive overview showing overall CGPA, total credits, subjects count, and failed subjects
- **✏️ Manual Data Entry**: Interactive course management with add, edit, and delete capabilities
- **📱 Responsive Design**: Fully responsive interface that works seamlessly on desktops, tablets, and smartphones
- **🎨 Modern UI**: Clean, intuitive interface built with shadcn/ui components and Tailwind CSS
- **🗓️ Year-Based Organization**: Courses automatically organized by academic year
- **💾 Progressive Web App**: Installable PWA with offline capabilities

## Technology Stack

### Frontend
- **Next.js 15.3.3**: React framework with App Router
- **React 18.3.1**: UI library
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality UI component library built on Radix UI
- **Lucide React**: Icon library
- **React Hook Form**: Form state management with Zod validation

### Backend & AI
- **Genkit 1.14.1**: AI integration framework
- **Google AI (Gemini)**: AI model for transcript analysis
- **Next.js API Routes**: Serverless API endpoints
- **Cheerio**: HTML parsing for portal scraping

### UI Components
- Radix UI primitives (Dialog, Dropdown, Toast, Tabs, etc.)
- Custom components for course management and dashboard visualization
- Recharts for data visualization

### Deployment
- **Firebase App Hosting**: Production deployment platform
- **PWA Support**: Service worker for offline functionality

## Project Structure

```
sav-arms-gpa/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── scrape/        # Portal scraping endpoint
│   │   │   └── debug-portal/  # Debug endpoint
│   │   ├── page.tsx           # Main application page
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui base components
│   │   ├── Header.tsx        # Application header
│   │   ├── PortalLogin.tsx   # Portal login form
│   │   ├── TranscriptUploader.tsx  # Screenshot upload
│   │   ├── CourseManager.tsx # Course CRUD interface
│   │   └── ResultsDashboard.tsx    # CGPA statistics
│   ├── ai/                   # AI/Genkit configuration
│   │   ├── flows/            # AI workflows
│   │   ├── genkit.ts         # Genkit setup
│   │   └── dev.ts            # Development server
│   ├── lib/                  # Utility functions
│   ├── hooks/                # Custom React hooks
│   └── types/                # TypeScript type definitions
├── public/                   # Static assets
│   ├── manifest.json         # PWA manifest
│   └── sw.js                 # Service worker
├── docs/                     # Documentation
│   └── blueprint.md          # Project blueprint
├── apphosting.yaml           # Firebase App Hosting config
├── next.config.ts            # Next.js configuration
├── tailwind.config.ts        # Tailwind CSS configuration
└── package.json              # Dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm or yarn package manager
- Google AI API key (for AI transcript extraction feature)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Shrishesha4/sav-arms-gpa.git
cd sav-arms-gpa
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (optional, for AI features):
Create a `.env.local` file in the root directory:
```env
GOOGLE_GENAI_API_KEY=your_google_ai_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:9002](http://localhost:9002) in your browser

### Development Commands

- `npm run dev` - Start development server on port 9002 with Turbopack
- `npm run build` - Build the production application
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run genkit:dev` - Start Genkit AI development server
- `npm run genkit:watch` - Start Genkit AI server in watch mode

## Usage

### Portal Login Method

1. Navigate to the "Portal Login" tab
2. Enter your Saveetha ARMS portal credentials
3. Click "Fetch from Portal"
4. Courses will be automatically fetched and organized by year
5. Review and adjust grades as needed

### Screenshot Upload Method

1. Navigate to the "Upload Screenshot" tab
2. Enter your Google AI API key (stored locally in browser)
3. Upload a screenshot of your transcript (drag & drop or click to browse)
4. AI will automatically extract course information
5. Review extracted data and assign courses to appropriate years

### Manual Course Management

- **Add Year**: Click "Add Academic Year" to create a new year section
- **Add Course**: Click "Add Course" within any year to add a new course entry
- **Edit Course**: Click on any course field to edit course code, name, credits, or grade
- **Delete Course**: Click the delete button to remove a course

### Understanding the Dashboard

The Results Dashboard displays:
- **Overall CGPA**: Calculated based on all courses (excluding 'NA' grades)
- **Total Credits**: Sum of all course credits
- **Subjects**: Total number of courses
- **Failed Subjects**: Count of courses with 'F' grade

### Grade Scale

- **S**: 9.5 (Outstanding)
- **A**: 8.5 (Excellent)
- **B**: 7.5 (Very Good)
- **C**: 6.5 (Good)
- **D**: 5.5 (Satisfactory)
- **F**: 0 (Fail)
- **NA**: Not graded/Not applicable

## Deployment

The application is configured for deployment on Firebase App Hosting.

### Firebase Deployment

1. Ensure you have the Firebase CLI installed:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Deploy the application:
```bash
firebase deploy
```

Configuration is managed in `apphosting.yaml` with a maximum of 1 instance by default.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- AI powered by [Google Gemini](https://ai.google.dev/)
- Icons from [Lucide](https://lucide.dev/)

## Support

For issues, questions, or contributions, please visit the [GitHub repository](https://github.com/Shrishesha4/sav-arms-gpa).

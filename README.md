# Vitb Notes

Vitb Notes is an intelligent study companion designed to help students generate, organize, and study course notes effectively. Leveraging the power of Google's Gemini AI, it transforms course syllabi and reference materials (PDFs, PPTs) into structured, comprehensive study guides and interactive quizzes.

## 🚀 Features

-   **AI-Powered Note Generation**: Automatically generate detailed notes based on your course syllabus and reference files.
-   **Smart Parsing**: Extracts content from PDFs and images using advanced parsing libraries (PDF.js, Tesseract.js).
-   **Interactive Quizzes**: Auto-generated multiple-choice quizzes to test your knowledge.
-   **Mermaid Diagrams**: Visualizes complex concepts with automatically generated flowcharts and diagrams.
-   **Responsive Design**: Beautiful, dark-mode compatible UI built with Shadcn UI and Tailwind CSS.
-   **Feedback System**: Integrated contact form to send feedback and feature requests directly to the developers.

## 🛠️ Tech Stack

-   **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **UI Components**: [Shadcn UI](https://ui.shadcn.com/) (Radix UI)
-   **Database**: [PostgreSQL](https://www.postgresql.org/)
-   **ORM**: [Prisma](https://www.prisma.io/)
-   **Authentication**: [Better Auth](https://www.better-auth.com/)
-   **AI Model**: [Google Gemini 2.0 Flash](https://deepmind.google/technologies/gemini/)
-   **Email**: [Nodemailer](https://nodemailer.com/)
-   **File Processing**: `pdfjs-dist`, `office-text-extractor`, `tesseract.js`

## 📂 Project Structure

```
vitb-notes/
├── prisma/                 # Database schema and migrations
├── public/                 # Static assets
├── scripts/                # Utility scripts (e.g., database cleanup)
├── src/
│   ├── app/                # Next.js App Router pages and API routes
│   │   ├── api/            # Backend API endpoints (generate, contact, auth)
│   │   ├── generate/       # Note generation page
│   │   ├── notes/          # Notes display and management
│   │   └── page.tsx        # Landing page
│   ├── components/
│   │   ├── common/         # Shared components (Navbar, Footer)
│   │   ├── generate/       # Components for note generation form
│   │   ├── landing/        # Landing page sections (Hero, Features, Contact)
│   │   ├── note/           # Note display components (Content, Quiz, TOC)
│   │   └── ui/             # Shadcn UI reusable components
│   ├── lib/                # Utility functions and configurations
│   │   ├── auth.ts         # Authentication setup
│   │   ├── gemini.ts       # AI generation logic
│   │   └── parsing.ts      # File parsing logic
│   └── types/              # TypeScript type definitions
├── .env                    # Environment variables
├── next.config.ts          # Next.js configuration
├── package.json            # Project dependencies
└── README.md               # Project documentation
```

## ⚡ Getting Started

### Prerequisites

-   Node.js (v18 or higher)
-   PostgreSQL database
-   Google Gemini API Key

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/nikhildhanda04/vitb-notes.git
    cd vitb-notes
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up environment variables:**

    Create a `.env` file in the root directory and add the following:

    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/vitb_notes"
    GEMINI_API_KEY="your-gemini-api-key"
    BETTER_AUTH_SECRET="your-auth-secret"
    BETTER_AUTH_URL="http://localhost:3000"
    SMTP_USER="your-email@gmail.com"
    SMTP_PASS="your-app-password"
    ```

4.  **Initialize the database:**

    ```bash
    npx prisma generate
    npx prisma db push
    ```

5.  **Run the development server:**

    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

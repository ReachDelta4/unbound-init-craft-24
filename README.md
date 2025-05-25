# Meeting Mojo UI

A modern, collaborative meeting assistant web application.

## Project Overview

Meeting Mojo UI is a React-based web app designed to enhance online meetings with features like real-time note-taking, screen sharing, meeting insights, and seamless collaboration. Built for scalability and maintainability, it leverages modern tools and best practices for a clean developer experience.

## Features
- Real-time meeting management and controls
- Collaborative notes and insights panel
- Screen sharing and call timer
- User authentication and profile management
- Meeting summaries and export (DOCX, PDF)
- Responsive, accessible UI with dark mode

## Directory Structure

```
├── public/                # Static assets
├── src/
│   ├── components/        # Reusable UI and meeting components
│   ├── contexts/          # React context providers (e.g., Auth)
│   ├── hooks/             # Custom React hooks (meeting, notes, WebRTC, etc.)
│   ├── integrations/      # External service integrations (e.g., Supabase)
│   ├── lib/               # Utility functions and libraries
│   ├── pages/             # Route-based page components
│   └── index.css          # Global styles
├── supabase/              # Supabase config
├── package.json           # Project metadata and scripts
├── tailwind.config.ts     # Tailwind CSS configuration
├── vite.config.ts         # Vite build configuration
└── README.md              # Project documentation
```

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install
# or
yarn install
```

### Development

```sh
# Start the development server
npm run dev
# or
yarn dev
```

- The app will be available at `http://localhost:8080` by default.
- Hot reloading is enabled for rapid development.

### Linting & Formatting

```sh
npm run lint
# or
yarn lint
```

## Technologies Used
- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) (build tool)
- [Tailwind CSS](https://tailwindcss.com/) (utility-first styling)
- [shadcn/ui](https://ui.shadcn.com/) (UI components)
- [Supabase](https://supabase.com/) (backend/auth)
- [React Router](https://reactrouter.com/)
- [@tanstack/react-query](https://tanstack.com/query/latest) (data fetching)
- [Radix UI](https://www.radix-ui.com/) (accessible primitives)

## Deployment

You can deploy the app using [Lovable](https://lovable.dev/) or your preferred platform:

- Open [Lovable Project](https://lovable.dev/projects/ee1d8878-dd6d-4f75-8e03-ccff756c9943) and click Share → Publish.
- For custom domains, go to Project > Settings > Domains and follow the instructions: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Contributing

We welcome contributions! Please follow these guidelines:
- Write clear, modular, and self-documenting code
- Use descriptive names and consistent formatting
- Add comments for complex logic
- Group related code in logical directories
- Write tests for critical features
- Run linting and tests before committing
- See the [Coding Standards](#coding-standards) below

## Coding Standards
- Small, single-responsibility functions and modules
- Robust error handling and user-friendly messages
- Validate and sanitize all user inputs
- Document public APIs and modules
- Optimize for performance and accessibility
- Keep dependencies up-to-date

## Testing
- Write unit and integration tests for core logic
- Use automated tests to catch regressions
- Run tests before committing changes

## Support
For questions or support, please open an issue or contact the maintainers.

---

© 2024 Meeting Mojo UI. All rights reserved.

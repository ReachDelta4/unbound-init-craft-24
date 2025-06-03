# Meeting Mojo UI - Personal Reference

## Project Overview
Meeting Mojo is a web application designed to enhance virtual meetings with real-time transcription, insights, and note-taking capabilities. The application captures audio from both microphone and system sources, processes it through WebSocket connections, and provides a comprehensive meeting workspace with multiple panels.

## Key Features
- **Real-time Transcription**: Captures and transcribes meeting audio in real-time
- **Screen Sharing**: Supports screen sharing during meetings
- **Meeting Insights**: Analyzes meeting content to extract emotions, pain points, objections, and recommendations
- **Note Taking**: Integrated note-taking functionality with auto-save
- **Authentication**: User authentication via Supabase
- **Responsive UI**: Built with React and Tailwind CSS using shadcn/ui components

## Technology Stack
- **Frontend Framework**: React 18 with TypeScript
- **Routing**: React Router v6
- **State Management**: React Context API and custom hooks
- **Styling**: Tailwind CSS with shadcn/ui components
- **Authentication**: Supabase Auth
- **Database**: Supabase
- **API Requests**: TanStack Query
- **WebRTC**: For screen sharing and audio capture
- **WebSockets**: For real-time transcription

## Project Structure

### Core Directories
- `/src/components`: UI components organized by feature
- `/src/contexts`: React context providers for global state
- `/src/hooks`: Custom React hooks for shared logic
- `/src/integrations`: External service integrations (Supabase)
- `/src/pages`: Main application pages
- `/src/lib`: Utility functions and shared code

### Key Components
- `MeetingWorkspace.tsx`: Main workspace with resizable panels
- `TranscriptPanel.tsx`: Displays real-time meeting transcription
- `InsightsPanel.tsx`: Shows AI-generated insights from the meeting
- `NotesPanel.tsx`: Interface for taking and managing meeting notes
- `MeetingControls.tsx`: Call controls (start/end meeting, screen sharing)

### Important Hooks
- `useMeetingState`: Manages meeting lifecycle and state
- `useNotesState`: Handles note-taking functionality
- `useMixedAudioWebSocket`: Manages WebSocket connection for audio transcription
- `useWebRTC`: Handles screen sharing and audio capture

## Authentication Flow
The application uses Supabase for authentication with email/password login. The AuthContext provides user state and authentication methods throughout the application.

## Meeting Workflow
1. User starts a meeting which initializes screen sharing and audio capture
2. Audio is sent to a backend service via WebSocket for real-time transcription
3. Transcription results are displayed in the Transcript Panel
4. AI-generated insights are shown in the Insights Panel
5. User can take notes in the Notes Panel during the meeting
6. On meeting end, a summary is generated and the meeting can be saved

## Development Notes

### WebSocket Connection
- The application connects to a WebSocket server for real-time transcription
- Connection status is monitored and displayed to the user
- Auto-reconnect functionality is implemented with configurable retry limits

### Audio Capture
- The application captures both microphone and system audio
- Audio streams are processed and sent to the backend for transcription
- Fallback mechanisms are in place if system audio capture fails

### Screen Sharing
- Implemented using WebRTC's getDisplayMedia API
- Includes error handling for user permission denial

### State Management
- Meeting state is managed through the MeetingStateProvider context
- Notes state is handled by the useNotesState hook
- Authentication state is managed by the AuthContext

## Known Issues and TODOs
- Improve error handling for WebSocket disconnections
- Enhance transcription accuracy for different accents
- Add support for recording meetings
- Implement meeting scheduling functionality
- Add export options for meeting transcripts and notes

## Deployment
The application is currently deployed on GitHub and can be accessed through the V1-Fixed branch.

## Personal Development Notes
- WebSocket connection can be flaky - check server status if transcription fails
- Remember to test on different browsers as WebRTC support varies
- Audio extraction logic might need tweaking for different OS/browser combinations


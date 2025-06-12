# Meeting Mojo - Technical Documentation

## Project Overview
Meeting Mojo is a sophisticated web application designed to revolutionize virtual meetings with real-time transcription, AI-powered insights, and comprehensive note-taking capabilities. The application captures both microphone and system audio, processes it through WebSocket connections to a transcription service, and provides a comprehensive meeting workspace with multiple interactive panels.

## Electron App

Meeting Mojo is now available as an Electron desktop application, providing native desktop integration while maintaining all the features of the web version.

### Running the Electron App

#### Development Mode
To run the app in development mode:
```bash
npm run electron:dev
```
This will start both the Vite development server and the Electron app, with hot reloading enabled.

#### Production Build
To build the production version:
```bash
npm run electron:build
```
This will create distributable packages in the `release` folder.

#### Preview Production Build
To preview the production build without packaging:
```bash
npm run electron:preview
```

### Desktop Features
The Electron version offers several advantages:
- Native file system access for importing and exporting notes
- Better audio capture capabilities
- Runs as a standalone application without browser limitations
- Improved performance for audio processing
- Integrated n8n workflow automation for AI processing

## n8n Integration

Meeting Mojo integrates n8n as an orchestration layer between the application and AI models like Ollama. This provides several benefits:

- **Flexible AI Integration**: Easily connect to different AI models without changing application code
- **Visual Workflow Creation**: Design AI processing workflows visually in the n8n UI
- **Extensibility**: Add pre/post-processing steps, error handling, and complex logic
- **Monitoring**: Track AI requests and responses through n8n's interface

### How It Works

1. The Electron app automatically starts n8n when launched
2. n8n runs locally on port 5678 (http://localhost:5678)
3. The application communicates with n8n via webhook endpoints
4. n8n orchestrates requests to AI models and returns processed results

### Using n8n with Ollama

The integration follows this pattern:

```
Electron App → n8n (orchestrator) → Ollama (AI model) → Back to your app
```

To set up a workflow:

1. Open the n8n UI at http://localhost:5678
2. Create a new workflow with a webhook trigger
3. Add an HTTP Request node to call Ollama's API
4. Configure parameters and processing logic
5. Activate the workflow and use the webhook URL in your application

### API Integration

The application provides utilities to interact with n8n:

```typescript
// Check n8n status
const { isRunning, n8nUrl } = useN8n();

// Execute a workflow
const result = await executeWorkflow('your-workflow-id', {
  text: 'Process this text with AI',
  model: 'llama3',
  options: { temperature: 0.7 }
});
```

## Core Architecture

### Frontend Framework
- **React 18 with TypeScript**: Provides type safety and modern React features
- **Vite**: Fast build tool with hot module replacement for development
- **React Router v6**: For client-side routing with modern features
- **TanStack Query**: For efficient API data fetching and caching

### State Management
- **React Context API**: For global state management (auth, meeting state)
- **Custom Hooks**: Encapsulated business logic for specific features
- **Local Storage**: For persistence of active meeting data

### UI Components
- **Shadcn/UI**: Component library built on Radix UI primitives
- **Tailwind CSS**: For utility-first styling
- **Radix UI**: Accessible UI primitives
- **Lucide React**: Icon library
- **Embla Carousel**: For carousel components
- **React Resizable Panels**: For the resizable workspace layout

### Backend Integration
- **Supabase**: For authentication and database
- **WebSockets**: For real-time audio streaming and transcription
- **WebRTC**: For screen sharing and audio capture

## AI Integration

### Automatic Services Startup
The application automatically starts the following services when launched:

1. **n8n Workflow Automation**
   - Runs locally on port 5678 (http://localhost:5678)
   - Used for orchestrating AI workflows and data processing
   - The n8n process is managed by the Electron app and automatically terminates when the app is closed

2. **llama.cpp Server for Phi-3**
   - Runs locally on port 8080 (http://127.0.0.1:8080)
   - Provides the API for interacting with the Phi-3 language model
   - Automatically loads the Phi-3 model specified in the configuration
   - The server process is managed by the Electron app and automatically terminates when the app is closed

### Setup Requirements

To use the AI features, you need:

1. **llama-server.exe**: Place this in the `resources/llama-cpp/` directory
   - Download from the [llama.cpp GitHub repository](https://github.com/ggerganov/llama.cpp/releases)
   - Or build it yourself from source

2. **Phi-3 Model**: Place the model file in the `models/` directory
   - The app is configured to use `Phi-3-mini-128k-instruct.Q4_K_M.gguf` by default
   - You can download quantized models from [HuggingFace](https://huggingface.co/models?search=phi-3)

### Using the AI Integration

The application provides utilities to interact with both services:

```typescript
// Check n8n status
const { isRunning: n8nRunning, url: n8nUrl } = await getN8nStatus();

// Check llama.cpp status
const phi3Client = new Phi3Client({});
const { running: llamaRunning } = await phi3Client.getStatus();

// Generate text with Phi-3
const response = await phi3Client.generateText("Summarize the following meeting transcript:", {
  temperature: 0.7,
  maxTokens: 500
});
```

## Database Schema

### Key Tables
- **meetings**: Stores meeting metadata, transcripts, and summaries
- **meeting_insights**: Contains AI-generated insights from meetings
- **meeting_notes**: Stores user notes with JSON content
- **profiles**: User profile information
- **business_details**: Company information for users

## Core Features & Implementation

### Authentication System
The application uses Supabase for authentication with email/password login. The `AuthContext` provides user state and authentication methods throughout the application:

```typescript
// Key authentication methods
signUp(email: string, password: string): Promise<void>
signIn(email: string, password: string): Promise<void>
signOut(): Promise<void>
resetPassword(email: string): Promise<void>
updatePassword(newPassword: string): Promise<void>
```

### Meeting Workspace
The workspace is divided into three resizable panels:
1. **Transcript Panel**: Shows real-time transcription
2. **Insights Panel**: Displays AI-generated insights
3. **Notes Panel**: For note-taking during meetings

Implementation uses React Resizable Panels for the responsive layout:
```typescript
<ResizablePanelGroup direction="horizontal">
  <ResizablePanel>
    <TranscriptPanel />
  </ResizablePanel>
  <ResizableHandle />
  <ResizablePanel>
    <InsightsPanel />
  </ResizablePanel>
  <ResizableHandle />
  <ResizablePanel>
    <NotesPanel />
  </ResizablePanel>
</ResizablePanelGroup>
```

### Audio Capture System
The application implements a sophisticated audio capture system that:

1. **Captures Multiple Audio Sources**:
   - Microphone audio via `getUserMedia()`
   - System audio via `getDisplayMedia()`

2. **Processes Audio Streams**:
   - Uses `AudioWorkletNode` for efficient audio processing
   - Mixes microphone and system audio with configurable gain levels
   - Converts audio to PCM format for transmission

3. **Handles Edge Cases**:
   - Fallback mechanisms if system audio capture fails
   - Track identification based on labels
   - Automatic reconnection with exponential backoff

### WebSocket Transcription
The application connects to a WebSocket server for real-time transcription:

1. **Connection Management**:
   - Automatic reconnection with exponential backoff
   - Status monitoring and user feedback
   - Error handling with fallback options

2. **Audio Streaming**:
   - Efficient binary transmission of audio data
   - Buffer management to control packet size
   - Sample rate conversion as needed

3. **Transcription Processing**:
   - Real-time partial results display
   - Full sentence assembly
   - Transcript storage and retrieval

### Meeting State Management
The `useMeetingState` hook manages the complete meeting lifecycle:

```typescript
// Key meeting state operations
startMeeting(platform: string): Promise<Meeting | null>
endMeeting(transcript: string, summary: string, insights: any[]): Promise<string | null>
updateMeeting(meetingId: string, data: Partial<Meeting>): Promise<boolean>
getMeeting(meetingId: string): Promise<Meeting | null>
```

State persistence is handled through localStorage with error recovery mechanisms.

### Notes System
The notes system provides:

1. **Rich Text Editing**:
   - Markdown support
   - Auto-saving
   - Export options

2. **Checklist Feature**:
   - Hierarchical checklist items
   - Completion tracking
   - Drag-and-drop reordering

3. **Integration with Meetings**:
   - Notes linked to specific meetings
   - Automatic saving to database
   - Retrieval during meeting review

## Technical Challenges & Solutions

### Audio Mixing Challenge
**Challenge**: Capturing and mixing microphone and system audio reliably across browsers.

**Solution**: Implemented a custom `AudioWorkletProcessor` that:
- Processes audio in a separate thread for performance
- Applies configurable gain to each audio source
- Implements clipping prevention
- Handles missing audio sources gracefully

```javascript
class MixerProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    // Mix microphone and system audio with gain control
    const input0 = inputs[0][0] || new Float32Array(128); // mic
    const input1 = inputs[1][0] || new Float32Array(128); // system
    
    // Apply gain and mix
    for (let i = 0; i < len; i++) {
      mono[i] = (input0[i] || 0) * this._micGain + 
                (input1[i] || 0) * this._sysGain;
    }
    
    // Send to main thread
    this.port.postMessage({ audio: this._buffer });
    
    return true;
  }
}
```

### WebSocket Reliability Challenge
**Challenge**: Maintaining stable WebSocket connections for transcription.

**Solution**: Implemented a robust connection management system:
- Automatic reconnection with exponential backoff
- Connection status monitoring
- User feedback on connection issues
- Graceful degradation when connection fails

### Screen Sharing Challenge
**Challenge**: Capturing system audio alongside screen video.

**Solution**: Implemented a specialized WebRTC setup:
- Used `getDisplayMedia()` with specific audio constraints
- Separate microphone capture with `getUserMedia()`
- Stream combination for unified processing
- Track identification based on labels

## Performance Optimizations

1. **Audio Processing**:
   - Used `AudioWorkletNode` instead of ScriptProcessorNode
   - Optimized buffer sizes for latency vs stability
   - Implemented efficient PCM conversion

2. **React Rendering**:
   - Memoized context values to prevent unnecessary re-renders
   - Used refs for values not affecting rendering
   - Optimized state updates for transcription display

3. **Data Management**:
   - Implemented optimistic UI updates
   - Used TanStack Query for efficient API caching
   - Batch updates for meeting insights

## Security Considerations

1. **Authentication**:
   - Supabase handles secure token management
   - Password reset flows with email verification
   - Session expiration handling

2. **Data Protection**:
   - Meeting data is associated with user accounts
   - Notes have locking capability for sensitive content
   - Client-side encryption could be added for enhanced security

3. **Audio Privacy**:
   - Audio processing happens client-side
   - Only processed text is sent to backend services
   - Clear user permissions for audio capture

## Deployment Architecture

The application is designed for deployment with:
- Frontend hosted on static hosting (GitHub Pages, Vercel, etc.)
- Supabase for authentication and database
- Separate WebSocket server for transcription (currently localhost for development)

## Development Workflow

1. **Local Development**:
   - `npm run dev`: Start Vite development server
   - WebSocket server must be running locally

2. **Testing**:
   - Playwright for end-to-end testing
   - `npm run test`: Run all tests
   - `npm run test:ui`: Run tests with UI

3. **Building**:
   - `npm run build`: Production build
   - `npm run build:dev`: Development build

## Future Technical Roadmap

1. **Enhanced Transcription**:
   - Speaker diarization
   - Language detection and translation
   - Custom vocabulary training

2. **Advanced AI Features**:
   - Sentiment analysis during meetings
   - Automatic action item extraction
   - Meeting summarization improvements

3. **Collaboration Features**:
   - Real-time collaborative notes
   - Meeting recording and playback
   - Integration with calendar systems

4. **Mobile Support**:
   - Progressive Web App implementation
   - Mobile-optimized UI
   - Background audio capture on mobile

## Technical Debt & Known Issues

1. **WebSocket Connection**:
   - Connection can be unstable on certain networks
   - Needs more robust error recovery
   - Currently requires local WebSocket server

2. **Audio Capture**:
   - System audio capture not supported in all browsers
   - Audio mixing quality varies by platform
   - Need better handling of audio permission denial

3. **UI Responsiveness**:
   - Performance issues with very long transcripts
   - Mobile layout needs optimization
   - Panel resizing can be jerky on lower-end devices

## Integration Points

1. **Transcription Service**:
   - WebSocket connection to transcription server
   - Binary PCM audio streaming
   - JSON response format for transcription results

2. **Supabase**:
   - Authentication API
   - Database tables for meetings, insights, notes
   - Real-time subscriptions could be implemented

3. **AI Services**:
   - Currently using Google Generative AI for insights
   - Could integrate with other AI providers
   - Potential for custom AI model training

## Developer Notes

- WebSocket server must be running on localhost:8012 for transcription
- Audio worklet code is defined inline due to CORS restrictions
- Screen sharing permissions must be granted by the user
- System audio capture requires Chrome 74+ or Edge 79+
- Firefox has limited support for system audio capture


# Phi-3 Mini Integration

This directory contains the integration of Microsoft's Phi-3-Mini LLM into the application. The model runs locally in the browser using ONNX Runtime Web and Transformers.js.

## Features

- **Local Inference**: The model runs entirely in the browser with no server-side processing required
- **Incremental Processing**: Processes transcript segments incrementally to reduce memory usage
- **Context Awareness**: Maintains context between transcript segments for coherent analysis
- **Configurable**: Easy to customize via the `phi3Config.ts` file

## Files

- `phi3Client.ts`: Main client implementation for interacting with the Phi-3 model
- `phi3Config.ts`: Configuration settings for the model
- `README.md`: This documentation file

## Usage

### Basic Usage

```typescript
import { phi3Client } from '@/integrations/phi3/phi3Client';

// Process a transcript segment
const result = await phi3Client.processTranscript("Your transcript text here");
console.log(result); // Generated insights
```

### Incremental Processing

```typescript
import { phi3Client } from '@/integrations/phi3/phi3Client';

// Process transcript segments incrementally
const result1 = await phi3Client.processIncrementalTranscript(
  "", // No previous transcript yet
  "First segment of the conversation",
  "" // No previous summary yet
);

// Later, process a new segment
const result2 = await phi3Client.processIncrementalTranscript(
  result1.transcriptHistory,
  "New segment of the conversation",
  result1.summary
);

console.log(result2.insights); // Updated insights
console.log(result2.summary);  // Updated summary
```

### Custom Prompts

```typescript
import { phi3Client } from '@/integrations/phi3/phi3Client';

// Use custom system prompt
const response = await phi3Client.processIncrementalText([
  { 
    role: 'system', 
    content: 'You are a helpful AI assistant specialized in meeting analysis.' 
  },
  { 
    role: 'user', 
    content: 'What are the key points from this transcript: ...' 
  }
]);
```

## React Integration

The integration includes React hooks and components:

- `usePhi3.ts`: React hook for using the Phi-3 client in components
- `Phi3Context.tsx`: Context provider for application-wide access
- `Phi3Insights.tsx`: Component to display insights from the model
- `Phi3ModelLoader.tsx`: Component to handle model loading UI

## Configuration

You can customize the model behavior in `phi3Config.ts`:

- Change the model ID to use a different Phi-3 variant
- Adjust generation parameters (temperature, top-k, etc.)
- Modify system prompts for different tasks
- Configure environment settings (threads, quantization, etc.)

## Performance Considerations

- The model requires significant resources for initial loading (may take several seconds)
- Quantization is enabled by default to improve performance
- WebAssembly SIMD is used when available for better performance
- Incremental processing helps manage memory usage with long transcripts 
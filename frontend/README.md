# RealtimeSTT Backend for Integration

This directory contains the RealtimeSTT backend for speech-to-text functionality, ready to be integrated with your own frontend.

## Directory Structure

- `stt_backend/` - Contains the RealtimeSTT backend code
  - `optimized_realtime_stt.py` - Core STT functionality
  - `realtime_stt_websocket_server.py` - WebSocket server for STT
  - `test_stt_client.py` - Test client for the WebSocket server
  - `start_stt_server_optimized_realtime.bat` - Batch file to start the STT server
  - `requirements.txt` - Python dependencies for the STT backend
  - `README.md` - Documentation for the STT backend

## Getting Started

### 1. Install Dependencies

First, install the required Python packages for the STT backend:

```bash
cd stt_backend
pip install -r requirements.txt
```

### 2. Start the STT Server

To start the STT server, simply run the original batch file:

```bash
cd stt_backend
start_stt_server_optimized_realtime.bat
```

This will start the STT server with optimized settings for CPU.

### 3. Testing the WebSocket Server (Optional)

If you want to test the WebSocket functionality separately, you can run the WebSocket server manually:

```bash
cd stt_backend
python realtime_stt_websocket_server.py
```

And then test it with the provided test client:

```bash
cd stt_backend
python test_stt_client.py
```

This will connect to the WebSocket server and start streaming audio from your microphone.

## Integrating with Your Frontend

To integrate the STT functionality with your frontend, you can use the WebSocket API. The WebSocket server accepts the following message types:

1. **Audio Data**
   ```json
   {
     "type": "audio",
     "data": "base64-encoded-audio-data",
     "sample_rate": 16000
   }
   ```

2. **Commands**
   ```json
   {
     "type": "command",
     "command": "start|stop|clear"
   }
   ```

The server responds with:

1. **Real-time Transcription**
   ```json
   {
     "type": "realtime",
     "text": "Partial transcription text..."
   }
   ```

2. **Completed Transcription**
   ```json
   {
     "type": "completed",
     "text": "Final transcription text."
   }
   ```

3. **Status Updates**
   ```json
   {
     "type": "status",
     "status": "recording_started|recording_stopped|cleared"
   }
   ```

## GPU Support

The backend is configured to use CPU by default, but it supports GPU acceleration. To enable GPU support, modify the `device` parameter in `optimized_realtime_stt.py` from `"cpu"` to `"cuda"` if you have an NVIDIA GPU with CUDA support.

For more details about the STT backend, please refer to the [README.md](stt_backend/README.md) in the `stt_backend` directory. 
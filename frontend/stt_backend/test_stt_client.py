import asyncio
import json
import base64
import websockets
import pyaudio
import wave
import argparse
import numpy as np

# Audio parameters
CHUNK = 1024
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000

async def send_audio_stream(websocket_url, audio_file=None):
    """
    Connects to the WebSocket server and sends audio data
    Either from microphone or from a file
    """
    async with websockets.connect(websocket_url) as websocket:
        print(f"Connected to {websocket_url}")
        
        # Initialize PyAudio
        p = pyaudio.PyAudio()
        
        if audio_file:
            # Read audio from file
            print(f"Streaming audio from file: {audio_file}")
            
            # Open the wave file
            wf = wave.open(audio_file, 'rb')
            
            # Start streaming
            await websocket.send(json.dumps({
                'type': 'command',
                'command': 'start'
            }))
            
            # Read and send audio data
            while True:
                data = wf.readframes(CHUNK)
                if not data:
                    break
                
                # Encode audio data
                encoded_data = base64.b64encode(data).decode('utf-8')
                
                # Send audio data
                await websocket.send(json.dumps({
                    'type': 'audio',
                    'data': encoded_data,
                    'sample_rate': RATE
                }))
                
                # Wait for server response
                response = await websocket.recv()
                try:
                    response_data = json.loads(response)
                    if response_data['type'] == 'realtime':
                        print(f"Realtime: {response_data['text']}")
                    elif response_data['type'] == 'completed':
                        print(f"Completed: {response_data['text']}")
                except json.JSONDecodeError:
                    print(f"Invalid response: {response}")
                
                # Simulate real-time streaming
                await asyncio.sleep(CHUNK / RATE)
            
            # Close the wave file
            wf.close()
            
        else:
            # Stream from microphone
            print("Streaming audio from microphone. Press Ctrl+C to stop.")
            
            # Open stream
            stream = p.open(
                format=FORMAT,
                channels=CHANNELS,
                rate=RATE,
                input=True,
                frames_per_buffer=CHUNK
            )
            
            # Start streaming
            await websocket.send(json.dumps({
                'type': 'command',
                'command': 'start'
            }))
            
            # Listen for responses in background
            async def listen_for_responses():
                while True:
                    try:
                        response = await websocket.recv()
                        response_data = json.loads(response)
                        if response_data['type'] == 'realtime':
                            print(f"\rRealtime: {response_data['text']}", end='')
                        elif response_data['type'] == 'completed':
                            print(f"\nCompleted: {response_data['text']}")
                        elif response_data['type'] == 'status':
                            print(f"\nStatus: {response_data['status']}")
                    except websockets.exceptions.ConnectionClosed:
                        break
                    except Exception as e:
                        print(f"\nError receiving message: {e}")
            
            # Start listening for responses
            listener_task = asyncio.create_task(listen_for_responses())
            
            try:
                # Read and send audio data
                while True:
                    data = stream.read(CHUNK, exception_on_overflow=False)
                    
                    # Encode audio data
                    encoded_data = base64.b64encode(data).decode('utf-8')
                    
                    # Send audio data
                    await websocket.send(json.dumps({
                        'type': 'audio',
                        'data': encoded_data,
                        'sample_rate': RATE
                    }))
                    
                    # Small delay to prevent flooding
                    await asyncio.sleep(0.01)
            except KeyboardInterrupt:
                print("\nStopping audio stream...")
            finally:
                # Stop stream
                stream.stop_stream()
                stream.close()
                
                # Cancel listener task
                listener_task.cancel()
                
                # Send stop command
                await websocket.send(json.dumps({
                    'type': 'command',
                    'command': 'stop'
                }))
        
        # Close PyAudio
        p.terminate()
        print("Disconnected from server")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="RealtimeSTT WebSocket Client")
    parser.add_argument("--url", default="ws://localhost:8012", help="WebSocket server URL")
    parser.add_argument("--file", help="Audio file to stream (WAV format)")
    args = parser.parse_args()
    
    try:
        asyncio.run(send_audio_stream(args.url, args.file))
    except KeyboardInterrupt:
        print("\nClient terminated.") 
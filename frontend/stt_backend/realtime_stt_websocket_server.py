import os
import json
import base64
import asyncio
import logging
import websockets
import numpy as np
from optimized_realtime_stt import create_optimized_realtime_stt

# Set CPU threading limits
os.environ['OMP_NUM_THREADS'] = '2'
os.environ['MKL_NUM_THREADS'] = '2'
os.environ['NUMEXPR_MAX_THREADS'] = '2'

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('realtime_stt_server')

class RealtimeSTTServer:
    def __init__(self, host='0.0.0.0', port=8012):
        self.host = host
        self.port = port
        self.clients = set()
        self.recorder = None
        self.current_realtime_text = ""
        self.completed_sentences = []
        
    async def start_server(self):
        """Start the WebSocket server"""
        self.server = await websockets.serve(
            self.handle_client, 
            self.host, 
            self.port
        )
        logger.info(f"Server started on ws://{self.host}:{self.port}")
        return self.server
        
    async def handle_client(self, websocket):
        """Handle client connections"""
        # Add client to set
        self.clients.add(websocket)
        logger.info(f"Client connected: {websocket.remote_address}")
        
        # Initialize STT recorder for this client if not exists
        if not self.recorder:
            self.recorder = create_optimized_realtime_stt()
            
            # Set callbacks
            self.recorder.on_realtime_transcription_update = self.handle_realtime_update
            self.recorder.on_recording_start = self.handle_recording_start
            self.recorder.on_recording_stop = self.handle_recording_stop
            
            # Start the recorder
            self.recorder.start()
            logger.info("STT recorder initialized and started")
            
        try:
            # Handle messages from client
            async for message in websocket:
                try:
                    # Parse message as JSON
                    data = json.loads(message)
                    
                    # Handle different message types
                    if data['type'] == 'audio':
                        # Process audio data
                        audio_bytes = base64.b64decode(data['data'])
                        
                        # Convert to numpy array of float32
                        audio_data = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32767.0
                        
                        # Feed audio to the recorder
                        self.recorder.feed_audio(audio_data, original_sample_rate=data.get('sample_rate', 16000))
                        
                    elif data['type'] == 'command':
                        # Handle commands
                        if data['command'] == 'start':
                            self.recorder.start()
                            await self.broadcast(json.dumps({
                                'type': 'status',
                                'status': 'started'
                            }))
                            
                        elif data['command'] == 'stop':
                            self.recorder.stop()
                            await self.broadcast(json.dumps({
                                'type': 'status',
                                'status': 'stopped'
                            }))
                            
                        elif data['command'] == 'clear':
                            self.current_realtime_text = ""
                            self.completed_sentences = []
                            self.recorder.clear_audio_queue()
                            await self.broadcast(json.dumps({
                                'type': 'status',
                                'status': 'cleared'
                            }))
                            
                except json.JSONDecodeError:
                    logger.error("Failed to parse message as JSON")
                except Exception as e:
                    logger.error(f"Error processing message: {str(e)}")
                    
        except websockets.exceptions.ConnectionClosed:
            logger.info(f"Client disconnected: {websocket.remote_address}")
        finally:
            # Remove client from set
            self.clients.remove(websocket)
            
            # If no more clients, stop the recorder
            if not self.clients and self.recorder:
                self.recorder.stop()
                self.recorder = None
                logger.info("All clients disconnected, stopped recorder")
    
    def handle_realtime_update(self, text):
        """Handle real-time transcription updates"""
        self.current_realtime_text = text
        
        # Broadcast to all clients
        asyncio.create_task(self.broadcast(json.dumps({
            'type': 'realtime',
            'text': text
        })))
        
    def handle_completed_transcription(self, text):
        """Handle completed transcription"""
        if text.strip():
            self.completed_sentences.append(text)
            
            # Broadcast to all clients
            asyncio.create_task(self.broadcast(json.dumps({
                'type': 'completed',
                'text': text
            })))
            
            # Clear realtime text
            self.current_realtime_text = ""
    
    def handle_recording_start(self):
        """Handle recording start event"""
        logger.info("Recording started")
        asyncio.create_task(self.broadcast(json.dumps({
            'type': 'status',
            'status': 'recording_started'
        })))
    
    def handle_recording_stop(self):
        """Handle recording stop event"""
        logger.info("Recording stopped")
        asyncio.create_task(self.broadcast(json.dumps({
            'type': 'status',
            'status': 'recording_stopped'
        })))
    
    async def broadcast(self, message):
        """Broadcast message to all connected clients"""
        if not self.clients:
            return
            
        # Send message to all clients
        await asyncio.gather(
            *[client.send(message) for client in self.clients],
            return_exceptions=True
        )
    
    def start_transcription_loop(self):
        """Start the transcription loop in a background task"""
        async def transcription_loop():
            while True:
                if self.recorder:
                    text = self.recorder.text()
                    if text:
                        self.handle_completed_transcription(text)
                await asyncio.sleep(0.1)
                
        return asyncio.create_task(transcription_loop())
        
    async def shutdown(self):
        """Shutdown the server"""
        if self.recorder:
            self.recorder.stop()
            self.recorder = None
            
        if hasattr(self, 'server'):
            self.server.close()
            await self.server.wait_closed()
            
        logger.info("Server shutdown complete")

async def main():
    # Create server
    server = RealtimeSTTServer(host='0.0.0.0', port=8012)
    
    # Start server
    await server.start_server()
    
    # Start transcription loop
    transcription_task = server.start_transcription_loop()
    
    # Run forever
    try:
        await asyncio.Future()
    except asyncio.CancelledError:
        # Shutdown server
        await server.shutdown()
        
        # Cancel transcription task
        transcription_task.cancel()

if __name__ == "__main__":
    print("Starting Real-time STT WebSocket Server...")
    print("Optimized for CPU with real-time transcription")
    print("Connect to ws://localhost:8012")
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nShutting down server...") 
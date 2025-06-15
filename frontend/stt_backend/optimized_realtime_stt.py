import os
import logging
from RealtimeSTT import AudioToTextRecorder

# Set CPU threading limits to prevent resource contention
os.environ['OMP_NUM_THREADS'] = '2'
os.environ['MKL_NUM_THREADS'] = '2'
os.environ['NUMEXPR_MAX_THREADS'] = '2'

def create_optimized_realtime_stt():
    """
    Optimized RealtimeSTT configuration for CPU with real-time transcription
    Specifically tuned for Intel i5-8250U with 8GB RAM
    """
    
    return AudioToTextRecorder(
        # Core Model Settings - Optimized for CPU performance
        model="tiny.en",  # Fastest English-only model
        language="en",
        device="cpu",
        compute_type="int8",  # Quantized for faster CPU processing
        
        # Audio Input
        input_device_index=1,
        use_microphone=False,  # Server receives audio from client
        
        # Batch Processing - Minimal for lowest latency
        batch_size=1,
        realtime_batch_size=1,
        
        # Critical: Very aggressive latency control
        allowed_latency_limit=100,  # Match batch file setting (was 15)
        handle_buffer_overflow=True,
        
        # Voice Activity Detection - Balanced for stability
        silero_sensitivity=0.4,  # Slightly less sensitive to reduce false triggers
        silero_use_onnx=True,  # ONNX is faster than PyTorch
        silero_deactivity_detection=True,  # Better end-of-speech detection
        webrtc_sensitivity=2,  # Balanced sensitivity
        
        # Timing Parameters - Optimized for real-time responsiveness
        post_speech_silence_duration=0.2,  # Quick response time
        min_length_of_recording=0.05,  # Very short minimum recording
        min_gap_between_recordings=0.05,  # Fast consecutive recordings
        pre_recording_buffer_duration=0.1,  # Small buffer
        
        # Real-time Transcription - Optimized for CPU
        enable_realtime_transcription=True,  # Your requirement
        realtime_processing_pause=0.005,  # Very frequent updates
        init_realtime_after_seconds=0.02,  # Start real-time immediately
        use_main_model_for_realtime=True,  # Use same model to save memory
        
        # Performance Optimizations
        early_transcription_on_silence=0,  # Disable to reduce CPU load
        beam_size=1,  # Fastest beam search
        beam_size_realtime=1,  # Fastest real-time beam search
        
        # Text Quality
        initial_prompt="Complete sentences end with periods. Incomplete thoughts end with '...'",
        ensure_sentence_starting_uppercase=True,
        ensure_sentence_ends_with_period=True,
        
        # Token Suppression - Only essential suppression
        suppress_tokens=[-1],  # Minimal suppression for speed
        
        # Logging - Minimal for production
        level=logging.ERROR,  # Only errors
        no_log_file=True,  # No file I/O overhead
        spinner=False,  # No UI overhead
        debug_mode=False,
        print_transcription_time=False,
        
        # Threading
        start_callback_in_new_thread=True,  # Non-blocking callbacks
        
        # VAD Filter - Disabled to avoid compatibility issues
        faster_whisper_vad_filter=False,  # Avoid VAD parameter conflicts
    )

def realtime_transcription_server():
    """
    Production server with real-time transcription handling
    """
    print("Initializing real-time STT server...")
    
    recorder = create_optimized_realtime_stt()
    
    # Storage for different transcription types
    current_realtime_text = ""
    completed_sentences = []
    
    def handle_realtime_update(text):
        """Handle real-time transcription updates (partial text)"""
        nonlocal current_realtime_text
        current_realtime_text = text
        print(f"[REALTIME] {text}")
        # Send to frontend via WebSocket
        # websocket.send_json({"type": "realtime", "text": text})
    
    def handle_completed_transcription(text):
        """Handle completed sentence transcription"""
        if text.strip():
            completed_sentences.append(text)
            print(f"[COMPLETED] {text}")
            # Send to frontend via WebSocket
            # websocket.send_json({"type": "completed", "text": text})
            
            # Clear realtime text since sentence is complete
            nonlocal current_realtime_text
            current_realtime_text = ""
    
    def handle_recording_start():
        print("[STT] Recording started")
        # websocket.send_json({"type": "status", "message": "recording_started"})
    
    def handle_recording_stop():
        print("[STT] Recording stopped")
        # websocket.send_json({"type": "status", "message": "recording_stopped"})
    
    # Configure callbacks
    recorder.on_realtime_transcription_update = handle_realtime_update
    recorder.on_recording_start = handle_recording_start
    recorder.on_recording_stop = handle_recording_stop
    
    return recorder, handle_completed_transcription

# Example usage for direct testing
if __name__ == '__main__':
    recorder, handle_completed = realtime_transcription_server()
    
    print("Real-time STT server ready!")
    print("- Real-time transcription: Shows partial text as you speak")
    print("- Completed transcription: Shows final sentences")
    
    try:
        with recorder:
            while True:
                recorder.text(handle_completed)
    except KeyboardInterrupt:
        print("\nShutting down gracefully...") 
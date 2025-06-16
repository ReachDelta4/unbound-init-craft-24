@echo off
echo Starting RealtimeSTT Server with CPU-optimized real-time transcription...
echo Configuration optimized for Intel i5-8250U with 8GB RAM and real-time transcription.

REM Set CPU threading limits to prevent resource contention
set OMP_NUM_THREADS=2
set MKL_NUM_THREADS=2
set NUMEXPR_MAX_THREADS=2

stt-server ^
  --model tiny ^
  --language en ^
  --compute_type int8 ^
  --device cpu ^
  --batch_size 1 ^
  --realtime_batch_size 1 ^
  --allowed_latency_limit 100 ^
  --silero_sensitivity 0.4 ^
  --silero_deactivity_detection ^
  --silero_use_onnx ^
  --webrtc_sensitivity 2 ^
  --min_length_of_recording 0.05 ^
  --min_gap_between_recordings 0.05 ^
  --realtime_processing_pause 0.1 ^
  --init_realtime_after_seconds 0.02 ^
  --beam_size 1 ^
  --beam_size_realtime 1 ^
  --handle_buffer_overflow ^
  --use_main_model_for_realtime ^
  --early_transcription_on_silence 0 ^
  --suppress_tokens -1 ^
  --initial_prompt "Complete sentences end with periods. Incomplete thoughts end with '...'" ^
  --enable_realtime_transcription 
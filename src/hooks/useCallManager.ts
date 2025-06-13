import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useMixedAudioWebSocket } from '@/hooks/useMixedAudioWebSocket';
import { useTranscriptionWebSocket } from '@/hooks/useTranscriptionWebSocket';
import { sendToWebhook } from '@/utils/webhookUtils';

// Define the interface for the response from the webhook
interface WebhookResponse {
  insights?: {
    emotions?: Array<{ emotion: string; level: number }>;
    painPoints?: string[];
    objections?: string[];
    recommendations?: string[];
    nextActions?: string[];
  };
  clientEmotion?: string;
  clientInterest?: number;
  callStage?: string;
  aiCoachingSuggestion?: string;
}

export const useCallManager = () => {
  const { toast } = useToast();
  const {
    startScreenShare,
    stopScreenShare,
    isScreenSharing,
    stream: webRTCStream,
    error: webRTCError
  } = useWebRTC();

  const {
    status: wsStatus,
    error: wsError,
    liveTranscript,
    fullTranscript,
    isStreaming,
    connect: connectMixedAudio,
    disconnect: disconnectMixedAudio,
    reconnectAttempts,
    setAutoReconnect
  } = useMixedAudioWebSocket();

  // Transcription webhook support
  const {
    setWebhookUrl
  } = useTranscriptionWebSocket();

  // State for insights from webhook
  const [insights, setInsights] = useState({
    emotions: [
      { emotion: "Interest", level: 75 },
      { emotion: "Concern", level: 30 },
      { emotion: "Enthusiasm", level: 45 },
      { emotion: "Skepticism", level: 20 }
    ],
    painPoints: [
      "Current solution is too complex to implement",
      "Training the team takes too much time"
    ],
    objections: [
      "Price seems higher than competitors",
      "Concerned about implementation timeline"
    ],
    recommendations: [
      "Demonstrate ROI calculation",
      "Offer implementation support options"
    ],
    nextActions: [
      "Schedule technical demo",
      "Send case study on similar implementation"
    ]
  });
  
  const [clientEmotion, setClientEmotion] = useState<string>("Interest");
  const [clientInterest, setClientInterest] = useState<number>(75);
  const [callStage, setCallStage] = useState<string>("Discovery");
  const [aiCoachingSuggestion, setAiCoachingSuggestion] = useState<string>(
    "Ask about their current workflow and pain points to better understand their needs."
  );

  // Use the webhook URL with AI endpoint
  const [webhookUrl, setWebhookUrlState] = useState<string | null>("http://127.0.0.1:5678/webhook-test");
  const [connectionTimedOut, setConnectionTimedOut] = useState(false);
  const [isProcessingSentence, setIsProcessingSentence] = useState(false);
  const micStreamRef = useRef<MediaStream | null>(null);
  const systemStreamRef = useRef<MediaStream | null>(null);
  const lastSentenceRef = useRef<string | null>(null);
  const sentenceQueueRef = useRef<string[]>([]);

  // Track the last processed sentence to avoid duplicate webhook calls
  const [processedSentences, setProcessedSentences] = useState<Set<string>>(new Set());
  const [webhookErrorCount, setWebhookErrorCount] = useState<number>(0);

  const setTranscriptionWebhookUrl = useCallback((url: string | null) => {
    // Keep the URL as provided, don't modify it
    setWebhookUrlState(url);
    setWebhookUrl(url);
  }, [setWebhookUrl]);

  // Use effect to set the webhook URL on component initialization
  useEffect(() => {
    // Default webhook URL
    setWebhookUrl("http://127.0.0.1:5678/webhook-test");
  }, [setWebhookUrl]);

  // Update UI based on webhook response
  const updateInsightsFromResponse = useCallback((response: WebhookResponse) => {
    if (!response) {
      console.warn('CallManager: Received empty response from webhook');
      return;
    }
    
    try {
      console.log('CallManager: Updating insights from webhook response', response);
      
      // Update insights if provided
      if (response.insights) {
        setInsights(prevInsights => {
          // Create a safe copy with fallbacks to previous values
          return {
            emotions: Array.isArray(response.insights?.emotions) 
              ? response.insights.emotions 
              : prevInsights.emotions,
            painPoints: Array.isArray(response.insights?.painPoints) 
              ? response.insights.painPoints 
              : prevInsights.painPoints,
            objections: Array.isArray(response.insights?.objections) 
              ? response.insights.objections 
              : prevInsights.objections,
            recommendations: Array.isArray(response.insights?.recommendations) 
              ? response.insights.recommendations 
              : prevInsights.recommendations,
            nextActions: Array.isArray(response.insights?.nextActions) 
              ? response.insights.nextActions 
              : prevInsights.nextActions
          };
        });
      }
      
      // Update client emotion if provided
      if (typeof response.clientEmotion === 'string' && response.clientEmotion.trim() !== '') {
        setClientEmotion(response.clientEmotion);
      }
      
      // Update client interest if provided and is a valid number
      if (typeof response.clientInterest === 'number' && !isNaN(response.clientInterest)) {
        // Ensure the value is within 0-100 range
        const safeInterest = Math.max(0, Math.min(100, response.clientInterest));
        setClientInterest(safeInterest);
      }
      
      // Update call stage if provided
      if (typeof response.callStage === 'string' && response.callStage.trim() !== '') {
        setCallStage(response.callStage);
      }
      
      // Update AI coaching suggestion if provided
      if (typeof response.aiCoachingSuggestion === 'string' && response.aiCoachingSuggestion.trim() !== '') {
        setAiCoachingSuggestion(response.aiCoachingSuggestion);
      }
    } catch (error) {
      console.error('CallManager: Error processing webhook response:', error);
    }
  }, []);

  // Process sentences from the queue one at a time
  const processSentenceQueue = useCallback(async () => {
    if (isProcessingSentence || !webhookUrl || sentenceQueueRef.current.length === 0) {
      return;
    }

    try {
      setIsProcessingSentence(true);
      
      // Get the next sentence from the queue
      const sentence = sentenceQueueRef.current[0];
      
      console.log('CallManager: Processing sentence from queue:', sentence);
      
      try {
        // Send to webhook and wait for response
        const response = await sendToWebhook(webhookUrl, { sentence });
        
        console.log('CallManager: Webhook response for sentence:', response);
        
        // Update insights based on the response
        updateInsightsFromResponse(response);
        
        // Reset error count on success
        setWebhookErrorCount(0);
      } catch (error) {
        console.error('Webhook error:', error);
        // Increment error count
        setWebhookErrorCount(prev => prev + 1);
        
        // If we've had multiple errors, show toast notification
        if (webhookErrorCount >= 2) {
          toast({
            title: "Webhook Connection Issue",
            description: "Unable to connect to the webhook. Make sure the URL is correct and the service is running.",
            variant: "destructive",
          });
          // Reset count after notification
          setWebhookErrorCount(0);
        }
      }
      
      // Remove the processed sentence from the queue
      sentenceQueueRef.current.shift();
      
      // Update last sentence reference
      lastSentenceRef.current = sentence;
      
      // Add to processed set
      setProcessedSentences(prev => {
        const updated = new Set(prev);
        updated.add(sentence);
        return updated;
      });
      
    } catch (error) {
      console.error('Error processing sentence:', error);
    } finally {
      setIsProcessingSentence(false);
      
      // If there are more sentences in the queue, process the next one
      if (sentenceQueueRef.current.length > 0) {
        processSentenceQueue();
      }
    }
  }, [isProcessingSentence, webhookUrl, updateInsightsFromResponse, webhookErrorCount, toast]);

  // Monitor fullTranscript changes to detect new sentences and add them to the queue
  useEffect(() => {
    if (webhookUrl && fullTranscript) {
      const sentences = fullTranscript.split('\n').filter(Boolean);
      
      // Find the most recent sentence (if any)
      if (sentences.length > 0) {
        // Check all sentences that haven't been processed yet
        sentences.forEach(sentence => {
          if (sentence !== lastSentenceRef.current && !processedSentences.has(sentence) && 
              !sentenceQueueRef.current.includes(sentence)) {
            
            console.log('CallManager: Adding new sentence to queue:', sentence);
            
            // Add to queue
            sentenceQueueRef.current.push(sentence);
          }
        });
        
        // Try to process the queue if we're not already processing
        if (!isProcessingSentence && sentenceQueueRef.current.length > 0) {
          processSentenceQueue();
        }
      }
    }
  }, [webhookUrl, fullTranscript, processedSentences, isProcessingSentence, processSentenceQueue]);

  const extractAudioStreams = useCallback((combinedStream: MediaStream) => {
    const audioTracks = combinedStream.getAudioTracks();
    
    micStreamRef.current = null;
    systemStreamRef.current = null;
    
    if (audioTracks.length === 0) {
      console.warn('No audio tracks found in the combined stream');
      micStreamRef.current = new MediaStream();
      systemStreamRef.current = new MediaStream();
      return;
    }
    
    if (audioTracks.length === 1) {
      console.log('Only one audio track found, using it for both mic and system');
      const singleTrack = audioTracks[0];
      micStreamRef.current = new MediaStream([singleTrack]);
      systemStreamRef.current = new MediaStream([singleTrack.clone()]);
      return;
    }
    
    const micTrack = audioTracks[0];
    const systemTrack = audioTracks[1];
    
    const isMicTrack = (track: MediaStreamTrack) => 
      track.label.toLowerCase().includes('microphone') || 
      track.label.toLowerCase().includes('mic');
      
    const isSystemTrack = (track: MediaStreamTrack) => 
      track.label.toLowerCase().includes('system') || 
      track.label.toLowerCase().includes('screen') ||
      track.label.toLowerCase().includes('display');
    
    if (isMicTrack(micTrack) && isSystemTrack(systemTrack)) {
      micStreamRef.current = new MediaStream([micTrack]);
      systemStreamRef.current = new MediaStream([systemTrack]);
    } else if (isMicTrack(systemTrack) && isSystemTrack(micTrack)) {
      micStreamRef.current = new MediaStream([systemTrack]);
      systemStreamRef.current = new MediaStream([micTrack]);
    } else {
      console.log('Using default track order: track[0]=mic, track[1]=system');
      micStreamRef.current = new MediaStream([micTrack]);
      systemStreamRef.current = new MediaStream([systemTrack]);
    }
    
    console.log('Extracted audio tracks:', {
      micTrack: micStreamRef.current?.getAudioTracks()[0]?.label,
      systemTrack: systemStreamRef.current?.getAudioTracks()[0]?.label
    });
  }, []);

  const handleConnectionTimeout = useCallback(() => {
    setConnectionTimedOut(true);
    toast({
      title: "Connection Issue",
      description: "Could not connect to the transcription service. You can continue, but transcription will not be available.",
      variant: "destructive",
    });
    setAutoReconnect(false);
  }, [toast, setAutoReconnect]);

  const startCall = useCallback(async (callType: string, startMeeting: (type: string) => Promise<void>, user: any) => {
    if (!callType || !user) return;
    
    console.log('CallManager: Starting call process...');
    
    try {
      setConnectionTimedOut(false);
      setAutoReconnect(true);
      
      // Reset sentence tracking on new call
      lastSentenceRef.current = null;
      sentenceQueueRef.current = [];
      setProcessedSentences(new Set());
      setIsProcessingSentence(false);
      
      // Reset insights to defaults
      setInsights({
        emotions: [
          { emotion: "Interest", level: 75 },
          { emotion: "Concern", level: 30 },
          { emotion: "Enthusiasm", level: 45 },
          { emotion: "Skepticism", level: 20 }
        ],
        painPoints: [
          "Current solution is too complex to implement",
          "Training the team takes too much time"
        ],
        objections: [
          "Price seems higher than competitors",
          "Concerned about implementation timeline"
        ],
        recommendations: [
          "Demonstrate ROI calculation",
          "Offer implementation support options"
        ],
        nextActions: [
          "Schedule technical demo",
          "Send case study on similar implementation"
        ]
      });
      setClientEmotion("Interest");
      setClientInterest(75);
      setCallStage("Discovery");
      setAiCoachingSuggestion("Ask about their current workflow and pain points to better understand their needs.");
      
      console.log('CallManager: Starting meeting in database...');
      await startMeeting(callType);
      console.log('CallManager: Meeting started in database');
      
      console.log('CallManager: Requesting screen share...');
      const combinedStream = await startScreenShare();
      
      if (!combinedStream) {
        throw new Error('Failed to get screen share stream');
      }
      
      console.log('CallManager: Screen share started successfully, stream:', {
        id: combinedStream.id,
        videoTracks: combinedStream.getVideoTracks().length,
        audioTracks: combinedStream.getAudioTracks().length,
        active: combinedStream.active,
        videoTrackStates: combinedStream.getVideoTracks().map(t => ({
          label: t.label,
          enabled: t.enabled,
          readyState: t.readyState
        }))
      });
      
      extractAudioStreams(combinedStream);
      
      // Setup microphone fallback if needed
      if (!micStreamRef.current?.getAudioTracks().length) {
        console.warn('No microphone audio track found, attempting to get mic access separately');
        try {
          const micOnlyStream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
          micStreamRef.current = micOnlyStream;
          console.log('CallManager: Separate microphone stream acquired');
        } catch (micError) {
          console.error('Failed to get microphone access:', micError);
          toast({
            title: "Microphone access failed",
            description: "We couldn't access your microphone. Audio transcription may be limited.",
            variant: "destructive",
          });
        }
      }
      
      // Create silent system audio fallback if needed
      if (!systemStreamRef.current?.getAudioTracks().length) {
        console.warn('No system audio track found, creating silent fallback');
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const silentOsc = audioContext.createOscillator();
          const silentGain = audioContext.createGain();
          silentGain.gain.value = 0;
          silentOsc.connect(silentGain);
          
          const silentDest = audioContext.createMediaStreamDestination();
          silentGain.connect(silentDest);
          silentOsc.start();
          
          systemStreamRef.current = silentDest.stream;
          console.log('CallManager: Silent system audio stream created');
        } catch (audioError) {
          console.error('Failed to create silent audio stream:', audioError);
          systemStreamRef.current = new MediaStream();
        }
      }
      
      console.log('Audio Tracks prepared for WebSocket:', {
        mic: micStreamRef.current?.getAudioTracks().map(t => t.label) || [],
        system: systemStreamRef.current?.getAudioTracks().map(t => t.label) || []
      });
      
      setTimeout(() => {
        if (micStreamRef.current && systemStreamRef.current) {
          console.log('CallManager: Starting transcription websocket...');
          connectMixedAudio(micStreamRef.current, systemStreamRef.current, 16000);
        } else {
          console.error('Failed to prepare audio streams for websocket');
        }
      }, 1000);
      
      toast({
        title: "Call started",
        description: "Screen sharing and transcription are now active.",
      });
      
    } catch (error) {
      console.error('Error starting call:', error);
      
      stopScreenShare();
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
        micStreamRef.current = null;
      }
      if (systemStreamRef.current) {
        systemStreamRef.current.getTracks().forEach(track => track.stop());
        systemStreamRef.current = null;
      }
      
      toast({
        title: "Failed to start call",
        description: webRTCError || (error instanceof Error ? error.message : "Please make sure you have granted screen sharing permissions."),
        variant: "destructive",
      });
    }
  }, [startScreenShare, webRTCError, connectMixedAudio, extractAudioStreams, setAutoReconnect, stopScreenShare, toast]);

  const endCall = useCallback(() => {
    disconnectMixedAudio();
    stopScreenShare();
    
    // Reset sentence tracking on call end
    lastSentenceRef.current = null;
    sentenceQueueRef.current = [];
    setProcessedSentences(new Set());
    setIsProcessingSentence(false);
    
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => {
        console.log(`Explicitly stopping mic track: ${track.kind} - ${track.label}`);
        track.stop();
      });
      micStreamRef.current = null;
    }
    
    if (systemStreamRef.current) {
      systemStreamRef.current.getTracks().forEach(track => {
        console.log(`Explicitly stopping system track: ${track.kind} - ${track.label}`);
        track.stop();
      });
      systemStreamRef.current = null;
    }
  }, [disconnectMixedAudio, stopScreenShare]);

  const reconnectTranscription = useCallback(() => {
    if (micStreamRef.current && systemStreamRef.current) {
      disconnectMixedAudio();
      setTimeout(() => {
        connectMixedAudio(micStreamRef.current!, systemStreamRef.current!, 16000);
      }, 500);
    }
  }, [disconnectMixedAudio, connectMixedAudio]);

  return {
    // WebRTC state
    isScreenSharing,
    webRTCStream,
    webRTCError,
    
    // WebSocket state
    wsStatus,
    wsError,
    liveTranscript,
    fullTranscript,
    isStreaming,
    reconnectAttempts,
    connectionTimedOut,
    setConnectionTimedOut,
    
    // Webhook configuration
    webhookUrl,
    setWebhookUrl: setTranscriptionWebhookUrl,
    
    // Call control methods
    startCall,
    endCall,
    reconnectTranscription,
    handleConnectionTimeout,
    
    // Refs to media streams
    micStreamRef,
    systemStreamRef,
    
    // Insights and UI state
    insights,
    clientEmotion,
    clientInterest,
    callStage,
    aiCoachingSuggestion
  };
};

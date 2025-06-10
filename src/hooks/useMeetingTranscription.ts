
import { useTranscriptionWebSocket } from "@/hooks/useTranscriptionWebSocket";

export const useMeetingTranscription = () => {
  const {
    fullTranscript,
    realtimeText,
    fullSentences,
    status: transcriptionStatus,
    error: transcriptionError,
    connect: connectTranscription,
    disconnect: disconnectTranscription,
  } = useTranscriptionWebSocket();

  return {
    fullTranscript,
    realtimeText,
    fullSentences,
    transcriptionStatus,
    transcriptionError,
    connectTranscription,
    disconnectTranscription,
  };
};

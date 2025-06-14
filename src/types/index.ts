export interface ModelSettings {
  model: string;
  temperature: number;
  thinkingMode: "off" | "auto" | "on";
  topP: number;
  topK: number;
  maxOutputTokens: number;
  stopSequences: string[];
  safetySettings: {
    [key: string]: string;
  };
} 

export enum MessageSender {
  AI = 'ai',
  USER = 'user',
  SYSTEM_ALERT = 'system_alert'
}

export type CoachPersonality = 'Socratic' | 'Aggressive' | 'Academic' | 'Stoic';

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface BlindSpot {
  detected: boolean;
  type: string;
  explanation: string;
}

export interface Message {
  id: string;
  sender: MessageSender;
  text: string;
  timestamp: string;
  blindSpot?: BlindSpot;
  sources?: GroundingSource[];
  isAudioPlaying?: boolean;
}

export interface SavedDebate {
  id: string;
  topic: string;
  date: string;
  messages: Message[];
  score: number;
}

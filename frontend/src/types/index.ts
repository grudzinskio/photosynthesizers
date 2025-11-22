// Application state types for Dome Defender

export type AppState = 'dome-select' | 'mission' | 'photo-upload' | 'feedback';

export type DomeName = 'Tropical Dome' | 'Desert Dome' | 'Show Dome';

export interface Mission {
  riddle: string;
  scientificName: string;
  referenceImage: string;
}

export interface FeedbackData {
  success: boolean;
  message: string;
}

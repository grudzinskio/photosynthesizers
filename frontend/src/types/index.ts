// Application state types for Dome Defender

export type AppState = 'dome-select' | 'mission' | 'photo-upload' | 'feedback';

export type DomeName = 'Tropical Dome' | 'Desert Dome' | 'Show Dome';

export interface GameState {
  domeType: DomeName;
  plantName: string;
  plantImage: string;
  plantDescription: string | null;
}

export interface PlantData {
  name: string;
  imageUrl: string;
  description: string;
}

export interface FeedbackData {
  success: boolean;
  message: string;
}

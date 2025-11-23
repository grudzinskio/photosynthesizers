// API base URL configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8003';

// API Response Types
export interface StartGameResponse {
  success: boolean;
  plant_name: string;
  plant_image: string;
}

export interface SummarizeResponse {
  success: boolean;
  plant_name: string;
  summary: string;
}

export interface SubmitImageResponse {
  success: boolean;
  message: string;
}

/**
 * Start a new game by selecting a dome type
 * @param domeType - The type of dome (e.g., "Tropical Dome", "Desert Dome", "Show Dome")
 * @returns Promise with plant name and image
 */
export async function startGame(domeType: string): Promise<StartGameResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/game/start-game?dome_type=${encodeURIComponent(domeType)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to start game: ${response.status} ${response.statusText}`);
    }

    const data: StartGameResponse = await response.json();
    
    if (!data.success) {
      throw new Error('Game start was not successful');
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error starting game: ${error.message}`);
    }
    throw new Error('An unknown error occurred while starting the game');
  }
}

/**
 * Get an LLM-generated summary/description of a plant
 * @param domeType - The type of dome
 * @param plantName - The scientific name of the plant
 * @returns Promise with plant summary
 */
export async function summarizePlant(
  domeType: string,
  plantName: string
): Promise<SummarizeResponse> {
  try {
    const formData = new FormData();
    formData.append('dome_type', domeType);
    formData.append('plant_name', plantName);

    const response = await fetch(`${API_BASE_URL}/api/game/summarize`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to summarize plant: ${response.status} ${response.statusText}`);
    }

    const data: SummarizeResponse = await response.json();
    
    if (!data.success) {
      throw new Error('Plant summarization was not successful');
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error summarizing plant: ${error.message}`);
    }
    throw new Error('An unknown error occurred while summarizing the plant');
  }
}

/**
 * Submit a captured image for verification
 * @param image - The image blob to submit
 * @param domeType - The type of dome
 * @param plantName - The scientific name of the plant
 * @returns Promise with submission result
 */
export async function submitImage(
  image: Blob,
  domeType: string,
  plantName: string
): Promise<SubmitImageResponse> {
  try {
    const formData = new FormData();
    formData.append('image', image, 'plant-photo.jpg');
    formData.append('dome_type', domeType);
    formData.append('plant_name', plantName);

    const response = await fetch(`${API_BASE_URL}/api/game/submit-image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to submit image: ${response.status} ${response.statusText}`);
    }

    const data: SubmitImageResponse = await response.json();
    
    // Return the data even if success is false - mismatches are expected responses
    // The backend provides helpful messages that should be displayed to the user
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error submitting image: ${error.message}`);
    }
    throw new Error('An unknown error occurred while submitting the image');
  }
}

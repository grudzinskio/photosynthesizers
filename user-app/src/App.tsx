import { useState } from "react";
import type { AppState, DomeName, FeedbackData, GameState } from "@/types";
import { DomeSelector } from "@/components/DomeSelector";
import { MissionView } from "@/components/MissionView";
import { PhotoCapture } from "@/components/PhotoCapture";
import { FeedbackView } from "@/components/FeedbackView";
import { PlantDetailsView } from "@/components/PlantDetailsView";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LanguageSelector } from "@/components/LanguageSelector";
import { startGame, summarizePlant, submitImage } from "@/api/gameApi";
import { useTranslation } from "@/hooks/useTranslation";

function App() {
  // Translation hook
  const { currentLanguage } = useTranslation();

  // State management
  const [selectedDome, setSelectedDome] = useState<DomeName | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [appState, setAppState] = useState<AppState>("dome-select");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [feedbackData, setFeedbackData] = useState<FeedbackData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("Loading...");

  // Handler: Dome selection
  const handleDomeSelect = async (dome: DomeName) => {
    setSelectedDome(dome);
    setIsLoading(true);
    setLoadingMessage("Loading plant...");

    try {
      // Call startGame API to get plant data
      const startGameResponse = await startGame(dome);
      
      // Initialize game state with plant data
      const newGameState: GameState = {
        domeType: dome,
        plantName: startGameResponse.plant_name,
        plantImage: startGameResponse.plant_image,
        plantDescription: null,
      };
      setGameState(newGameState);

      // Show mission view immediately
      setAppState("mission");
      setIsLoading(false);

      // Generate description in background (don't await)
      summarizePlant(dome, startGameResponse.plant_name, currentLanguage)
        .then((summarizeResponse) => {
          // Update game state with description when ready
          setGameState((prevState) => {
            if (prevState?.plantName === startGameResponse.plant_name) {
              return {
                ...prevState,
                plantDescription: summarizeResponse.summary,
              };
            }
            return prevState;
          });
        })
        .catch((error) => {
          console.error("Error generating plant description:", error);
          // Description will remain null, PlantDetailsView will handle this
        });
    } catch (error) {
      console.error("Error starting game:", error);
      // Reset state on error
      setSelectedDome(null);
      setGameState(null);
      setIsLoading(false);
      alert("Failed to start game. Please try again.");
    }
  };

  // Handler: Found it button clicked
  const handleFoundIt = () => {
    setAppState("photo-upload");
  };

  // Handler: Photo captured and submitted
  const handlePhotoCapture = async (imageBase64: string) => {
    setCapturedImage(imageBase64);
    setIsLoading(true);
    setLoadingMessage("Submitting image...");
    setAppState("feedback");

    // Ensure we have game state before submitting
    if (!gameState) {
      setFeedbackData({
        success: false,
        message: "Game state not found. Please restart the game.",
      });
      setIsLoading(false);
      return;
    }

    try {
      // Convert base64 to Blob
      const base64Data = imageBase64.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const imageBlob = new Blob([byteArray], { type: 'image/jpeg' });

      // Call submitImage API with gameState data
      const response = await submitImage(
        imageBlob,
        gameState.domeType,
        gameState.plantName
      );

      // Update feedback with actual API response
      setFeedbackData({
        success: response.success,
        message: response.message,
      });
    } catch (error) {
      console.error("Error submitting image:", error);
      setFeedbackData({
        success: false,
        message: error instanceof Error 
          ? error.message 
          : "An error occurred during verification. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Next mission after success
  const handleNextMission = async () => {
    if (!selectedDome) return;

    setIsLoading(true);
    setLoadingMessage("Loading plant...");
    setCapturedImage(null);
    setFeedbackData(null);

    try {
      // Call startGame API for new mission
      const startGameResponse = await startGame(selectedDome);
      
      // Initialize new game state
      const newGameState: GameState = {
        domeType: selectedDome,
        plantName: startGameResponse.plant_name,
        plantImage: startGameResponse.plant_image,
        plantDescription: null,
      };
      setGameState(newGameState);

      // Show mission view immediately
      setAppState("mission");
      setIsLoading(false);

      // Generate description in background (don't await)
      summarizePlant(selectedDome, startGameResponse.plant_name, currentLanguage)
        .then((summarizeResponse) => {
          // Update game state with description when ready
          setGameState((prevState) => {
            if (prevState?.plantName === startGameResponse.plant_name) {
              return {
                ...prevState,
                plantDescription: summarizeResponse.summary,
              };
            }
            return prevState;
          });
        })
        .catch((error) => {
          console.error("Error generating plant description:", error);
          // Description will remain null, PlantDetailsView will handle this
        });
    } catch (error) {
      console.error("Error loading next mission:", error);
      setIsLoading(false);
      alert("Failed to load next mission. Please try again.");
    }
  };

  // Handler: Try again after failure
  const handleTryAgain = () => {
    setCapturedImage(null);
    setFeedbackData(null);
    setAppState("photo-upload");
  };

  // Handler: Change dome
  const handleChangeDome = () => {
    setSelectedDome(null);
    setGameState(null);
    setCapturedImage(null);
    setFeedbackData(null);
    setAppState("dome-select");
  };

  // Handler: View plant details
  const handleViewDetails = () => {
    setAppState("plant-details");
  };

  // Handler: Back from plant details
  const handleBackFromDetails = () => {
    setAppState("feedback");
  };

  // Handler: Update plant description after retry
  const handleDescriptionUpdate = (description: string) => {
    if (gameState) {
      setGameState({
        ...gameState,
        plantDescription: description,
      });
    }
  };

  // Handler: Reset error boundary for plant details
  const handlePlantDetailsError = () => {
    setAppState("feedback");
  };

  // Conditional rendering based on app state
  return (
    <>
      {/* Language selector - always visible */}
      <LanguageSelector variant="floating" position="top-right" />

      {appState === "dome-select" && (
        <DomeSelector onDomeSelect={handleDomeSelect} />
      )}

      {appState === "mission" && gameState && (
        <MissionView
          gameState={gameState}
          domeName={selectedDome!}
          onFoundIt={handleFoundIt}
          onChangeDome={handleChangeDome}
        />
      )}

      {appState === "photo-upload" && (
        <PhotoCapture
          onCapture={handlePhotoCapture}
          onCancel={() => setAppState("mission")}
        />
      )}

      {appState === "feedback" && feedbackData && capturedImage && (
        <FeedbackView
          feedback={feedbackData}
          capturedImage={capturedImage}
          plantDescription={gameState?.plantDescription ?? null}
          onNextMission={handleNextMission}
          onTryAgain={handleTryAgain}
          onViewDetails={handleViewDetails}
        />
      )}

      {appState === "plant-details" && gameState && (
        <ErrorBoundary onReset={handlePlantDetailsError}>
          <PlantDetailsView
            gameState={gameState}
            onBack={handleBackFromDetails}
            onDescriptionUpdate={handleDescriptionUpdate}
          />
        </ErrorBoundary>
      )}

      {isLoading && <LoadingSpinner message={loadingMessage} />}
    </>
  );
}

export default App;
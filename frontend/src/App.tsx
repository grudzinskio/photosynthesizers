import { useState } from "react";
import type { AppState, DomeName, Mission, FeedbackData } from "@/types";
import { getMission, getMissionCount } from "@/data/missions";
import { DomeSelector } from "@/components/DomeSelector";
import { MissionView } from "@/components/MissionView";
import { PhotoCapture } from "@/components/PhotoCapture";
import { FeedbackView } from "@/components/FeedbackView";
import { LoadingSpinner } from "@/components/LoadingSpinner";

function App() {
  // State management
  const [selectedDome, setSelectedDome] = useState<DomeName | null>(null);
  const [currentMission, setCurrentMission] = useState<Mission | null>(null);
  const [appState, setAppState] = useState<AppState>("dome-select");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [feedbackData, setFeedbackData] = useState<FeedbackData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [missionIndex, setMissionIndex] = useState(0);

  // Helper function to fetch mission from static data
  const fetchMission = (dome: DomeName, index: number): Mission | null => {
    return getMission(dome, index);
  };

  // Helper function to simulate verification (mock success/failure)
  const simulateVerification = async (): Promise<FeedbackData> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Random success/failure for now (70% success rate)
    const isSuccess = Math.random() > 0.3;

    if (isSuccess) {
      return {
        success: true,
        message: "Great job! You found the correct plant. Your knowledge of botanical specimens is impressive!",
      };
    } else {
      return {
        success: false,
        message: "Not quite right. Take another look at the riddle and reference image, then try again!",
      };
    }
  };

  // Handler: Dome selection
  const handleDomeSelect = (dome: DomeName) => {
    setSelectedDome(dome);
    setMissionIndex(0);
    const mission = fetchMission(dome, 0);
    if (mission) {
      setCurrentMission(mission);
      setAppState("mission");
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
    setAppState("feedback");

    try {
      const feedback = await simulateVerification();
      setFeedbackData(feedback);
    } catch {
      setFeedbackData({
        success: false,
        message: "An error occurred during verification. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Next mission after success
  const handleNextMission = () => {
    if (!selectedDome) return;

    const nextIndex = missionIndex + 1;
    const totalMissions = getMissionCount(selectedDome);

    if (nextIndex >= totalMissions) {
      // Wrap around to first mission
      setMissionIndex(0);
      const mission = fetchMission(selectedDome, 0);
      setCurrentMission(mission);
    } else {
      setMissionIndex(nextIndex);
      const mission = fetchMission(selectedDome, nextIndex);
      setCurrentMission(mission);
    }

    // Reset state for new mission
    setCapturedImage(null);
    setFeedbackData(null);
    setAppState("mission");
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
    setCurrentMission(null);
    setMissionIndex(0);
    setCapturedImage(null);
    setFeedbackData(null);
    setAppState("dome-select");
  };

  // Conditional rendering based on app state
  return (
    <>
      {appState === "dome-select" && (
        <DomeSelector onDomeSelect={handleDomeSelect} />
      )}

      {appState === "mission" && currentMission && selectedDome && (
        <MissionView
          mission={currentMission}
          domeName={selectedDome}
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
          onNextMission={handleNextMission}
          onTryAgain={handleTryAgain}
        />
      )}

      {isLoading && <LoadingSpinner message="Analyzing..." />}
    </>
  );
}

export default App;
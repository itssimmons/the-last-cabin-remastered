import { useEffect, useRef, useState } from "react";
import MainMenu from "./components/MainMenu";
import GameBackground from "./components/GameBackground";
import GameScreen from "./components/GameScreen";
import PlayScreen from "./components/PlayScreen";
import IntroScreen from "./components/IntroScreen";
import LoadingScreen from "./components/LoadingScreen";
import WinScreen from "./components/WinScreen";
import LoseScreen from "./components/LoseScreen";
import { SettingsProvider } from "./contexts/SettingsContext";

type Screen = "intro" | "menu" | "game" | "loading" | "play" | "win" | "lose";

export default function App() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [blendMode, setBlendMode] = useState<
    "plus-lighter" | "overlay"
  >("plus-lighter");
  const [currentScreen, setCurrentScreen] =
    useState<Screen>("intro");

  // Handle URL routing
  useEffect(() => {
    const path = window.location.pathname;
    if (path === "/" || path === "/intro") {
      setCurrentScreen("intro");
    } else if (path === "/loading") {
      setCurrentScreen("loading");
    } else if (path === "/play") {
      setCurrentScreen("play");
    } else if (path === "/game") {
      setCurrentScreen("game");
    } else if (path === "/menu") {
      setCurrentScreen("menu");
    } else if (path === "/win") {
      setCurrentScreen("win");
    } else if (path === "/lose") {
      setCurrentScreen("lose");
    } else {
      // Default to intro for any unrecognized path
      setCurrentScreen("intro");
    }
  }, []);

  // Play menu audio when transitioning to menu screen
  useEffect(() => {
    const playMenuAudio = async () => {
      if (currentScreen === "menu" && audioRef.current) {
        try {
          // Start with good volume for menu experience
          audioRef.current.volume = 0.4;
          await audioRef.current.play();
          console.log("🎵 MENU: Background music started");
        } catch (error) {
          // Autoplay might be blocked by browser policy
          console.log(
            "🎵 MENU: Autoplay was prevented. User interaction required.",
          );
        }
      } else if (currentScreen !== "menu" && audioRef.current) {
        // Pause menu audio when not on menu
        audioRef.current.pause();
        console.log("🎵 MENU: Background music paused");
      }
    };

    playMenuAudio();
  }, [currentScreen]);

  useEffect(() => {
    // Blend mode cycling animation
    const cycleInterval = setInterval(() => {
      // Quick switch to overlay
      setBlendMode("overlay");

      setTimeout(() => {
        // Switch back to plus-lighter
        setBlendMode("plus-lighter");

        setTimeout(() => {
          // Second quick switch to overlay
          setBlendMode("overlay");

          setTimeout(() => {
            // Return to plus-lighter for the remainder of the cycle
            setBlendMode("plus-lighter");
          }, 100); // 100ms for second overlay
        }, 100); // 100ms for plus-lighter between switches
      }, 100); // 100ms for first overlay
    }, 5000); // Every 5 seconds

    return () => clearInterval(cycleInterval);
  }, []);

  const handleNavigateToGame = () => {
    setCurrentScreen("game");
    window.history.pushState({}, "", "/game");
  };

  const handleNavigateToPlay = () => {
    setCurrentScreen("loading");
    window.history.pushState({}, "", "/loading");
  };

  const handleLoadingComplete = () => {
    setCurrentScreen("play");
    window.history.pushState({}, "", "/play");
  };

  const handleBackToMenu = () => {
    setCurrentScreen("menu");
    window.history.pushState({}, "", "/menu");
  };

  const handleNavigateToWin = () => {
    setCurrentScreen("win");
    window.history.pushState({}, "", "/win");
  };

  const handleNavigateToLose = () => {
    setCurrentScreen("lose");
    window.history.pushState({}, "", "/lose");
  };

  const handleRetryGame = () => {
    setCurrentScreen("loading");
    window.history.pushState({}, "", "/loading");
  };

  const handleIntroComplete = () => {
    setCurrentScreen("menu");
    window.history.pushState({}, "", "/menu");

    // Ensure menu audio starts playing after intro completes
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.volume = 0.4;
        audioRef.current.play().catch((error) => {
          console.log(
            "🎵 MENU: Could not start audio after intro:",
            error,
          );
        });
      }
    }, 100);
  };

  return (
    <SettingsProvider>
      <div
        className={`size-full relative bg-black overflow-hidden ${currentScreen === "intro" || currentScreen === "play" ? "intro-cursor" : "cursor-auto"}`}
      >
        {/* Menu Background Music */}
        <audio
          ref={audioRef}
          loop
          preload="auto"
          className="hidden"
        >
          <source
            src="https://storage.googleapis.com/the-last-cabin-storage/audios/menu_soundtrack.mp3"
            type="audio/mp3"
          />
          {/* Fallback message */}
          Your browser does not support the audio element.
        </audio>

        {currentScreen === "intro" ? (
          <IntroScreen onComplete={handleIntroComplete} />
        ) : currentScreen === "menu" ? (
          <>
            {/* 3-Layer Game Background */}
            <GameBackground />

            {/* Atmospheric Overlay */}
            <div
              className="absolute inset-0 w-full h-full bg-center bg-cover bg-no-repeat pointer-events-none"
              style={{
                backgroundImage: `url(https://i.imgur.com/Bwf2d6R.jpeg)`,
                opacity: 0.7,
                mixBlendMode: blendMode,
                transition: "mix-blend-mode 0.05s ease-in-out",
              }}
            />

            {/* Main Menu */}
            <MainMenu
              onNavigateToGame={handleNavigateToGame}
              onNavigateToPlay={handleNavigateToPlay}
            />
          </>
        ) : currentScreen === "loading" ? (
          <LoadingScreen onComplete={handleLoadingComplete} />
        ) : currentScreen === "play" ? (
          <PlayScreen 
            onBackToMenu={handleBackToMenu}
            onNavigateToWin={handleNavigateToWin}
            onNavigateToLose={handleNavigateToLose}
          />
        ) : currentScreen === "win" ? (
          <WinScreen onBackToMenu={handleBackToMenu} />
        ) : currentScreen === "lose" ? (
          <LoseScreen 
            onBackToMenu={handleBackToMenu}
            onRetry={handleRetryGame}
          />
        ) : (
          <GameScreen onBackToMenu={handleBackToMenu} />
        )}
      </div>
    </SettingsProvider>
  );
}
import { useEffect, useState, useRef } from "react";

interface LoadingScreenProps {
  onComplete: () => void;
}

// Define all the assets that need to be preloaded
const GAME_ASSETS = [
  // Video assets
  "https://storage.googleapis.com/the-last-cabin-storage/videos/game.mp4",
  "https://storage.googleapis.com/the-last-cabin-storage/videos/scream-1.mp4",
  "https://storage.googleapis.com/the-last-cabin-storage/videos/scream-2.mp4",

  // Audio assets
  "https://storage.googleapis.com/the-last-cabin-storage/audios/footsteps.mp3",
  "https://storage.googleapis.com/the-last-cabin-storage/audios/heavy-footsteps.mp3",
  "https://storage.googleapis.com/the-last-cabin-storage/audios/death-countdown.mp3",
  "https://storage.googleapis.com/the-last-cabin-storage/audios/game-soundtrack.mp3",
  "https://storage.googleapis.com/the-last-cabin-storage/audios/suspiro.mp3",

  // Image assets (if any additional ones are needed for the game)
  "https://storage.googleapis.com/the-last-cabin-storage/images/horror-face.png",
  "https://storage.googleapis.com/the-last-cabin-storage/images/blood.png",
];

function ProgressBar({ value }: { value: number }) {
  return (
    <div
      className="h-[35px] w-[703px]"
      data-name="Button Container"
    >
      <div className="relative">
        <div className="">
          <img
            src="https://i.imgur.com/VlMdkpx.png"
            height={35}
          />
        </div>
        {/* Animated progress fill */}
        <div className="absolute top-1/2 left-1/2 translate-x-[-50%] translate-y-[-50%] flex items-start justify-start w-full h-[25px] px-5">
          <span
            className="block h-full bg-gradient-to-r from-red-800 via-red-600 to-red-800 transition-all duration-1000 ease-linear"
            style={{
              width: `${value}%`,
              clipPath: "inset(0 0 0 0)",
              zIndex: 1,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function LoadingScreen({
  onComplete,
}: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [loadedAssets, setLoadedAssets] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log("🎮 LOADING: Starting asset preloading...");

    let completedAssets = 0;
    const totalAssets = GAME_ASSETS.length;

    const updateProgress = () => {
      completedAssets++;
      const newProgress = Math.round(
        (completedAssets / totalAssets) * 100,
      );
      setProgress(newProgress);
      setLoadedAssets(completedAssets);

      console.log(
        `🎮 LOADING: ${completedAssets}/${totalAssets} assets loaded (${newProgress}%)`,
      );

      // Check if all assets are loaded
      if (completedAssets >= totalAssets) {
        console.log(
          "🎮 LOADING: All assets preloaded successfully!",
        );
        setIsComplete(true);

        // Wait a brief moment to show 100% completion, then redirect
        timeoutRef.current = setTimeout(() => {
          onComplete();
        }, 800);
      }
    };

    // Preload each asset
    GAME_ASSETS.forEach((assetUrl, index) => {
      const fileExtension = assetUrl
        .split(".")
        .pop()
        ?.toLowerCase();

      if (fileExtension === "mp4") {
        // Preload video
        const video = document.createElement("video");
        video.preload = "auto";
        video.muted = true; // Muted for autoplay compatibility

        const onVideoLoaded = () => {
          video.removeEventListener(
            "canplaythrough",
            onVideoLoaded,
          );
          video.removeEventListener("error", onVideoError);
          updateProgress();
        };

        const onVideoError = () => {
          console.warn(
            `🎮 LOADING: Failed to load video: ${assetUrl}`,
          );
          video.removeEventListener(
            "canplaythrough",
            onVideoLoaded,
          );
          video.removeEventListener("error", onVideoError);
          updateProgress(); // Still count as "loaded" to prevent hanging
        };

        video.addEventListener("canplaythrough", onVideoLoaded);
        video.addEventListener("error", onVideoError);
        video.src = assetUrl;
      } else if (fileExtension === "mp3") {
        // Preload audio
        const audio = new Audio();

        const onAudioLoaded = () => {
          audio.removeEventListener(
            "canplaythrough",
            onAudioLoaded,
          );
          audio.removeEventListener("error", onAudioError);
          updateProgress();
        };

        const onAudioError = () => {
          console.warn(
            `🎮 LOADING: Failed to load audio: ${assetUrl}`,
          );
          audio.removeEventListener(
            "canplaythrough",
            onAudioLoaded,
          );
          audio.removeEventListener("error", onAudioError);
          updateProgress(); // Still count as "loaded" to prevent hanging
        };

        audio.addEventListener("canplaythrough", onAudioLoaded);
        audio.addEventListener("error", onAudioError);
        audio.preload = "auto";
        audio.src = assetUrl;
      } else {
        // Preload image
        const img = new Image();

        const onImageLoaded = () => {
          img.removeEventListener("load", onImageLoaded);
          img.removeEventListener("error", onImageError);
          updateProgress();
        };

        const onImageError = () => {
          console.warn(
            `🎮 LOADING: Failed to load image: ${assetUrl}`,
          );
          img.removeEventListener("load", onImageLoaded);
          img.removeEventListener("error", onImageError);
          updateProgress(); // Still count as "loaded" to prevent hanging
        };

        img.addEventListener("load", onImageLoaded);
        img.addEventListener("error", onImageError);
        img.src = assetUrl;
      }
    });

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [onComplete]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {/* Full Screen Loading Background Image */}
      <div
        className="absolute inset-0 w-full h-full bg-center bg-cover bg-no-repeat"
        style={{
          backgroundImage:
            "url(https://storage.googleapis.com/the-last-cabin-storage/images/loading.jpg)",
        }}
      />

      {/* Dark Overlay for Better Text Visibility */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Progress Bar - Bottom Center */}
      <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2">
        <ProgressBar value={progress} />
      </div>
    </div>
  );
}
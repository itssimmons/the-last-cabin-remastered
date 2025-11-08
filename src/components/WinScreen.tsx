import { useEffect } from "react";

interface WinScreenProps {
  onBackToMenu: () => void;
}

export default function WinScreen({ onBackToMenu }: WinScreenProps) {
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        onBackToMenu();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [onBackToMenu]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Full screen win image */}
      <img
        src="https://storage.googleapis.com/the-last-cabin-storage/images/win.jpg"
        alt="You Win!"
        className="w-full h-full object-cover"
      />
      
      {/* Invisible overlay for click to continue */}
      <div
        className="absolute inset-0 cursor-pointer flex items-center justify-center"
        onClick={onBackToMenu}
      >
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <p className="text-white text-lg opacity-75 animate-pulse">
            Click anywhere or press Enter to continue
          </p>
        </div>
      </div>
    </div>
  );
}
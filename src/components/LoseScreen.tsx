import { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface LoseScreenProps {
  onBackToMenu: () => void;
  onRetry: () => void;
}

export default function LoseScreen({ onBackToMenu, onRetry }: LoseScreenProps) {
  const buttonBackgroundsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        onRetry(); // Default action is retry
      } else if (e.key === "Escape") {
        onBackToMenu();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [onBackToMenu, onRetry]);

  // Set up hover animations
  useEffect(() => {
    const buttons = document.querySelectorAll('.lose-button-wrapper');
    
    buttons.forEach((button, index) => {
      const buttonBg = buttonBackgroundsRef.current[index];
      
      const handleMouseEnter = () => {
        if (buttonBg) {
          gsap.to(buttonBg, {
            opacity: 1,
            duration: 0.3,
            ease: "power2.out"
          });
        }
      };

      const handleMouseLeave = () => {
        if (buttonBg) {
          gsap.to(buttonBg, {
            opacity: 0,
            duration: 0.3,
            ease: "power2.out"
          });
        }
      };

      button.addEventListener('mouseenter', handleMouseEnter);
      button.addEventListener('mouseleave', handleMouseLeave);

      // Cleanup
      return () => {
        button.removeEventListener('mouseenter', handleMouseEnter);
        button.removeEventListener('mouseleave', handleMouseLeave);
      };
    });
  }, []);

  const setButtonBackgroundRef = (index: number) => (ref: HTMLDivElement | null) => {
    buttonBackgroundsRef.current[index] = ref;
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Full screen lose image */}
      <img
        src="https://storage.googleapis.com/the-last-cabin-storage/images/lose.jpg"
        alt="Game Over"
        className="w-full h-full object-cover"
      />
      
      {/* Buttons at bottom center */}
      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex gap-6 z-10">
        <div className="lose-button-wrapper" onClick={onBackToMenu}>
          <div 
            ref={setButtonBackgroundRef(0)}
            className="button-background"
          ></div>
          <div className="lose-button">
            Main Menu
          </div>
        </div>
        <div className="lose-button-wrapper" onClick={onRetry}>
          <div 
            ref={setButtonBackgroundRef(1)}
            className="button-background"
          ></div>
          <div className="lose-button">
            Retry
          </div>
        </div>
      </div>

      {/* Keyboard hints */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center">
        <p className="text-white/60 text-sm">
          Press Enter to Retry • Press Escape for Main Menu
        </p>
      </div>

      <style>{`
        .lose-button-wrapper {
          position: relative;
          width: 200px;
          height: 60px;
          cursor: pointer;
        }

        .button-background {
          position: absolute;
          top: 0;
          left: -25px;
          width: 250px;
          height: 60px;
          z-index: 1;
          opacity: 0;
          background-image: url('https://i.imgur.com/Pu4ATTN.png');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }

        .lose-button {
          position: relative;
          z-index: 2;
          color: white;
          font-size: 1.125rem;
          font-weight: 500;
          cursor: pointer;
          user-select: none;
          font-family: 'SF Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          padding: 16px 20px;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          text-align: center;
        }

        @media (max-width: 768px) {
          .lose-button-wrapper {
            width: 160px;
            height: 50px;
          }

          .button-background {
            left: -20px;
            width: 200px;
            height: 50px;
          }
          
          .lose-button {
            font-size: 1rem;
            padding: 12px 16px;
          }
        }

        @media (max-width: 480px) {
          .lose-button-wrapper {
            width: 140px;
            height: 45px;
          }

          .button-background {
            left: -15px;
            width: 170px;
            height: 45px;
          }
          
          .lose-button {
            font-size: 0.875rem;
            padding: 10px 14px;
          }
        }
      `}</style>
    </div>
  );
}
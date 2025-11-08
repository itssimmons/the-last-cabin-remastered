import { useEffect, useRef, useState } from 'react';

interface IntroScreenProps {
  onComplete: () => void;
}

export default function IntroScreen({ onComplete }: IntroScreenProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [audioStarted, setAudioStarted] = useState(false);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log('🎬 INTRO: Starting intro sequence...');
    
    // Preload audio but don't autoplay (will play on user interaction)
    if (audioRef.current) {
      audioRef.current.volume = 0.7;
      audioRef.current.load();
      console.log('🔊 INTRO: Audio preloaded, waiting for user interaction...');
    }

    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  // Function to start audio with user interaction
  const startAudioWithInteraction = async () => {
    if (!audioStarted && audioRef.current) {
      try {
        await audioRef.current.play();
        setAudioStarted(true);
        console.log('🔊 INTRO: Surround audio started with user interaction');
      } catch (error) {
        console.log('⚠️ INTRO: Could not start audio:', error);
      }
    }
  };

  const startHold = () => {
    setIsHolding(true);
    setHoldProgress(0);
    console.log('🎯 INTRO: Starting hold gesture...');

    // Start audio on first user interaction
    startAudioWithInteraction();

    // Progress animation (update every 10ms for smooth animation)
    progressIntervalRef.current = setInterval(() => {
      setHoldProgress(prev => {
        const newProgress = prev + 1; // 1% every 10ms = 100% in 1000ms
        return Math.min(100, newProgress);
      });
    }, 10);

    // Complete after 1 second
    holdTimerRef.current = setTimeout(() => {
      console.log('🎬 INTRO: Hold completed, proceeding to menu...');
      onComplete();
    }, 1000);
  };

  const cancelHold = () => {
    setIsHolding(false);
    setHoldProgress(0);
    console.log('🎯 INTRO: Hold cancelled');

    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  return (
    <div 
      className="relative w-screen h-screen overflow-hidden"
      style={{ cursor: 'none' }} // Hide default cursor
      onMouseMove={handleMouseMove}
    >
      {/* Surround Audio (no loop) */}
      <audio
        ref={audioRef}
        preload="auto"
        className="hidden"
      >
        <source 
          src="https://storage.googleapis.com/the-last-cabin-storage/audios/surround.mp3" 
          type="audio/mp3" 
        />
        Your browser does not support the audio element.
      </audio>

      {/* Full Screen Warning Image */}
      <div
        className="absolute inset-0 w-full h-full bg-center bg-cover bg-no-repeat"
        style={{
          backgroundImage: 'url(https://storage.googleapis.com/the-last-cabin-storage/images/warning.jpg)',
        }}
      />

      {/* Hold to Continue Area */}
      <div 
        className="absolute inset-0 w-full h-full"
        onMouseDown={startHold}
        onMouseUp={cancelHold}
        onMouseLeave={cancelHold}
        onTouchStart={startHold}
        onTouchEnd={cancelHold}
      />

      {/* Custom Cursor - Simple Circular Progress */}
      <div 
        className="fixed pointer-events-none z-50 transition-transform duration-75 ease-out"
        style={{
          left: mousePosition.x,
          top: mousePosition.y,
          transform: `translate(-50%, -50%) scale(${isHolding ? 0.85 : 1})`,
        }}
      >
        <div className="relative w-12 h-12">
          {/* Simple Border Circle */}
          <div className="absolute inset-0 w-12 h-12 rounded-full border border-white/60" />
          
          {/* Progress Circle */}
          <svg className="absolute inset-0 w-12 h-12 -rotate-90" viewBox="0 0 48 48">
            <circle
              cx="24"
              cy="24"
              r="22"
              fill="none"
              stroke="white"
              strokeWidth="1"
              strokeDasharray={`${(holdProgress / 100) * 138.2} 138.2`}
              strokeLinecap="round"
              className="transition-all duration-100 ease-linear"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
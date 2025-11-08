import { useState } from 'react';

interface GameScreenProps {
  onBackToMenu: () => void;
}

const GameScreen = ({ onBackToMenu }: GameScreenProps) => {
  return (
    <div className="size-full relative bg-cyan-500 overflow-hidden">
      {/* Game content container */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <h1 className="text-white text-6xl mb-8">Game Screen</h1>
        <p className="text-white text-xl mb-8">Welcome to the game!</p>
        
        {/* Back to menu button */}
        <button
          onClick={onBackToMenu}
          className="px-6 py-3 bg-white bg-opacity-20 text-white text-lg rounded-lg hover:bg-opacity-30 transition-all duration-300 border border-white border-opacity-30"
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
};

export default GameScreen;
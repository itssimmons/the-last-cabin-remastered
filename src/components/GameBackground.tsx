const GameBackground = () => {
  return (
    <div className="fixed inset-0 w-full h-full">
      {/* Single Background Image */}
      <div
        className="absolute inset-0 w-full h-full bg-center bg-cover bg-no-repeat"
        style={{
          backgroundImage: `url(https://storage.googleapis.com/the-last-cabin-storage/images/background.jpg)`,
          backgroundColor: "#1a1a1a", // Dark fallback color
        }}
      />
    </div>
  );
};

export default GameBackground;
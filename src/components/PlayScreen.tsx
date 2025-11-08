import { useEffect, useState, useRef } from "react";
import { imgFrame12, imgLine2 } from "../imports/svg-mv9ey";
import ProgressBarBackgroundImage from "./progress-bar";
import { useSettings } from "../contexts/SettingsContext";

interface PlayScreenProps {
  onBackToMenu: () => void;
  onNavigateToWin: () => void;
  onNavigateToLose: () => void;
}

function CenterLine() {
  return (
    <div className="absolute left-1/2 top-1/2 translate-x-[-50%] translate-y-[-45%] opacity-50">
      {/* <img className="" src="https://i.imgur.com/ll1HWfe.png" /> */}
    </div>
  );
}

function AudioDetectionBars({
  audioLevel,
}: {
  audioLevel: number;
}) {
  // Convert audio level (0-100) to number of bars to fill (0-8)
  const filledBars = Math.ceil((audioLevel / 100) * 8);

  const getBarStyle = (index: number) => {
    if (index < filledBars) {
      // Filled bars - green to yellow to red gradient based on level
      let color = "rgba(34, 197, 94, 0.8)"; // green-500 with opacity
      if (audioLevel >= 30 && audioLevel < 60) {
        color = "rgba(234, 179, 8, 0.8)"; // yellow-500 with opacity
      } else if (audioLevel >= 60) {
        color = "rgba(239, 68, 68, 0.8)"; // red-500 with opacity
      }
      return { backgroundColor: color };
    }
    return { backgroundColor: "rgba(255,255,255,0.18)" }; // Default unfilled
  };

  return (
    <div className="absolute bottom-[50px] right-[50px] z-40">
      <div className="absolute bottom-0 content-stretch flex flex-col gap-[5.125px] h-[132px] items-start justify-start right-0 w-12">
        {[...Array(8)].map((_, index) => (
          <div
            key={index}
            className="h-3 relative shrink-0 w-full transition-all duration-150"
            style={getBarStyle(7 - index)} // Reverse order so bars fill from bottom
          >
            <div
              aria-hidden="true"
              className="absolute border border-black border-solid inset-[-0.5px] pointer-events-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

interface FaceDetection {
  landmarks: Array<{ x: number; y: number; z: number }>;
  roll: number;
  yaw: number;
  pitch: number;
  faceCenter?: {
    x: number;
    y: number;
  };
}

interface GameEvent {
  id: number;
  type: "footsteps" | "heavy-footsteps" | "event3" | "insanity";
  isActive: boolean;
  startTime: number;
  duration: number;
}

interface FaceEvent {
  id: number;
  side: "left" | "right";
  randomX: number; // Random X position between left and right bounds
  startTime: number;
  duration: number;
  lookingTime: number;
  jumpScareTriggered: boolean;
}

const PlayScreen = ({
  onBackToMenu,
  onNavigateToWin,
  onNavigateToLose,
}: PlayScreenProps) => {
  const {
    selectedCameraId,
    selectedMicrophoneId,
    useCameraFaceDetection,
    useMicrophoneDetection,
  } = useSettings();

  const [progress, setProgress] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [micPermission, setMicPermission] = useState<
    "pending" | "granted" | "denied"
  >("pending");
  const [micError, setMicError] = useState<string | null>(null);

  // Camera and face detection states
  const [cameraPermission, setCameraPermission] = useState<
    "pending" | "granted" | "denied"
  >("pending");
  const [cameraError, setCameraError] = useState<string | null>(
    null,
  );
  const [cameraStarted, setCameraStarted] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceData, setFaceData] =
    useState<FaceDetection | null>(null);
  const [faceSide, setFaceSide] = useState<
    "left" | "right" | "center" | null
  >(null);
  const [isDetecting, setIsDetecting] = useState(false);

  // Game event states
  const [currentEvent, setCurrentEvent] =
    useState<GameEvent | null>(null);
  const [eyesClosed, setEyesClosed] = useState(false);
  const [spacebarHoldTime, setSpacebarHoldTime] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameOverReason, setGameOverReason] = useState<
    string | null
  >(null);
  const [currentLookingTime, setCurrentLookingTime] =
    useState(0); // Current looking time in seconds
  const [eventHistory, setEventHistory] = useState<number[]>(
    [],
  );
  const [eventCooldown, setEventCooldown] = useState(false);

  // Face event states (can run simultaneously with other events)
  const [faceEvent, setFaceEvent] = useState<FaceEvent | null>(
    null,
  );

  // Lives system states
  const [lostLives, setLostLives] = useState(0); // 0-3 lost lives
  const [livesCountdown, setLivesCountdown] = useState<
    number | null
  >(null); // Random 1-3s countdown before death when 3 lives lost
  const [footstepsEyesClosedTime, setFootstepsEyesClosedTime] =
    useState(0); // Track how long eyes have been closed during footsteps

  // Intro countdown states (35 seconds before events can start)
  const [introCountdown, setIntroCountdown] = useState(35); // 35 seconds intro
  const [introActive, setIntroActive] = useState(true); // Events disabled during intro

  // Calculate red border opacity based on lost lives
  const getRedBorderOpacity = () => {
    if (lostLives === 0) return 0; // 3 lives remaining - 0% opacity
    if (lostLives === 1) return 0.2; // 2 lives remaining - 20% opacity
    if (lostLives === 2) return 0.4; // 1 life remaining - 40% opacity
    if (lostLives >= 3) return 0.6; // 0 lives remaining - 60% opacity
    return 0;
  };
  const [cursorPosition, setCursorPosition] = useState({
    x: 0,
    y: 0,
  });

  // Debug panel visibility
  const [debugPanelVisible, setDebugPanelVisible] =
    useState(false);

  // Audio refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef =
    useRef<MediaStreamAudioSourceNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Camera and face detection refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const faceLandmarkerRef = useRef<any>(null);
  const faceDetectionFrameRef = useRef<number | null>(null);

  // Game event refs
  const footstepsAudioRef = useRef<HTMLAudioElement>(null);
  const heavyFootstepsAudioRef = useRef<HTMLAudioElement>(null);
  const spacebarTimerRef = useRef<NodeJS.Timeout | null>(null);
  const eventTimerRef = useRef<NodeJS.Timeout | null>(null);
  const spacebarStartTimeRef = useRef<number | null>(null);
  const eventEndTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const eyesClosedStartTimeRef = useRef<number | null>(null);
  const eyesClosedRef = useRef<boolean>(false);

  // Face event refs
  const faceEventTimerRef = useRef<NodeJS.Timeout | null>(null);
  const faceEventSchedulerRef = useRef<NodeJS.Timeout | null>(
    null,
  );
  const jumpScareAudioRef = useRef<HTMLAudioElement>(null);
  const lookingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lookingStartTimeRef = useRef<number | null>(null);
  const lookingUpdateIntervalRef =
    useRef<NodeJS.Timeout | null>(null);

  // Microphone death mechanism refs
  const deathCountdownTimerRef = useRef<NodeJS.Timeout | null>(
    null,
  );
  const deathCountdownUpdateRef = useRef<NodeJS.Timeout | null>(
    null,
  );
  const whiteScreenAudioRef = useRef<HTMLAudioElement>(null);
  const jumpScareVideoRef = useRef<HTMLVideoElement>(null);

  // Eye closure death mechanism refs
  const eyeClosureIntervalRef = useRef<NodeJS.Timeout | null>(
    null,
  );
  const eyeClosureDeathTimerRef = useRef<NodeJS.Timeout | null>(
    null,
  );
  const eyeClosureDeathUpdateRef =
    useRef<NodeJS.Timeout | null>(null);

  // Lives system refs
  const livesCountdownTimerRef = useRef<NodeJS.Timeout | null>(
    null,
  );
  const livesCountdownUpdateRef = useRef<NodeJS.Timeout | null>(
    null,
  );
  const footstepsEyeClosureTimerRef =
    useRef<NodeJS.Timeout | null>(null);

  // Intro countdown refs
  const introCountdownTimerRef = useRef<NodeJS.Timeout | null>(
    null,
  );

  // Insanity event refs and states
  const insanityAudioRef = useRef<HTMLAudioElement>(null);
  const insanityWarningAudioRef =
    useRef<HTMLAudioElement>(null);
  const insanityWarningTimerRef = useRef<NodeJS.Timeout | null>(
    null,
  );
  const insanityVolumeIntervalRef =
    useRef<NodeJS.Timeout | null>(null);
  const [insanityWarning, setInsanityWarning] = useState(false);
  const [insanityActive, setInsanityActive] = useState(false);

  // Debug states
  const [debugMode, setDebugMode] = useState(false);
  const [selectedDebugEvent, setSelectedDebugEvent] = useState<
    "footsteps" | "heavy-footsteps" | "face-event" | "insanity"
  >("footsteps");
  const [debugEventRunning, setDebugEventRunning] =
    useState(false);

  // Mouse tracking states (fallback when camera is not available)
  const [mousePosition, setMousePosition] = useState({
    x: 0,
    y: 0,
  });
  const [isMouseTracking, setIsMouseTracking] = useState(false);

  // Microphone death mechanism states
  const [redAreaReached, setRedAreaReached] = useState(false);
  const [deathCountdown, setDeathCountdown] = useState<
    number | null
  >(null);
  const [whiteScreenJumpScare, setWhiteScreenJumpScare] =
    useState(false);
  const [whiteScreenOpacity, setWhiteScreenOpacity] =
    useState(0);
  const [jumpScareVideoSrc, setJumpScareVideoSrc] =
    useState<string>("");

  // Global coordinate tracking for collision detection
  const [horrorFaceCoords, setHorrorFaceCoords] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [pointerCoords, setPointerCoords] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [collisionDetected, setCollisionDetected] =
    useState(false);

  // Eye closure death mechanism states
  const [eyeClosureCountdown, setEyeClosureCountdown] =
    useState(0); // Current countdown in seconds (0-10)
  const [
    isEyeClosureCountdownActive,
    setIsEyeClosureCountdownActive,
  ] = useState(false);
  const [
    eyeClosureDeathCountdown,
    setEyeClosureDeathCountdown,
  ] = useState<number | null>(null); // Random 1-3s countdown before death

  // Load MediaPipe FaceLandmarker model
  const loadFaceDetectionModels = async () => {
    console.log("Loading MediaPipe FaceLandmarker model...");

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Model loading timeout")),
          30000,
        ),
      );

      const loadPromise = (async () => {
        const { FaceLandmarker, FilesetResolver } =
          await import(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14"
          );

        const filesetResolver =
          await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm",
          );

        const landmarker =
          await FaceLandmarker.createFromOptions(
            filesetResolver,
            {
              baseOptions: {
                modelAssetPath:
                  "https://storage.googleapis.com/mediapipe-assets/face_landmarker.task",
              },
              outputFaceBlendshapes: false,
              runningMode: "VIDEO",
              numFaces: 1,
            },
          );

        return landmarker;
      })();

      const landmarker = await Promise.race([
        loadPromise,
        timeoutPromise,
      ]);

      faceLandmarkerRef.current = landmarker;
      console.log(
        "MediaPipe FaceLandmarker loaded successfully",
      );
      setModelsLoaded(true);
    } catch (err) {
      console.error(
        "Failed to load MediaPipe FaceLandmarker:",
        err,
      );
      setCameraError(
        "Failed to load AI models. Please check your internet connection.",
      );
    }
  };

  // Initialize camera access - only if camera face detection is enabled
  const initCamera = async () => {
    // Skip camera initialization if face detection is disabled in settings
    if (!useCameraFaceDetection) {
      console.log(
        "🎥 Camera face detection disabled - using mouse fallback",
      );
      setCameraPermission("denied"); // Set to denied to skip camera UI
      setCameraStarted(false);
      // Mouse tracking will be handled by useEffect
      return;
    }

    try {
      // Build camera constraints with selected device ID if available
      const videoConstraints: MediaTrackConstraints = {
        width: 640,
        height: 360,
      };

      // Add device ID constraint if a specific camera is selected
      if (selectedCameraId) {
        videoConstraints.deviceId = { exact: selectedCameraId };
      }

      const mediaStream =
        await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        });

      console.log("🎥 Got camera stream:", mediaStream);
      cameraStreamRef.current = mediaStream;
      setCameraPermission("granted");
      setCameraStarted(true);

      // Load face detection models
      loadFaceDetectionModels();
    } catch (err: any) {
      console.error("🎥 Error accessing camera:", err);
      console.log("🎥 Falling back to mouse tracking...");
      setCameraPermission("denied");
      setCameraStarted(false);
      // Mouse tracking will be handled by useEffect

      if (err.name === "NotAllowedError") {
        console.log(
          "🎥 Camera access denied - using mouse fallback",
        );
      } else if (err.name === "NotFoundError") {
        console.log(
          "🎥 No camera found - using mouse fallback",
        );
      } else {
        console.log("🎥 Camera error - using mouse fallback");
      }
    }
  };

  // Initialize mouse tracking as fallback when camera is not available
  const initMouseTracking = () => {
    console.log("🖱️ Initializing mouse tracking fallback...");
    setIsMouseTracking(true);
    // Note: Mouse event listener is now handled by useEffect for better control
  };

  // Face detection function - using robust configuration from working example
  const detectFaces = async () => {
    if (
      !videoRef.current ||
      !canvasRef.current ||
      !modelsLoaded ||
      !faceLandmarkerRef.current ||
      isDetecting
    ) {
      return;
    }

    // Validate video dimensions before proceeding
    const video = videoRef.current;
    if (
      !video.videoWidth ||
      !video.videoHeight ||
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {
      console.log(
        "Video dimensions not ready yet:",
        video.videoWidth,
        "x",
        video.videoHeight,
      );
      return;
    }

    // Check if video is actually playing
    if (video.paused || video.ended || video.readyState < 2) {
      console.log("Video not ready for detection:", {
        paused: video.paused,
        ended: video.ended,
        readyState: video.readyState,
      });
      return;
    }

    setIsDetecting(true);

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        setIsDetecting(false);
        return;
      }

      // Set canvas dimensions to match video only if they've changed
      if (
        canvas.width !== video.videoWidth ||
        canvas.height !== video.videoHeight
      ) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        console.log(
          "Updated canvas dimensions:",
          canvas.width,
          "x",
          canvas.height,
        );
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Perform face detection with timestamp
      const timestamp = performance.now();
      const results = faceLandmarkerRef.current.detectForVideo(
        video,
        timestamp,
      );

      if (
        results.faceLandmarks &&
        results.faceLandmarks.length > 0
      ) {
        const landmarks = results.faceLandmarks[0]; // Get first face landmarks

        // Calculate face angles exactly like the working example
        // Roll: angle of the line between eyes
        const L = landmarks[33]; // Left eye approximate
        const R = landmarks[263]; // Right eye approximate
        const dx = R.x - L.x;
        const dy = R.y - L.y;
        const roll = (Math.atan2(dy, dx) * 180) / Math.PI;

        // Yaw/Pitch using nose and midpoint between eyes
        const N = landmarks[1]; // Nose tip approximate
        const mid = {
          x: (L.x + R.x) / 2,
          y: (L.y + R.y) / 2,
          z: (L.z + R.z) / 2,
        };
        const vx = N.x - mid.x;
        const vy = N.y - mid.y;
        const vz = N.z - mid.z;
        const yaw = (Math.atan2(vx, -vz) * 180) / Math.PI; // left/right
        const pitch = (Math.atan2(vy, -vz) * 180) / Math.PI; // up/down

        // Simple drawing like the working example
        ctx.fillStyle = "red";
        landmarks.forEach((p) => {
          ctx.fillRect(
            p.x * canvas.width,
            p.y * canvas.height,
            2,
            2,
          );
        });

        // Calculate bounding box for overlay positioning
        const xs = landmarks.map((p) => p.x * canvas.width);
        const ys = landmarks.map((p) => p.y * canvas.height);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        const boundingBoxWidth = maxX - minX;
        const boundingBoxHeight = maxY - minY;

        // Calculate face center position normalized (0-1) within the video frame
        const faceCenterNormalizedX =
          (minX + boundingBoxWidth / 2) / canvas.width;
        const faceCenterNormalizedY =
          (minY + boundingBoxHeight / 2) / canvas.height;

        // Since camera is mirrored, flip the X coordinate for tracking square
        const flippedNormalizedX = 1 - faceCenterNormalizedX;

        // Map the normalized face position to the full screen dimensions
        const faceCenterX =
          flippedNormalizedX * window.innerWidth;
        const faceCenterY =
          faceCenterNormalizedY * window.innerHeight;

        const faceDataWithCenter = {
          landmarks: landmarks,
          roll: roll,
          yaw: yaw,
          pitch: pitch,
          faceCenter: {
            x: faceCenterX,
            y: faceCenterY,
          },
        };

        setFaceData(faceDataWithCenter);

        // Also update cursor position for flashlight when using camera
        if (useCameraFaceDetection && cameraStarted) {
          setCursorPosition({
            x: faceCenterX,
            y: faceCenterY,
          });
        }

        // Determine which side based on face center position (50/50 screen split)
        const screenCenterX = window.innerWidth / 2;
        const currentSide = faceSide;
        let newSide: "left" | "right" | "center" | null = null;

        // Add hysteresis zone around the center line for smooth transitions
        const hysteresisZone = 60; // pixels from center line

        if (currentSide === "left") {
          // If already on left, need to cross further right to switch
          if (faceCenterX > screenCenterX + hysteresisZone) {
            newSide = "right";
          } else if (
            faceCenterX >
            screenCenterX - hysteresisZone
          ) {
            newSide = "center";
          } else {
            newSide = "left";
          }
        } else if (currentSide === "right") {
          // If already on right, need to cross further left to switch
          if (faceCenterX < screenCenterX - hysteresisZone) {
            newSide = "left";
          } else if (
            faceCenterX <
            screenCenterX + hysteresisZone
          ) {
            newSide = "center";
          } else {
            newSide = "right";
          }
        } else {
          // From center or null, use smaller thresholds
          const threshold = 30;
          if (faceCenterX < screenCenterX - threshold) {
            newSide = "left";
          } else if (faceCenterX > screenCenterX + threshold) {
            newSide = "right";
          } else {
            newSide = "center";
          }
        }

        setFaceSide(newSide);

        // Log face position for debugging
        console.log(
          `Face center: ${faceCenterX.toFixed(0)}px, Screen center: ${screenCenterX.toFixed(0)}px, Side: ${newSide}`,
        );
      } else {
        setFaceData(null);
        setFaceSide(null);
      }
    } catch (err) {
      console.error("MediaPipe face detection error:", err);
      setFaceData(null);
      setFaceSide(null);

      // If we get consistent errors, stop the detection loop to prevent spam
      if (
        err.message &&
        err.message.includes("ROI width and height must be > 0")
      ) {
        console.log(
          "Stopping detection due to invalid video dimensions",
        );
        if (faceDetectionFrameRef.current) {
          cancelAnimationFrame(faceDetectionFrameRef.current);
          faceDetectionFrameRef.current = null;
        }
      }
    } finally {
      setIsDetecting(false);
    }
  };

  // Handle video events
  const handleVideoPlaying = () => {
    console.log("Video playing started");

    // Wait a moment for video dimensions to stabilize, then start detection
    setTimeout(() => {
      if (
        modelsLoaded &&
        !faceDetectionFrameRef.current &&
        videoRef.current
      ) {
        const video = videoRef.current;

        // Double-check video is ready with valid dimensions
        if (
          video.videoWidth > 0 &&
          video.videoHeight > 0 &&
          !video.paused
        ) {
          console.log(
            "Starting face detection with video dimensions:",
            video.videoWidth,
            "x",
            video.videoHeight,
          );

          const loop = () => {
            detectFaces()
              .then(() => {
                if (faceDetectionFrameRef.current) {
                  faceDetectionFrameRef.current =
                    requestAnimationFrame(loop);
                }
              })
              .catch((err) => {
                console.error("Detection loop error:", err);
                // Continue the loop even if individual detection fails
                if (faceDetectionFrameRef.current) {
                  faceDetectionFrameRef.current =
                    requestAnimationFrame(loop);
                }
              });
          };

          faceDetectionFrameRef.current =
            requestAnimationFrame(loop);
        } else {
          console.log("Video not ready yet, will retry...");
        }
      }
    }, 500); // Give video 500ms to stabilize
  };

  const handleVideoError = () => {
    console.error("Video error occurred");
    setCameraStarted(false);
    setCameraError(
      "Failed to load camera stream. Please try again.",
    );
  };

  const handleVideoLoadedMetadata = () => {
    console.log("Video metadata loaded");

    // Initialize canvas dimensions to match video
    if (canvasRef.current && videoRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      // Only set canvas dimensions if video has valid dimensions
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        console.log(
          "Canvas initialized with video dimensions:",
          canvas.width,
          "x",
          canvas.height,
        );
      } else {
        console.log(
          "Video dimensions not available yet:",
          video.videoWidth,
          "x",
          video.videoHeight,
        );
      }
    }
  };

  // Start face detection loop
  const startFaceDetection = () => {
    if (
      modelsLoaded &&
      videoRef.current &&
      !faceDetectionFrameRef.current
    ) {
      const video = videoRef.current;

      // Only start if video has valid dimensions and is playing
      if (
        video.videoWidth > 0 &&
        video.videoHeight > 0 &&
        !video.paused
      ) {
        console.log(
          "Models loaded, starting face detection loop with video:",
          video.videoWidth,
          "x",
          video.videoHeight,
        );

        const loop = () => {
          detectFaces()
            .then(() => {
              if (faceDetectionFrameRef.current) {
                faceDetectionFrameRef.current =
                  requestAnimationFrame(loop);
              }
            })
            .catch((err) => {
              console.error("Detection loop error:", err);
              if (faceDetectionFrameRef.current) {
                faceDetectionFrameRef.current =
                  requestAnimationFrame(loop);
              }
            });
        };

        faceDetectionFrameRef.current =
          requestAnimationFrame(loop);
      } else {
        console.log(
          "Video not ready for detection yet, waiting...",
          {
            width: video.videoWidth,
            height: video.videoHeight,
            paused: video.paused,
            readyState: video.readyState,
          },
        );
      }
    }
  };

  // Game Event System - Simplified and reliable
  const triggerFootstepsEvent = () => {
    // Allow debug events to bypass intro and safe zone restrictions
    const isDebugOverride = debugEventRunning;
    
    if (
      currentEvent ||
      gameOver ||
      (eventCooldown && !isDebugOverride) ||
      (introActive && !isDebugOverride)
    ) {
      console.log("⚠️ Cannot start footsteps event:", {
        currentEvent: !!currentEvent,
        gameOver,
        eventCooldown,
        introActive,
        debugOverride: isDebugOverride,
      });
      return;
    }

    // Random duration between 3-8 seconds
    const randomDuration = Math.random() * (8000 - 3000) + 3000; // 3000-8000ms
    const eventId = Date.now();

    const event: GameEvent = {
      id: eventId,
      type: "footsteps",
      isActive: true,
      startTime: Date.now(),
      duration: randomDuration,
    };

    setCurrentEvent(event);
    console.log(
      `🦶 Footsteps event #${eventId} started (${(randomDuration / 1000).toFixed(1)}s duration)`,
    );

    // Play simple audio (no complex fading for now to avoid timing issues)
    if (footstepsAudioRef.current) {
      const audio = footstepsAudioRef.current;
      audio.currentTime = 0;
      audio.volume = 0.3; // Simple fixed volume
      audio.play().catch((err) => {
        console.error("Error playing footsteps audio:", err);
      });
    }

    // End event after exact duration using a more reliable approach
    eventEndTimerRef.current = setTimeout(() => {
      console.log(
        `⏰ Event #${eventId} timeout fired after ${randomDuration}ms`,
      );

      // Use a more direct approach to end the event
      setCurrentEvent((prevEvent) => {
        if (prevEvent && prevEvent.id === eventId) {
          console.log(
            `✅ Event #${eventId} ended successfully`,
          );

          // Stop audio immediately
          if (footstepsAudioRef.current) {
            footstepsAudioRef.current.pause();
            footstepsAudioRef.current.volume = 0;
          }

          // Start cooldown
          setEventCooldown(true);
          cooldownTimerRef.current = setTimeout(() => {
            console.log("✅ Cooldown completed");
            setEventCooldown(false);
            scheduleNextEventWithDebugCheck();
          }, 1000);

          return null; // Clear the event
        } else {
          console.log(
            `⚠️ Event #${eventId} timeout fired but event has changed:`,
            prevEvent?.id,
          );
          return prevEvent; // Keep current event if it's different
        }
      });
    }, randomDuration);
  };

  // Event #2: Heavy Footsteps - Must close eyes for 3s straight to survive
  const triggerHeavyFootstepsEvent = () => {
    // Allow debug events to bypass intro and safe zone restrictions
    const isDebugOverride = debugEventRunning;
    
    if (
      currentEvent ||
      gameOver ||
      (eventCooldown && !isDebugOverride) ||
      (introActive && !isDebugOverride)
    ) {
      console.log("⚠️ Cannot start heavy footsteps event:", {
        currentEvent: !!currentEvent,
        gameOver,
        eventCooldown,
        introActive,
        debugOverride: isDebugOverride,
      });
      return;
    }

    // Random duration between 3-5 seconds
    const randomDuration = Math.random() * (5000 - 3000) + 3000; // 3000-5000ms
    const eventId = Date.now();

    const event: GameEvent = {
      id: eventId,
      type: "heavy-footsteps",
      isActive: true,
      startTime: Date.now(),
      duration: randomDuration,
    };

    setCurrentEvent(event);
    console.log(
      `👹 Heavy footsteps event #${eventId} started (${(randomDuration / 1000).toFixed(1)}s duration) - CLOSE EYES FOR 3S TO SURVIVE!`,
    );

    // Play heavy footsteps audio
    if (heavyFootstepsAudioRef.current) {
      const audio = heavyFootstepsAudioRef.current;
      audio.currentTime = 0;
      audio.volume = 0.4; // Slightly louder for heavy footsteps
      audio.play().catch((err) => {
        console.error(
          "Error playing heavy footsteps audio:",
          err,
        );
      });
    }

    // End event and check eye state when time runs out
    eventEndTimerRef.current = setTimeout(() => {
      console.log(
        `⏰ Heavy footsteps event #${eventId} timeout - checking eye state...`,
      );
      console.log(
        `👁️ Eye state check: eyesClosedRef = ${eyesClosedRef.current}`,
      );

      // Check if eyes are closed at the moment the event ends
      setCurrentEvent((prevEvent) => {
        if (prevEvent && prevEvent.id === eventId) {
          // Stop audio immediately
          if (heavyFootstepsAudioRef.current) {
            heavyFootstepsAudioRef.current.pause();
            heavyFootstepsAudioRef.current.volume = 0;
          }

          if (eyesClosedRef.current) {
            // SUCCESS - Eyes were closed when event ended
            console.log(
              `✅ Heavy footsteps event #${eventId} - SURVIVED! Eyes were closed when event ended.`,
            );

            // Start cooldown
            setEventCooldown(true);
            cooldownTimerRef.current = setTimeout(() => {
              console.log("✅ Cooldown completed");
              setEventCooldown(false);
              scheduleNextEvent();
            }, 1000);

            return null;
          } else {
            // FAILURE - Eyes were open when event ended
            console.log(
              `💀 Heavy footsteps event #${eventId} - GAME OVER! Eyes were open when event ended.`,
            );

            loseLife("heavy-footsteps-eyes-open");
            // Start cooldown
            setEventCooldown(true);
            cooldownTimerRef.current = setTimeout(() => {
              console.log("✅ Cooldown completed");
              setEventCooldown(false);
              scheduleNextEvent();
            }, 1000);
            return null;
          }
        }
        return prevEvent;
      });
    }, randomDuration);
  };

  // Event #4: Insanity Event - The most challenging event (9 seconds duration)
  const triggerInsanityEvent = () => {
    // Allow debug events to bypass intro and safe zone restrictions  
    const isDebugOverride = debugEventRunning;
    
    if (
      currentEvent ||
      gameOver ||
      (eventCooldown && !isDebugOverride) ||
      (introActive && !isDebugOverride)
    ) {
      console.log("⚠️ Cannot start insanity event:", {
        currentEvent: !!currentEvent,
        gameOver,
        eventCooldown,
        introActive,
        debugOverride: isDebugOverride,
      });
      return;
    }

    // Fixed 12 seconds duration
    const eventDuration = 12000; // 12 seconds
    const eventId = Date.now();

    console.log(
      `🧠 INSANITY EVENT WARNING! Event #${eventId} will start in 1 second...`,
    );

    // Play warning audio (suspiro.mp3)
    if (insanityWarningAudioRef.current) {
      const warningAudio = insanityWarningAudioRef.current;
      warningAudio.currentTime = 0;
      warningAudio.volume = 1.0; // Max volume to ensure it's heard
      console.log("🎵 Playing insanity warning audio (suspiro)...");
      warningAudio.play().catch((err) => {
        console.error(
          "Error playing insanity warning audio:",
          err,
        );
      });
    }

    // Set warning state (but no visual overlay)
    setInsanityWarning(true);

    insanityWarningTimerRef.current = setTimeout(() => {
      // Hide warning and start the actual event
      setInsanityWarning(false);
      setInsanityActive(true);

      const event: GameEvent = {
        id: eventId,
        type: "insanity",
        isActive: true,
        startTime: Date.now(),
        duration: eventDuration,
      };

      setCurrentEvent(event);
      console.log(
        `🧠 INSANITY EVENT #${eventId} STARTED! (12 seconds duration)`,
      );
      console.log(
        `🎯 SURVIVAL RULES: Stay CENTER, Keep EYES CLOSED for 12s, Stay QUIET (no yellow audio)!`,
      );

      // Play main insanity audio during the event
      if (insanityAudioRef.current) {
        const insanityAudio = insanityAudioRef.current;
        insanityAudio.currentTime = 0;
        insanityAudio.volume = 0.6; // Audible volume
        insanityAudio.loop = true; // Loop during the event
        console.log("🎵 Playing main insanity audio...");
        insanityAudio.play().catch((err) => {
          console.error("Error playing insanity audio:", err);
        });
      }

      // End event after 12 seconds
      eventEndTimerRef.current = setTimeout(() => {
        console.log(
          `⏰ Insanity event #${eventId} timeout - checking survival conditions...`,
        );

        setCurrentEvent((prevEvent) => {
          if (prevEvent && prevEvent.id === eventId) {
            // Check all survival conditions
            const survivalCheck = {
              eyesClosed: eyesClosedRef.current,
              facePosition: faceSide,
              audioLevel: audioLevel,
            };

            console.log(
              `🔍 Final survival check:`,
              survivalCheck,
            );

            // Check survival conditions
            if (!eyesClosedRef.current) {
              // FAILURE - Eyes were open
              console.log(
                `💀 INSANITY EVENT #${eventId} - FAILED! Eyes were open during insanity event. Starting death countdown!`,
              );
              setInsanityActive(false);
              
              // Stop insanity audio
              if (insanityAudioRef.current) {
                insanityAudioRef.current.pause();
                insanityAudioRef.current.loop = false;
                console.log("🎵 Stopped insanity audio (failure)");
              }

              // Start death jump scare countdown instead of immediate game over
              if (audioLevel >= 60) {
                // Audio is in red zone
                startMicrophoneDeathCountdown(); // Start microphone death mechanism
              } else {
                startEyeClosureDeathCountdown(); // Start eye closure death mechanism
              }
              return null;
            } else if (
              faceSide === "left" ||
              faceSide === "right"
            ) {
              // FAILURE - Moved away from center
              console.log(
                `💀 INSANITY EVENT #${eventId} - FAILED! Player moved away from center (${faceSide}). Starting death countdown!`,
              );
              setInsanityActive(false);
              
              // Stop insanity audio
              if (insanityAudioRef.current) {
                insanityAudioRef.current.pause();
                insanityAudioRef.current.loop = false;
                console.log("🎵 Stopped insanity audio (failure)");
              }

              // Start death jump scare countdown
              if (audioLevel >= 60) {
                // Audio is in red zone
                startMicrophoneDeathCountdown(); // Start microphone death mechanism
              } else {
                startEyeClosureDeathCountdown(); // Start eye closure death mechanism
              }
              return null;
            } else if (audioLevel >= 0.7) {
              // Yellow section threshold
              // FAILURE - Made too much noise
              console.log(
                `💀 INSANITY EVENT #${eventId} - FAILED! Player made too much noise (${(audioLevel * 100).toFixed(1)}%). Starting death countdown!`,
              );
              setInsanityActive(false);
              
              // Stop insanity audio
              if (insanityAudioRef.current) {
                insanityAudioRef.current.pause();
                insanityAudioRef.current.loop = false;
                console.log("🎵 Stopped insanity audio (failure)");
              }

              // Start microphone death countdown since noise was the issue
              startMicrophoneDeathCountdown();
              return null;
            } else {
              // SUCCESS - Survived the insanity event!
              console.log(
                `✅ INSANITY EVENT #${eventId} - SURVIVED! Player stayed center, quiet, and kept eyes closed for 12 seconds.`,
              );

              setInsanityActive(false);
              
              // Stop insanity audio
              if (insanityAudioRef.current) {
                insanityAudioRef.current.pause();
                insanityAudioRef.current.loop = false;
                console.log("🎵 Stopped insanity audio (success)");
              }

              // Start cooldown
              setEventCooldown(true);
              cooldownTimerRef.current = setTimeout(() => {
                console.log("✅ Cooldown completed");
                setEventCooldown(false);
                scheduleNextEventWithDebugCheck();
              }, 1000);

              return null;
            }
          }
          return prevEvent;
        });
      }, eventDuration);
    }, 1000); // 1 second warning delay
  };

  // Face Event Functions (can run simultaneously with other events)
  const triggerFaceEvent = () => {
    // Allow debug events to bypass intro and safe zone restrictions
    const isDebugOverride = debugEventRunning;
    
    if (gameOver || faceEvent || (introActive && !isDebugOverride)) {
      console.log("⚠️ Cannot start face event:", {
        gameOver,
        faceEvent: !!faceEvent,
        introActive,
        debugOverride: isDebugOverride,
      });
      return;
    }

    // Random duration between 5-10 seconds
    const randomDuration =
      Math.random() * (10000 - 5000) + 5000; // 5000-10000ms
    const eventId = Date.now();

    // Determine which side the face appears on based on player's looking direction
    let faceSideToShow: "left" | "right";
    if (faceSide === "left") {
      faceSideToShow = "right"; // Opposite side
    } else if (faceSide === "right") {
      faceSideToShow = "left"; // Opposite side
    } else {
      // Center or null - randomly choose left or right
      faceSideToShow = Math.random() < 0.5 ? "left" : "right";
    }

    // Generate random X position between left and right bounds
    const minX = 100; // Left boundary
    const maxX = window.innerWidth - 250; // Right boundary (accounting for face width)
    const randomX = Math.random() * (maxX - minX) + minX;

    const newFaceEvent: FaceEvent = {
      id: eventId,
      side: faceSideToShow,
      randomX: randomX,
      startTime: Date.now(),
      duration: randomDuration,
      lookingTime: 0,
      jumpScareTriggered: false,
    };

    setFaceEvent(newFaceEvent);
    console.log(
      `👻 Face event #${eventId} started on ${faceSideToShow} side at X:${randomX.toFixed(1)} (${(randomDuration / 1000).toFixed(1)}s duration)`,
    );

    // End event after duration
    faceEventTimerRef.current = setTimeout(() => {
      console.log(
        `👻 Face event #${eventId} ended naturally (no jump scare)`,
      );

      setFaceEvent((prevEvent) => {
        if (prevEvent && prevEvent.id === eventId) {
          // Schedule next face event
          scheduleFaceEventWithDebugCheck();
          return null;
        }
        return prevEvent;
      });
    }, randomDuration);
  };

  const triggerJumpScare = (eventId: number) => {
    console.log(
      `💀 JUMP SCARE TRIGGERED! Face event #${eventId}`,
    );

    // Stop the face event timer
    if (faceEventTimerRef.current) {
      clearTimeout(faceEventTimerRef.current);
      faceEventTimerRef.current = null;
    }

    // Clear the looking timer and tracking
    if (lookingTimerRef.current) {
      clearTimeout(lookingTimerRef.current);
      lookingTimerRef.current = null;
    }
    if (lookingUpdateIntervalRef.current) {
      clearInterval(lookingUpdateIntervalRef.current);
      lookingUpdateIntervalRef.current = null;
    }
    lookingStartTimeRef.current = null;
    setCurrentLookingTime(0);

    // Mark jump scare as triggered FIRST
    setFaceEvent((prevEvent) => {
      if (prevEvent && prevEvent.id === eventId) {
        console.log(
          `🎭 Jump scare state updated for event #${eventId}`,
        );
        return { ...prevEvent, jumpScareTriggered: true };
      }
      return prevEvent;
    });

    // Play jump scare sound
    if (jumpScareAudioRef.current) {
      const audio = jumpScareAudioRef.current;
      audio.currentTime = 0;
      audio.volume = 0.8; // Increased volume
      console.log(`🔊 Playing jump scare audio...`);
      audio.play().catch((err) => {
        console.error("Error playing jump scare audio:", err);
      });
    } else {
      console.error("⚠️ Jump scare audio ref is null!");
    }

    // Lose a life after jump scare effect plays
    setTimeout(() => {
      console.log(
        `💔 Horror face jump scare triggered - losing a life`,
      );
      loseLife("horror-face-jump-scare");
      setFaceEvent(null);
    }, 1500); // Longer delay to show the jump scare effect
  };

  const scheduleFaceEvent = () => {
    if (gameOver || introActive) {
      console.log("🚫 BLOCKING scheduleFaceEvent:", {
        gameOver,
        introActive,
      });
      return;
    }

    // Face events have frequency 10 and appear often - schedule between 3-8 seconds
    const minDelay = 3000;
    const maxDelay = 8000;
    const delay =
      Math.random() * (maxDelay - minDelay) + minDelay;

    console.log(
      `👻 Next face event scheduled in ${(delay / 1000).toFixed(1)}s`,
    );

    faceEventSchedulerRef.current = setTimeout(() => {
      if (!gameOver && !introActive) {
        const faceEventRoll = Math.random();

        // Frequency 10 = very high chance (90%)
        if (faceEventRoll < 0.9) {
          triggerFaceEvent();
        } else {
          // Reschedule if not triggered
          scheduleFaceEvent();
        }
      }
    }, delay);
  };

  const scheduleNextEvent = () => {
    if (
      gameOver ||
      eventCooldown ||
      introActive ||
      finalSafeZone
    ) {
      console.log("🚫 BLOCKING scheduleNextEvent:", {
        gameOver,
        eventCooldown,
        introActive,
        finalSafeZone,
      });
      return;
    }

    // Event #1 has frequency 7/10, so schedule next event between 5-15 seconds
    const minDelay = 5000;
    const maxDelay = 15000;
    const delay =
      Math.random() * (maxDelay - minDelay) + minDelay;

    console.log(
      `⏰ Next event scheduled in ${(delay / 1000).toFixed(1)}s`,
    );

    eventTimerRef.current = setTimeout(() => {
      if (
        gameOver ||
        eventCooldown ||
        currentEvent ||
        introActive
      ) {
        console.log("⚠️ Event trigger blocked:", {
          gameOver,
          eventCooldown,
          currentEvent: !!currentEvent,
          introActive,
        });
        // Retry scheduling if not game over and intro is complete
        if (!gameOver && !introActive) {
          scheduleNextEvent();
        }
        return;
      }

      // Event probability system:
      // Event #1 (footsteps): frequency 7/10 = 70%
      // Event #2 (heavy-footsteps): frequency 5/10 = 50%
      // Event #4 (insanity): frequency 1/10 = 10%
      // Total possible events: 13/10 = need to normalize

      const eventRoll = Math.random();

      // Normalize probabilities: 7 + 5 + 1 = 13 total
      // Footsteps: 7/13 = 0.538 (53.8%)
      // Heavy footsteps: 5/13 = 0.385 (38.5%)
      // Insanity: 1/13 = 0.077 (7.7%)

      console.log(`🎲 Event roll: ${eventRoll.toFixed(3)}`);

      if (eventRoll < 0.538) {
        // 53.8% chance for footsteps
        console.log("🦶 Triggering footsteps event (light)");
        triggerFootstepsEvent();
      } else if (eventRoll < 0.923) {
        // 38.5% chance for heavy footsteps (0.538 + 0.385 = 0.923)
        console.log(
          "👹 Triggering heavy footsteps event (must close eyes!)",
        );
        triggerHeavyFootstepsEvent();
      } else if (eventRoll < 1.0) {
        // 7.7% chance for insanity event (0.923 + 0.077 = 1.0)
        console.log(
          "🧠 Triggering INSANITY event (stay center, quiet, eyes closed!)",
        );
        triggerInsanityEvent();
      } else {
        // Should never reach here with current logic
        console.log("🔄 No event triggered, rescheduling...");
        scheduleNextEventWithDebugCheck();
      }
    }, delay);
  };

  // Debug System - Force trigger events
  const clearAllCurrentEvents = () => {
    console.log("🔧 DEBUG: Clearing all current events");

    // Clear current events
    setCurrentEvent(null);
    setFaceEvent(null);
    setInsanityWarning(false);
    setInsanityActive(false);
    setEventCooldown(false);
    setCurrentLookingTime(0);
    lookingStartTimeRef.current = null;

    // Clear all timers
    if (eventTimerRef.current) {
      clearTimeout(eventTimerRef.current);
      eventTimerRef.current = null;
    }
    if (eventEndTimerRef.current) {
      clearTimeout(eventEndTimerRef.current);
      eventEndTimerRef.current = null;
    }
    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }
    if (faceEventTimerRef.current) {
      clearTimeout(faceEventTimerRef.current);
      faceEventTimerRef.current = null;
    }
    if (faceEventSchedulerRef.current) {
      clearTimeout(faceEventSchedulerRef.current);
      faceEventSchedulerRef.current = null;
    }
    if (lookingTimerRef.current) {
      clearTimeout(lookingTimerRef.current);
      lookingTimerRef.current = null;
    }
    if (lookingUpdateIntervalRef.current) {
      clearInterval(lookingUpdateIntervalRef.current);
      lookingUpdateIntervalRef.current = null;
    }
    if (insanityWarningTimerRef.current) {
      clearTimeout(insanityWarningTimerRef.current);
      insanityWarningTimerRef.current = null;
    }
    if (insanityVolumeIntervalRef.current) {
      clearTimeout(insanityVolumeIntervalRef.current);
      insanityVolumeIntervalRef.current = null;
    }

    // Stop all audio
    if (footstepsAudioRef.current) {
      footstepsAudioRef.current.pause();
      footstepsAudioRef.current.volume = 0;
    }
    if (heavyFootstepsAudioRef.current) {
      heavyFootstepsAudioRef.current.pause();
      heavyFootstepsAudioRef.current.volume = 0;
    }
    if (jumpScareAudioRef.current) {
      jumpScareAudioRef.current.pause();
      jumpScareAudioRef.current.volume = 0;
    }
    if (insanityAudioRef.current) {
      insanityAudioRef.current.pause();
      insanityAudioRef.current.volume = 0;
    }
  };

  const forceDebugEvent = () => {
    if (gameOver) {
      console.log(
        "🔧 DEBUG: Cannot force event during game over",
      );
      return;
    }

    console.log(
      `🔧 DEBUG: Force triggering ${selectedDebugEvent} event`,
    );

    // Clear all current events first
    clearAllCurrentEvents();

    // Set debug mode
    setDebugEventRunning(true);

    // Trigger the selected event
    switch (selectedDebugEvent) {
      case "footsteps":
        triggerFootstepsEvent();
        break;
      case "heavy-footsteps":
        triggerHeavyFootstepsEvent();
        break;
      case "face-event":
        triggerFaceEvent();
        break;
      case "insanity":
        triggerInsanityEvent();
        break;
    }
  };

  // Override the scheduleNextEvent to handle debug mode and intro
  const scheduleNextEventWithDebugCheck = () => {
    // Don't schedule events during intro
    if (introActive) {
      console.log(
        "🚫 INTRO BLOCK: scheduleNextEventWithDebugCheck called during intro period - BLOCKING",
      );
      return;
    }

    if (debugEventRunning) {
      console.log(
        "🔧 DEBUG: Debug event finished, resuming normal scheduling",
      );
      setDebugEventRunning(false);

      // Resume normal event scheduling after debug event
      setTimeout(() => {
        if (
          !gameOver &&
          !eventCooldown &&
          !currentEvent &&
          !introActive
        ) {
          scheduleNextEvent();
        }
      }, 2000); // 2 second delay before resuming
    } else {
      // Normal scheduling
      scheduleNextEvent();
    }
  };

  // Override the scheduleFaceEvent to handle debug mode and intro
  const scheduleFaceEventWithDebugCheck = () => {
    // Don't schedule events during intro
    if (introActive) {
      console.log(
        "🚫 INTRO BLOCK: scheduleFaceEventWithDebugCheck called during intro period - BLOCKING",
      );
      return;
    }

    if (debugEventRunning) {
      console.log(
        "🔧 DEBUG: Debug face event finished, resuming normal scheduling",
      );
      setDebugEventRunning(false);

      // Resume normal face event scheduling after debug event
      setTimeout(() => {
        if (!gameOver && !faceEvent && !introActive) {
          scheduleFaceEvent();
        }
      }, 2000); // 2 second delay before resuming
    } else {
      // Normal scheduling
      scheduleFaceEvent();
    }
  };

  // Note: Keyboard handling now done by the clean keyboard event handler above

  // Optimized mouse position tracking with requestAnimationFrame for smooth movement
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const animationFrameIdRef = useRef<number | null>(null);

  const handleMouseMove = (event: MouseEvent) => {
    // Store the latest mouse position
    mousePositionRef.current = {
      x: event.clientX,
      y: event.clientY,
    };

    // Use requestAnimationFrame to throttle updates for smooth performance
    if (animationFrameIdRef.current === null) {
      animationFrameIdRef.current = requestAnimationFrame(
        () => {
          setCursorPosition(mousePositionRef.current);
          animationFrameIdRef.current = null;
        },
      );
    }
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove, {
      passive: true,
    });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, []);

  // Keep eyesClosedRef in sync with eyesClosed state
  useEffect(() => {
    eyesClosedRef.current = eyesClosed;
  }, [eyesClosed]);

  // Manage looking timer based on collision detection
  useEffect(() => {
    if (!faceEvent || faceEvent.jumpScareTriggered) return;

    if (collisionDetected && !lookingTimerRef.current) {
      // Start looking timer
      console.log(
        "👁️ Face detection pointer started looking at the horror face...",
      );

      // Start tracking looking time
      lookingStartTimeRef.current = Date.now();
      setCurrentLookingTime(0);

      // Update looking time every 50ms for smooth display
      lookingUpdateIntervalRef.current = setInterval(() => {
        if (lookingStartTimeRef.current) {
          const elapsed =
            (Date.now() - lookingStartTimeRef.current) / 1000;
          setCurrentLookingTime(elapsed);
        }
      }, 50);

      lookingTimerRef.current = setTimeout(() => {
        console.log(
          "👁️ Face looked at horror face for 1.2 seconds - triggering jump scare!",
        );
        triggerJumpScare(faceEvent.id);
      }, 1200); // 1.2 seconds before jump scare
    } else if (!collisionDetected && lookingTimerRef.current) {
      // Stop looking timer if face pointer moves away
      console.log(
        "👁️ Face detection pointer stopped looking at the horror face",
      );
      clearTimeout(lookingTimerRef.current);
      lookingTimerRef.current = null;

      // Stop tracking looking time
      if (lookingUpdateIntervalRef.current) {
        clearInterval(lookingUpdateIntervalRef.current);
        lookingUpdateIntervalRef.current = null;
      }
      lookingStartTimeRef.current = null;
      setCurrentLookingTime(0);
    }

    return () => {
      if (lookingTimerRef.current) {
        clearTimeout(lookingTimerRef.current);
        lookingTimerRef.current = null;
      }
      if (lookingUpdateIntervalRef.current) {
        clearInterval(lookingUpdateIntervalRef.current);
        lookingUpdateIntervalRef.current = null;
      }
      lookingStartTimeRef.current = null;
      setCurrentLookingTime(0);
    };
  }, [collisionDetected, faceEvent]);

  // Insanity event survival monitoring - continuous checking during active event
  useEffect(() => {
    if (
      !currentEvent ||
      currentEvent.type !== "insanity" ||
      !insanityActive
    )
      return;

    const checkInsanitySurvival = () => {
      // Check if eyes opened during insanity event
      if (!eyesClosedRef.current) {
        console.log(
          "💀 INSANITY EVENT - EYES OPENED! Starting death countdown!",
        );
        setInsanityActive(false);
        setCurrentEvent(null); // Stop the insanity event
        
        // Stop insanity audio
        if (insanityAudioRef.current) {
          insanityAudioRef.current.pause();
          insanityAudioRef.current.loop = false;
          console.log("🎵 Stopped insanity audio (eyes opened)");
        }
        
        startLivesDeathCountdown(); // Start the death jump scare countdown
        return;
      }

      // Check if moved away from center
      if (faceSide === "left" || faceSide === "right") {
        console.log(
          `💀 INSANITY EVENT - MOVED TO ${faceSide}! Starting death countdown!`,
        );
        setInsanityActive(false);
        setCurrentEvent(null); // Stop the insanity event
        
        // Stop insanity audio
        if (insanityAudioRef.current) {
          insanityAudioRef.current.pause();
          insanityAudioRef.current.loop = false;
          console.log("🎵 Stopped insanity audio (moved away)");
        }
        
        startLivesDeathCountdown(); // Start the death jump scare countdown
        return;
      }

      // Check if made too much noise (yellow section = 70%+)
      if (audioLevel >= 0.7) {
        console.log(
          `💀 INSANITY EVENT - TOO LOUD (${(audioLevel * 100).toFixed(1)}%)! Starting death countdown!`,
        );
        setInsanityActive(false);
        setCurrentEvent(null); // Stop the insanity event
        
        // Stop insanity audio
        if (insanityAudioRef.current) {
          insanityAudioRef.current.pause();
          insanityAudioRef.current.loop = false;
          console.log("🎵 Stopped insanity audio (too loud)");
        }
        
        startLivesDeathCountdown(); // Start the death jump scare countdown
        return;
      }
    };

    // Check survival conditions every 100ms during insanity event
    const survivalInterval = setInterval(
      checkInsanitySurvival,
      100,
    );

    return () => {
      clearInterval(survivalInterval);
    };
  }, [
    currentEvent,
    insanityActive,
    eyesClosed,
    faceSide,
    audioLevel,
  ]);

  // Microphone death mechanism - monitor red area (>=60 audioLevel)
  useEffect(() => {
    if (gameOver || whiteScreenJumpScare || introActive) return;

    // Red area threshold - same as the audio bars (>=60)
    const redAreaThreshold = 60;
    const isInRedArea = audioLevel >= redAreaThreshold;

    if (isInRedArea && !redAreaReached) {
      // First time hitting red area
      console.log(
        `🔴 RED AREA REACHED! Audio level: ${audioLevel.toFixed(1)}% - Starting death countdown...`,
      );
      setRedAreaReached(true);
      startDeathCountdown();
    } else if (
      isInRedArea &&
      redAreaReached &&
      deathCountdown !== null
    ) {
      // Hit red area again while countdown is active - reset countdown
      console.log(
        `🔴 RED AREA HIT AGAIN! Audio level: ${audioLevel.toFixed(1)}% - Resetting death countdown...`,
      );
      startDeathCountdown();
    }
  }, [
    audioLevel,
    gameOver,
    whiteScreenJumpScare,
    redAreaReached,
    deathCountdown,
    introActive,
  ]);

  // Start or restart death countdown with random duration
  const startDeathCountdown = () => {
    // Clear existing countdown
    if (deathCountdownTimerRef.current) {
      clearTimeout(deathCountdownTimerRef.current);
      deathCountdownTimerRef.current = null;
    }
    if (deathCountdownUpdateRef.current) {
      clearInterval(deathCountdownUpdateRef.current);
      deathCountdownUpdateRef.current = null;
    }

    // Random countdown between 1-3 seconds
    const randomCountdown = Math.random() * (3 - 1) + 1; // 1.0 to 3.0 seconds
    let remainingTime = randomCountdown;

    console.log(
      `⏱️ Death countdown started: ${randomCountdown.toFixed(1)}s`,
    );
    setDeathCountdown(remainingTime);

    // Update countdown display every 100ms
    deathCountdownUpdateRef.current = setInterval(() => {
      remainingTime -= 0.1;
      setDeathCountdown(Math.max(0, remainingTime));

      if (remainingTime <= 0) {
        if (deathCountdownUpdateRef.current) {
          clearInterval(deathCountdownUpdateRef.current);
          deathCountdownUpdateRef.current = null;
        }
      }
    }, 100);

    // Trigger white screen jump scare when countdown reaches 0
    deathCountdownTimerRef.current = setTimeout(() => {
      console.log(
        `💀 DEATH COUNTDOWN REACHED ZERO! Triggering white screen jump scare...`,
      );
      triggerWhiteScreenJumpScare();
    }, randomCountdown * 1000);
  };

  // Start eye closure death countdown with random duration (1-3 seconds)
  const startEyeClosureDeathCountdown = () => {
    // Clear existing countdown
    if (eyeClosureDeathTimerRef.current) {
      clearTimeout(eyeClosureDeathTimerRef.current);
      eyeClosureDeathTimerRef.current = null;
    }
    if (eyeClosureDeathUpdateRef.current) {
      clearInterval(eyeClosureDeathUpdateRef.current);
      eyeClosureDeathUpdateRef.current = null;
    }

    // Random countdown between 1-3 seconds
    const randomCountdown = Math.random() * (3 - 1) + 1; // 1.0 to 3.0 seconds
    let remainingTime = randomCountdown;

    console.log(
      `👁️💀 Eye closure death countdown started: ${randomCountdown.toFixed(1)}s`,
    );
    setEyeClosureDeathCountdown(remainingTime);

    // Update countdown display every 100ms
    eyeClosureDeathUpdateRef.current = setInterval(() => {
      remainingTime -= 0.1;
      setEyeClosureDeathCountdown(Math.max(0, remainingTime));

      if (remainingTime <= 0) {
        if (eyeClosureDeathUpdateRef.current) {
          clearInterval(eyeClosureDeathUpdateRef.current);
          eyeClosureDeathUpdateRef.current = null;
        }
      }
    }, 100);

    // Trigger white screen jump scare when countdown reaches 0
    eyeClosureDeathTimerRef.current = setTimeout(() => {
      console.log(
        `💀 EYE CLOSURE DEATH COUNTDOWN REACHED ZERO! Triggering white screen jump scare...`,
      );
      triggerWhiteScreenJumpScare("eye-closure-death");
    }, randomCountdown * 1000);
  };

  // Start lives death countdown with random duration (1-3 seconds)
  const startLivesDeathCountdown = () => {
    // Clear existing countdown
    if (livesCountdownTimerRef.current) {
      clearTimeout(livesCountdownTimerRef.current);
      livesCountdownTimerRef.current = null;
    }
    if (livesCountdownUpdateRef.current) {
      clearInterval(livesCountdownUpdateRef.current);
      livesCountdownUpdateRef.current = null;
    }

    // Random countdown between 1-3 seconds
    const randomCountdown = Math.random() * (3 - 1) + 1; // 1.0 to 3.0 seconds
    let remainingTime = randomCountdown;

    console.log(
      `💀❤️ Lives death countdown started: ${randomCountdown.toFixed(1)}s`,
    );
    setLivesCountdown(remainingTime);

    // Update countdown display every 100ms
    livesCountdownUpdateRef.current = setInterval(() => {
      remainingTime -= 0.1;
      setLivesCountdown(Math.max(0, remainingTime));

      if (remainingTime <= 0) {
        if (livesCountdownUpdateRef.current) {
          clearInterval(livesCountdownUpdateRef.current);
          livesCountdownUpdateRef.current = null;
        }
      }
    }, 100);

    // Trigger white screen jump scare when countdown reaches 0
    livesCountdownTimerRef.current = setTimeout(() => {
      console.log(
        `💀 LIVES DEATH COUNTDOWN REACHED ZERO! Triggering white screen jump scare...`,
      );
      triggerWhiteScreenJumpScare("lives-death");
    }, randomCountdown * 1000);
  };

  // Lose a life and check if player should die
  const loseLife = (reason: string) => {
    const newLostLives = lostLives + 1;
    console.log(
      `💔 LIFE LOST! Reason: ${reason}. Lives lost: ${lostLives} → ${newLostLives}/3`,
    );

    setLostLives(newLostLives);

    if (newLostLives >= 3) {
      console.log(
        `💀 ALL LIVES LOST! Starting death countdown...`,
      );
      startLivesDeathCountdown();
    }
  };

  // Trigger video jump scare
  const triggerWhiteScreenJumpScare = (
    reason: string = "microphone-death",
  ) => {
    console.log(
      `💀 VIDEO JUMP SCARE TRIGGERED! Reason: ${reason}`,
    );

    // Clear any remaining timers
    if (deathCountdownTimerRef.current) {
      clearTimeout(deathCountdownTimerRef.current);
      deathCountdownTimerRef.current = null;
    }
    if (deathCountdownUpdateRef.current) {
      clearInterval(deathCountdownUpdateRef.current);
      deathCountdownUpdateRef.current = null;
    }

    setDeathCountdown(null);

    // Randomly select between scream-1 and scream-2 videos (50% chance each)
    const screamVideos = [
      "https://storage.googleapis.com/the-last-cabin-storage/videos/scream-1.mp4",
      "https://storage.googleapis.com/the-last-cabin-storage/videos/scream-2.mp4",
    ];

    const randomIndex = Math.floor(Math.random() * 2); // 0 or 1
    const selectedVideo = screamVideos[randomIndex];

    console.log(
      `🎬 Selected jump scare video: scream-${randomIndex + 1}.mp4`,
    );
    setJumpScareVideoSrc(selectedVideo);
    setWhiteScreenJumpScare(true);

    // Start the video playback
    setTimeout(() => {
      if (jumpScareVideoRef.current) {
        const video = jumpScareVideoRef.current;
        video.currentTime = 0;
        video.volume = 0.8;
        console.log(`🎬 Playing jump scare video...`);
        video.play().catch((err) => {
          console.error("Error playing jump scare video:", err);
        });
      }
    }, 100);

    // End jump scare and redirect to lose screen after video duration (estimate 3-5 seconds)
    setTimeout(() => {
      console.log(
        `💀 Video jump scare ended - redirecting to lose screen. Reason: ${reason}`,
      );
      onNavigateToLose();
    }, 4000); // 4 seconds should be enough for most scream videos
  };

  // Eye closure death mechanism - gradual countdown system
  useEffect(() => {
    if (gameOver || whiteScreenJumpScare || introActive) return;

    // Check if insanity event is active - if so, don't increase countdown for eye closure
    const isInsanityEventActive =
      currentEvent?.type === "insanity" && insanityActive;

    // Check if footsteps event is active - if so, don't use general eye closure death (footsteps has its own lives system)
    const isFootstepsEventActive =
      currentEvent?.type === "footsteps";

    // Skip general eye closure death during footsteps events
    if (isFootstepsEventActive) {
      return;
    }

    // Clear any existing interval first
    if (eyeClosureIntervalRef.current) {
      clearInterval(eyeClosureIntervalRef.current);
      eyeClosureIntervalRef.current = null;
    }

    if (eyesClosed && !isInsanityEventActive) {
      // Eyes are closed and not during insanity - increase countdown
      console.log(
        `👁️ Eyes closed - starting eye closure countdown INCREASE...`,
      );
      setIsEyeClosureCountdownActive(true);

      // Start interval to increase countdown by 0.1 seconds every 100ms (1 sec per 10 intervals)
      eyeClosureIntervalRef.current = setInterval(() => {
        setEyeClosureCountdown((prev) => {
          const newCountdown = Math.min(10, prev + 0.1); // Cap at 10 seconds
          console.log(
            `👁️ Eye closure countdown INCREASING: ${newCountdown.toFixed(1)}s`,
          );

          if (newCountdown >= 10) {
            console.log(
              `💀 EYE CLOSURE COUNTDOWN REACHED 10 SECONDS! Starting random death countdown...`,
            );

            // Clear interval
            if (eyeClosureIntervalRef.current) {
              clearInterval(eyeClosureIntervalRef.current);
              eyeClosureIntervalRef.current = null;
            }

            // Start the random 1-3 second death countdown
            startEyeClosureDeathCountdown();

            return 10;
          }

          return newCountdown;
        });
      }, 100); // Update every 100ms
    } else if (eyeClosureCountdown > 0) {
      // Eyes are open OR insanity event is active - decrease countdown
      console.log(
        `👁️ Eyes opened${isInsanityEventActive ? " (or insanity active)" : ""} - starting eye closure countdown DECREASE...`,
      );
      setIsEyeClosureCountdownActive(false);

      // Clear any active death countdown if eyes are opened
      if (eyeClosureDeathCountdown !== null) {
        console.log(
          `👁️ Eyes opened - cancelling active death countdown!`,
        );
        if (eyeClosureDeathTimerRef.current) {
          clearTimeout(eyeClosureDeathTimerRef.current);
          eyeClosureDeathTimerRef.current = null;
        }
        if (eyeClosureDeathUpdateRef.current) {
          clearInterval(eyeClosureDeathUpdateRef.current);
          eyeClosureDeathUpdateRef.current = null;
        }
        setEyeClosureDeathCountdown(null);
      }

      // Start interval to decrease countdown by 0.05 seconds every 100ms (slower decrease)
      eyeClosureIntervalRef.current = setInterval(() => {
        setEyeClosureCountdown((prev) => {
          const newCountdown = Math.max(0, prev - 0.05); // Decrease slower than increase
          console.log(
            `👁️ Eye closure countdown DECREASING: ${newCountdown.toFixed(1)}s`,
          );

          if (newCountdown <= 0) {
            // Clear interval when countdown reaches 0
            if (eyeClosureIntervalRef.current) {
              clearInterval(eyeClosureIntervalRef.current);
              eyeClosureIntervalRef.current = null;
            }
            console.log(
              `👁️ Eye closure countdown reached 0 - SAFE!`,
            );
            return 0;
          }

          return newCountdown;
        });
      }, 100); // Update every 100ms
    } else {
      // Countdown is already 0 and eyes are open - idle state
      setIsEyeClosureCountdownActive(false);
    }

    // Cleanup function
    return () => {
      if (eyeClosureIntervalRef.current) {
        clearInterval(eyeClosureIntervalRef.current);
        eyeClosureIntervalRef.current = null;
      }
    };
  }, [eyesClosed, currentEvent, insanityActive, introActive]);

  // Lives system - Footsteps event eye closure tracking
  useEffect(() => {
    if (gameOver || whiteScreenJumpScare) return;

    // Only track during footsteps event
    if (currentEvent?.type === "footsteps") {
      if (eyesClosed) {
        // Eyes closed during footsteps - start tracking time
        if (!footstepsEyeClosureTimerRef.current) {
          console.log(
            `👣👁️ Eyes closed during footsteps event - starting timer...`,
          );
          setFootstepsEyesClosedTime(0);

          footstepsEyeClosureTimerRef.current = setInterval(
            () => {
              setFootstepsEyesClosedTime((prev) => {
                const newTime = prev + 0.1;

                if (newTime >= 1.0) {
                  // Eyes closed for 1 second - lose a life
                  console.log(
                    `💔 Eyes closed for 1+ seconds during footsteps event - losing life!`,
                  );
                  loseLife("footsteps-eyes-closed");

                  // Clear timer to prevent multiple life losses
                  if (footstepsEyeClosureTimerRef.current) {
                    clearInterval(
                      footstepsEyeClosureTimerRef.current,
                    );
                    footstepsEyeClosureTimerRef.current = null;
                  }
                  return 1.0;
                }

                return newTime;
              });
            },
            100,
          );
        }
      } else {
        // Eyes opened - clear timer and reset
        if (footstepsEyeClosureTimerRef.current) {
          clearInterval(footstepsEyeClosureTimerRef.current);
          footstepsEyeClosureTimerRef.current = null;
        }
        setFootstepsEyesClosedTime(0);
      }
    } else {
      // Not in footsteps event - clear timer and reset
      if (footstepsEyeClosureTimerRef.current) {
        clearInterval(footstepsEyeClosureTimerRef.current);
        footstepsEyeClosureTimerRef.current = null;
      }
      setFootstepsEyesClosedTime(0);
    }

    // Cleanup
    return () => {
      if (footstepsEyeClosureTimerRef.current) {
        clearInterval(footstepsEyeClosureTimerRef.current);
        footstepsEyeClosureTimerRef.current = null;
      }
    };
  }, [
    eyesClosed,
    currentEvent,
    gameOver,
    whiteScreenJumpScare,
  ]);

  // Start game events after component mount
  useEffect(() => {
    // Start first event after a short delay
    console.log(
      "🎮 Game starting, initial event scheduled in 3s",
    );
    const initialDelay = setTimeout(() => {
      console.log(
        "🎮 Initial delay completed, scheduling first event",
      );
      scheduleNextEvent();
    }, 3000); // 3 seconds after game starts

    // Start face event scheduling separately (can run simultaneously)
    const faceEventDelay = setTimeout(() => {
      console.log("👻 Face event scheduling started");
      scheduleFaceEvent();
    }, 5000); // 5 seconds after game starts

    return () => {
      console.log("🎮 Game component unmounting");
      clearTimeout(initialDelay);
      clearTimeout(faceEventDelay);
    };
  }, []);

  // Initialize camera and face detection on component mount
  useEffect(() => {
    initCamera();

    let mouseTrackingCleanup: (() => void) | null = null;

    return () => {
      // Clean up mouse tracking if it was initialized
      if (mouseTrackingCleanup) {
        mouseTrackingCleanup();
      }
      if (cameraStreamRef.current) {
        cameraStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }
      if (faceDetectionFrameRef.current) {
        cancelAnimationFrame(faceDetectionFrameRef.current);
      }
      // Clear all timers
      if (eventTimerRef.current) {
        clearTimeout(eventTimerRef.current);
      }
      if (spacebarTimerRef.current) {
        clearTimeout(spacebarTimerRef.current);
      }
      if (eventEndTimerRef.current) {
        clearTimeout(eventEndTimerRef.current);
      }
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
      if (faceEventTimerRef.current) {
        clearTimeout(faceEventTimerRef.current);
      }
      if (faceEventSchedulerRef.current) {
        clearTimeout(faceEventSchedulerRef.current);
      }
      if (lookingTimerRef.current) {
        clearTimeout(lookingTimerRef.current);
      }
      if (insanityWarningTimerRef.current) {
        clearTimeout(insanityWarningTimerRef.current);
      }
      if (insanityVolumeIntervalRef.current) {
        clearTimeout(insanityVolumeIntervalRef.current);
      }
      if (eyeClosureIntervalRef.current) {
        clearInterval(eyeClosureIntervalRef.current);
      }
      if (eyeClosureDeathTimerRef.current) {
        clearTimeout(eyeClosureDeathTimerRef.current);
      }
      if (eyeClosureDeathUpdateRef.current) {
        clearInterval(eyeClosureDeathUpdateRef.current);
      }

      // Stop any playing audio
      if (footstepsAudioRef.current) {
        footstepsAudioRef.current.pause();
        footstepsAudioRef.current.volume = 0;
      }
      if (heavyFootstepsAudioRef.current) {
        heavyFootstepsAudioRef.current.pause();
        heavyFootstepsAudioRef.current.volume = 0;
      }
      if (jumpScareAudioRef.current) {
        jumpScareAudioRef.current.pause();
        jumpScareAudioRef.current.volume = 0;
      }
      if (insanityAudioRef.current) {
        insanityAudioRef.current.pause();
        insanityAudioRef.current.volume = 0;
      }
    };
  }, []);

  // Track horror face coordinates for collision detection
  useEffect(() => {
    if (faceEvent) {
      const faceSize = faceEvent.jumpScareTriggered ? 300 : 150;
      const faceX = faceEvent.randomX; // Use random X position
      const faceY =
        window.innerHeight / 2 -
        (faceEvent.jumpScareTriggered ? 150 : 75);

      // Calculate center coordinates of the horror face
      const centerX = faceX + faceSize / 2;
      const centerY = faceY + faceSize / 2;

      setHorrorFaceCoords({ x: centerX, y: centerY });

      console.log(
        `👻 Horror face coords updated: (${centerX.toFixed(1)}, ${centerY.toFixed(1)}) - Size: ${faceSize}px - Random X: ${faceEvent.randomX.toFixed(1)}`,
      );
    } else {
      setHorrorFaceCoords(null);
    }
  }, [faceEvent]);

  // Track pointer coordinates for collision detection
  useEffect(() => {
    // Priority: Camera face detection > Mouse fallback
    if (
      useCameraFaceDetection &&
      cameraStarted &&
      faceData?.faceCenter
    ) {
      // Use camera face detection data
      console.log(
        "🎥 Collision system using camera coordinates:",
        faceData.faceCenter,
      );
      setPointerCoords({
        x: faceData.faceCenter.x,
        y: faceData.faceCenter.y,
      });
    } else if (
      (!useCameraFaceDetection ||
        (cameraPermission === "denied" && !cameraStarted)) &&
      (isMouseTracking ||
        cursorPosition.x !== 0 ||
        cursorPosition.y !== 0)
    ) {
      // Use mouse position as fallback
      console.log(
        "🖱️ Collision system using mouse coordinates:",
        cursorPosition,
      );
      setPointerCoords({
        x: cursorPosition.x,
        y: cursorPosition.y,
      });
    } else {
      setPointerCoords(null);
    }
  }, [
    faceData?.faceCenter,
    cursorPosition,
    useCameraFaceDetection,
    cameraStarted,
    cameraPermission,
    isMouseTracking,
  ]);

  // Continuous collision detection scanner
  useEffect(() => {
    if (
      !horrorFaceCoords ||
      !pointerCoords ||
      !faceEvent ||
      faceEvent.jumpScareTriggered
    ) {
      setCollisionDetected(false);
      return;
    }

    // Calculate distance between pointer and horror face center
    const distance = Math.sqrt(
      Math.pow(pointerCoords.x - horrorFaceCoords.x, 2) +
        Math.pow(pointerCoords.y - horrorFaceCoords.y, 2),
    );

    // Collision threshold - when they are "almost the same" (within 75px)
    const collisionThreshold = 75;
    const isColliding = distance <= collisionThreshold;

    console.log(`🎯 COLLISION SCAN:
      Pointer: (${pointerCoords.x.toFixed(1)}, ${pointerCoords.y.toFixed(1)})
      Horror Face: (${horrorFaceCoords.x.toFixed(1)}, ${horrorFaceCoords.y.toFixed(1)})
      Distance: ${distance.toFixed(1)}px
      Threshold: ${collisionThreshold}px
      Collision: ${isColliding}`);

    setCollisionDetected(isColliding);

    // Note: Jump scare is now handled by the timer-based mechanism below
    // which waits for 1.2 seconds of continuous looking before triggering
  }, [horrorFaceCoords, pointerCoords, faceEvent]);

  // Start face detection when models are loaded and video is ready
  useEffect(() => {
    if (
      modelsLoaded &&
      videoRef.current &&
      canvasRef.current &&
      !faceDetectionFrameRef.current &&
      cameraStarted
    ) {
      const video = videoRef.current;

      // Only start if video has valid dimensions and is playing
      if (
        video.videoWidth > 0 &&
        video.videoHeight > 0 &&
        !video.paused
      ) {
        console.log(
          "Models loaded, starting face detection loop with video:",
          video.videoWidth,
          "x",
          video.videoHeight,
        );
        startFaceDetection();
      } else {
        console.log(
          "Video not ready for detection yet, waiting...",
          {
            width: video.videoWidth,
            height: video.videoHeight,
            paused: video.paused,
            readyState: video.readyState,
          },
        );
      }
    }
  }, [modelsLoaded, cameraStarted]);

  // Set camera stream to video element
  useEffect(() => {
    if (
      cameraStreamRef.current &&
      videoRef.current &&
      cameraStarted
    ) {
      videoRef.current.srcObject = cameraStreamRef.current;
      videoRef.current.play().catch((err) => {
        console.error("Error playing camera video:", err);
        setCameraError("Failed to start camera video.");
      });
    }
  }, [cameraStreamRef.current, cameraStarted]);

  // Initialize microphone and audio analysis
  useEffect(() => {
    const initAudio = async () => {
      // Skip audio initialization if microphone detection is disabled
      if (!useMicrophoneDetection) {
        console.log(
          "🎤 Microphone detection disabled - skipping audio init",
        );
        setMicPermission("granted"); // Set to granted to avoid showing errors
        setAudioLevel(0);
        return;
      }

      try {
        // Request microphone permission with specific device ID if selected
        const audioConstraints: MediaTrackConstraints = {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        };

        // Add device ID constraint if a specific microphone is selected
        if (selectedMicrophoneId) {
          audioConstraints.deviceId = {
            exact: selectedMicrophoneId,
          };
        }

        const stream =
          await navigator.mediaDevices.getUserMedia({
            audio: audioConstraints,
          });

        streamRef.current = stream;
        setMicPermission("granted");

        // Create audio context and analyser
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        analyserRef.current =
          audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 1024;
        analyserRef.current.smoothingTimeConstant = 0.8;

        // Connect microphone to analyser
        microphoneRef.current =
          audioContextRef.current.createMediaStreamSource(
            stream,
          );
        microphoneRef.current.connect(analyserRef.current);

        // Create data array for frequency data
        dataArrayRef.current = new Uint8Array(
          analyserRef.current.frequencyBinCount,
        );

        // Start audio analysis loop
        const updateAudioLevel = () => {
          if (analyserRef.current && dataArrayRef.current) {
            analyserRef.current.getByteFrequencyData(
              dataArrayRef.current,
            );

            // Calculate RMS (Root Mean Square) for volume level
            let sum = 0;
            for (
              let i = 0;
              i < dataArrayRef.current.length;
              i++
            ) {
              sum +=
                dataArrayRef.current[i] *
                dataArrayRef.current[i];
            }
            const rms = Math.sqrt(
              sum / dataArrayRef.current.length,
            );

            // Convert to percentage (0-100) with some amplification
            const volume = Math.min(100, (rms / 128) * 100 * 2); // Amplify by 2x for better sensitivity
            setAudioLevel(volume);
          }

          animationFrameRef.current =
            requestAnimationFrame(updateAudioLevel);
        };

        updateAudioLevel();
      } catch (error) {
        console.error("🎤 Error accessing microphone:", error);
        console.log(
          "🎤 Microphone unavailable - audio detection disabled",
        );
        setMicPermission("granted"); // Don't show as error, just disabled
        setAudioLevel(0); // Keep audio level at 0
      }
    };

    initAudio();

    // Cleanup function
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      // Clean up microphone death mechanism timers
      if (deathCountdownTimerRef.current) {
        clearTimeout(deathCountdownTimerRef.current);
      }
      if (deathCountdownUpdateRef.current) {
        clearInterval(deathCountdownUpdateRef.current);
      }
      // Clean up lives system timers
      if (livesCountdownTimerRef.current) {
        clearTimeout(livesCountdownTimerRef.current);
      }
      if (livesCountdownUpdateRef.current) {
        clearInterval(livesCountdownUpdateRef.current);
      }
      if (footstepsEyeClosureTimerRef.current) {
        clearInterval(footstepsEyeClosureTimerRef.current);
      }
      // Clean up intro countdown timer
      if (introCountdownTimerRef.current) {
        clearTimeout(introCountdownTimerRef.current);
      }
    };
  }, []);

  // Mouse tracking for fallback mode - only when camera is definitively not available
  useEffect(() => {
    // Only setup mouse tracking when:
    // 1. Camera face detection is disabled in settings, OR
    // 2. Camera permission was explicitly denied AND camera is not started
    const shouldUseMouseFallback =
      !useCameraFaceDetection ||
      (cameraPermission === "denied" && !cameraStarted);

    if (shouldUseMouseFallback) {
      console.log(
        "🖱️ Setting up mouse tracking for fallback mode...",
      );
      console.log("🖱️ Reason:", {
        cameraDisabledInSettings: !useCameraFaceDetection,
        cameraPermissionDenied: cameraPermission === "denied",
        cameraNotStarted: !cameraStarted,
      });

      const handleMouseMove = (event: MouseEvent) => {
        const mouseCoords = {
          x: event.clientX,
          y: event.clientY,
        };
        setCursorPosition(mouseCoords);
        setMousePosition(mouseCoords);
      };

      // Add event listener for mouse movement
      document.addEventListener("mousemove", handleMouseMove);

      return () => {
        document.removeEventListener(
          "mousemove",
          handleMouseMove,
        );
        console.log("🖱️ Mouse tracking cleanup");
      };
    } else {
      console.log(
        "🎥 Camera mode active - mouse tracking disabled",
      );
    }
  }, [useCameraFaceDetection, cameraPermission, cameraStarted]);

  // Keyboard event handling for ESC, SPACE, and P (debug toggle)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (gameOver || whiteScreenJumpScare) return;

      switch (event.code) {
        case "Escape":
          onBackToMenu();
          break;
        case "Space":
          event.preventDefault();
          if (!eyesClosed) {
            console.log("👁️ Eyes CLOSED (Spacebar pressed)");
            setEyesClosed(true);
            eyesClosedRef.current = true;
            spacebarStartTimeRef.current = Date.now();
          }
          break;
        case "KeyP":
          event.preventDefault();
          setDebugPanelVisible(!debugPanelVisible);
          console.log(
            `🔧 Debug panel ${!debugPanelVisible ? "shown" : "hidden"}`,
          );
          break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (gameOver || whiteScreenJumpScare) return;

      switch (event.code) {
        case "Space":
          event.preventDefault();
          if (eyesClosed) {
            console.log("👁️ Eyes OPENED (Spacebar released)");
            setEyesClosed(false);
            eyesClosedRef.current = false;

            // Calculate how long spacebar was held
            if (spacebarStartTimeRef.current) {
              const holdDuration =
                Date.now() - spacebarStartTimeRef.current;
              setSpacebarHoldTime(holdDuration);
              console.log(
                `⌨️ Spacebar held for: ${holdDuration}ms`,
              );
              spacebarStartTimeRef.current = null;
            }
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    gameOver,
    whiteScreenJumpScare,
    eyesClosed,
    debugPanelVisible,
    onBackToMenu,
  ]);

  // Intro countdown effect - 35 seconds before events can start
  useEffect(() => {
    if (introActive) {
      console.log(
        `🎬 INTRO: ${introCountdown} seconds remaining...`,
      );

      if (introCountdown > 0) {
        introCountdownTimerRef.current = setTimeout(() => {
          setIntroCountdown((prev) => prev - 1);
        }, 1000);
      } else {
        // Intro finished - start the game events
        console.log(`🎮 INTRO COMPLETE! Events can now start.`);
        console.log(`🎮 Current state:`, {
          gameOver,
          currentEvent: !!currentEvent,
          eventCooldown,
          faceEvent: !!faceEvent,
        });
        setIntroActive(false);

        // Start scheduling events after intro
        setTimeout(() => {
          console.log(`🎮 Post-intro scheduling attempt:`, {
            gameOver,
            currentEvent: !!currentEvent,
            eventCooldown,
            faceEvent: !!faceEvent,
          });

          if (!gameOver && !currentEvent && !eventCooldown) {
            console.log(
              `🎮 Starting normal events after intro...`,
            );
            scheduleNextEventWithDebugCheck();
          }
          if (!faceEvent) {
            console.log(
              `🎮 Starting face events after intro...`,
            );
            scheduleFaceEventWithDebugCheck();
          }
        }, 1000);
      }
    }

    return () => {
      if (introCountdownTimerRef.current) {
        clearTimeout(introCountdownTimerRef.current);
      }
    };
  }, [
    introCountdown,
    introActive,
    gameOver,
    currentEvent,
    eventCooldown,
    faceEvent,
  ]);

  // Fallback mechanism to ensure events start after intro completion
  useEffect(() => {
    if (
      !introActive &&
      !gameOver &&
      !currentEvent &&
      !eventCooldown &&
      !faceEvent
    ) {
      console.log(
        `🚀 FALLBACK: Intro completed, starting events if needed...`,
      );

      // Small delay to ensure state is settled
      setTimeout(() => {
        if (!gameOver && !currentEvent && !eventCooldown) {
          console.log(`🚀 FALLBACK: Starting normal events...`);
          scheduleNextEventWithDebugCheck();
        }
        if (!faceEvent) {
          console.log(`🚀 FALLBACK: Starting face events...`);
          scheduleFaceEventWithDebugCheck();
        }
      }, 500);
    }
  }, [
    introActive,
    gameOver,
    currentEvent,
    eventCooldown,
    faceEvent,
  ]);

  // Game duration: 2 minutes 40 seconds = 160 seconds
  // Safe zones: 0-35s (intro) and 150-160s (final 10s)
  // Events can happen: 35-150s (115 seconds active period)
  const [gameStartTime] = useState(Date.now());
  const [gameTimeElapsed, setGameTimeElapsed] = useState(0);
  const [finalSafeZone, setFinalSafeZone] = useState(false);
  const [isBlackingOut, setIsBlackingOut] = useState(false);

  useEffect(() => {
    // Game timer: 160 seconds total (2:40)
    const gameTimer = setInterval(() => {
      const elapsed = (Date.now() - gameStartTime) / 1000;
      setGameTimeElapsed(elapsed);

      // Calculate progress percentage (0-100%)
      const progressPercent = (elapsed / 160) * 100;
      setProgress(Math.min(100, progressPercent));

      // Check for final safe zone (last 10 seconds: 150s-160s)
      if (elapsed >= 150 && !finalSafeZone) {
        console.log(
          "🏁 FINAL SAFE ZONE REACHED - No more events can start!",
        );
        setFinalSafeZone(true);

        // Clear all active events and timers
        clearAllCurrentEvents();

        // Start blackout effect at 150s
        setTimeout(() => {
          setIsBlackingOut(true);
        }, 1000);
      }

      // Win condition: complete 160 seconds (2:40)
      if (elapsed >= 160) {
        console.log(
          "🏆 GAME WON - Player survived 2 minutes 40 seconds!",
        );
        clearInterval(gameTimer);
        onNavigateToWin();
      }
    }, 1000);

    return () => clearInterval(gameTimer);
  }, [gameStartTime, finalSafeZone, onNavigateToWin]);

  const handleReset = () => {
    setProgress(0);
    setGameComplete(false);
  };

  return (
    <div
      className="relative size-full overflow-hidden"
      data-name="Frame"
    >
      {/* Game Video Background */}
      <video
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        loop
        autoPlay
        playsInline
        muted={false}
        controls={false}
        preload="auto"
      >
        <source
          src="https://storage.googleapis.com/the-last-cabin-storage/videos/game.mp4"
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>

      {/* Event Audio */}
      <audio
        ref={footstepsAudioRef}
        preload="auto"
        className="hidden"
      >
        <source
          src="https://cdn.pixabay.com/audio/2021/08/04/audio_a6da645a3e.mp3"
          type="audio/mp3"
        />
      </audio>
      <audio
        ref={heavyFootstepsAudioRef}
        preload="auto"
        className="hidden"
      >
        <source
          src="https://cdn.pixabay.com/audio/2025/06/02/audio_782e49971e.mp3"
          type="audio/mp3"
        />
      </audio>
      <audio
        ref={jumpScareAudioRef}
        preload="auto"
        className="hidden"
      >
        <source
          src="https://cdn.pixabay.com/audio/2023/07/23/audio_25d3e9d0d6.mp3"
          type="audio/mp3"
        />
      </audio>
      <audio
        ref={insanityAudioRef}
        preload="auto"
        className="hidden"
      >
        <source
          src="https://cdn.pixabay.com/audio/2022/03/09/audio_eb06fb57f4.mp3"
          type="audio/mp3"
        />
      </audio>
      <audio
        ref={insanityWarningAudioRef}
        preload="auto"
        className="hidden"
      >
        <source
          src="https://storage.googleapis.com/the-last-cabin-storage/audios/suspiro.mp3"
          type="audio/mp3"
        />
      </audio>
      <audio
        ref={whiteScreenAudioRef}
        preload="auto"
        className="hidden"
      >
        <source
          src="https://cdn.pixabay.com/audio/2023/07/23/audio_25d3e9d0d6.mp3"
          type="audio/mp3"
        />
      </audio>

      {/* Center Line */}
      <CenterLine />

      {/* Audio Detection */}
      <AudioDetectionBars audioLevel={audioLevel} />

      {/* Microphone Permission Status */}

      {/* Camera view in top left - only show when camera face detection is enabled and working */}
      {useCameraFaceDetection &&
        cameraStarted &&
        cameraPermission === "granted" && (
          <div className="absolute bottom-[50px] left-[50px] z-50">
            <div className="relative">
              <video
                ref={videoRef}
                className="w-[160px] aspect-[16/9] object-cover rounded-lg border border-white/20 bg-black"
                style={{ transform: "scaleX(-1)" }}
                autoPlay
                playsInline
                muted
                onPlaying={handleVideoPlaying}
                onError={handleVideoError}
                onLoadedMetadata={handleVideoLoadedMetadata}
              />

              {/* Face detection canvas overlay */}
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-[160px] aspect-[16/9] rounded-lg pointer-events-none opacity-70"
                style={{ transform: "scaleX(-1)" }}
              />

              {/* Loading indicator */}
              {!modelsLoaded && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg">
                  <div className="text-white text-xs">
                    Loading AI...
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      {/* Calculate coordinates and render flashlight cursor and debug info */}
      {(() => {
        // Calculate pointer coordinates for flashlight cursor
        // Priority: Camera face detection > Mouse fallback
        const pointerCoords = (() => {
          // If camera face detection is enabled and working, use face center coordinates
          if (
            useCameraFaceDetection &&
            cameraStarted &&
            faceData?.faceCenter
          ) {
            // Debug: Log when using camera coordinates
            if (debugPanelVisible) {
              console.log(
                "🎥 Flashlight using camera coordinates:",
                faceData.faceCenter,
              );
            }
            return {
              x: faceData.faceCenter.x,
              y: faceData.faceCenter.y,
            };
          }
          // Otherwise use mouse cursor position as fallback (only when camera isn't working)
          else if (
            !useCameraFaceDetection ||
            (cameraPermission === "denied" && !cameraStarted)
          ) {
            if (debugPanelVisible) {
              console.log(
                "🖱️ Flashlight using mouse coordinates:",
                cursorPosition,
              );
            }
            return cursorPosition;
          }
          // If camera is still initializing, don't show flashlight yet
          else {
            if (debugPanelVisible) {
              console.log(
                "⏳ Camera initializing, no flashlight coordinates yet",
              );
            }
            return { x: 0, y: 0 };
          }
        })();

        // Calculate horror face collision detection
        const horrorFaceCoords = faceEvent
          ? (() => {
              const faceSize = faceEvent.jumpScareTriggered
                ? 300
                : 150;
              const faceX = faceEvent.randomX;
              const faceY =
                window.innerHeight / 2 -
                (faceEvent.jumpScareTriggered ? 150 : 75);
              return {
                x: faceX + faceSize / 2,
                y: faceY + faceSize / 2,
              };
            })()
          : null;

        // Check for collision between pointer and horror face
        const collisionDetected =
          horrorFaceCoords && pointerCoords
            ? (() => {
                const faceSize = faceEvent?.jumpScareTriggered
                  ? 300
                  : 150;
                const faceBounds = {
                  left: horrorFaceCoords.x - faceSize / 2,
                  right: horrorFaceCoords.x + faceSize / 2,
                  top: horrorFaceCoords.y - faceSize / 2,
                  bottom: horrorFaceCoords.y + faceSize / 2,
                };

                return (
                  pointerCoords.x >= faceBounds.left &&
                  pointerCoords.x <= faceBounds.right &&
                  pointerCoords.y >= faceBounds.top &&
                  pointerCoords.y <= faceBounds.bottom
                );
              })()
            : false;

        return (
          <>
            {/* Flashlight Cursor - Universal pointer for both camera and mouse modes */}
            {pointerCoords && (
              <>
                <div
                  className="fixed flashlight-element z-30"
                  style={{
                    left: 0,
                    top: 0,
                    transform: `translate3d(${pointerCoords.x - 2880}px, ${pointerCoords.y - 1620}px, 0)`,
                    width: "5760px",
                    height: "3240px",
                    backgroundImage:
                      "url(https://storage.googleapis.com/the-last-cabin-storage/images/flashlight.jpg)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    mixBlendMode: "hard-light",
                  }}
                ></div>

                <div
                  className="fixed flashlight-element z-30"
                  style={{
                    left: 0,
                    top: 0,
                    transform: `translate3d(${pointerCoords.x - 2880}px, ${pointerCoords.y - 1620}px, 0)`,
                    width: "5760px",
                    height: "3240px",
                    backgroundImage:
                      "url(https://storage.googleapis.com/the-last-cabin-storage/images/flashlight2-focus.jpg)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    mixBlendMode: "color-dodge",
                  }}
                ></div>
              </>
            )}

            {/* Tracking mode indicator */}
            {!useCameraFaceDetection && debugPanelVisible && (
              <div className="absolute top-4 left-4 z-50">
                <div className="bg-black/60 p-3 rounded-lg border border-yellow-400/30">
                  <div className="text-yellow-400 text-sm font-medium mb-1">
                    🔦 Mouse Tracking Mode
                  </div>
                  <div className="text-white text-xs opacity-75">
                    Camera disabled - Move mouse to control
                    flashlight
                  </div>
                </div>
              </div>
            )}

            {/* Debug Info - Toggle with 'P' key */}
            {debugPanelVisible && (
              <div className="absolute top-4 right-4 text-white text-xs opacity-75 space-y-1 bg-black/50 p-3 rounded border border-white/20 z-50">
                <div>Progress: {progress.toFixed(1)}%</div>
                {/* Intro Countdown */}
                <div
                  className={`font-bold ${introActive ? "text-yellow-400 animate-pulse" : "text-green-400"}`}
                >
                  🎬 Intro:{" "}
                  {introActive
                    ? `${introCountdown}s`
                    : "COMPLETE"}
                </div>
                <div>Audio Level: {audioLevel.toFixed(1)}%</div>
                <div>Mic: {micPermission}</div>
                <div>Camera: {cameraPermission}</div>
                <div>Face Side: {faceSide || "none"}</div>
                <div>
                  Models: {modelsLoaded ? "loaded" : "loading"}
                </div>
                <div className="border-t border-white/20 pt-1 mt-2">
                  <div
                    className={`font-medium ${eyesClosed ? "text-red-400" : "text-green-400"}`}
                  >
                    Eyes: {eyesClosed ? "CLOSED" : "OPEN"}
                  </div>
                  {eyesClosed && spacebarHoldTime > 0 && (
                    <div className="text-yellow-400">
                      Hold:{" "}
                      {(spacebarHoldTime / 1000).toFixed(1)}s
                    </div>
                  )}
                </div>
                <div className="border-t border-white/20 pt-1">
                  <div className="text-xs">
                    Event:{" "}
                    {currentEvent ? (
                      <span className="text-orange-400">
                        {currentEvent.type} (
                        {(
                          (Date.now() -
                            currentEvent.startTime) /
                          1000
                        ).toFixed(1)}
                        s/
                        {(currentEvent.duration / 1000).toFixed(
                          1,
                        )}
                        s)
                      </span>
                    ) : (
                      <span className="text-gray-500">
                        none
                      </span>
                    )}
                  </div>
                  <div
                    className={`text-xs font-medium ${eventCooldown || currentEvent ? "text-yellow-400 animate-pulse" : "text-green-400"}`}
                  >
                    ⏱️ Cooldown:{" "}
                    {eventCooldown || currentEvent
                      ? "ACTIVE"
                      : "READY"}
                  </div>
                  {gameOver && (
                    <div className="text-red-500 font-bold animate-pulse">
                      💀 GAME OVER
                    </div>
                  )}
                </div>
                {faceData?.faceCenter && (
                  <div className="border-t border-white/20 pt-1">
                    <div>
                      Face X: {faceData.faceCenter.x.toFixed(0)}
                      px
                    </div>
                    <div>
                      Face Y: {faceData.faceCenter.y.toFixed(0)}
                      px
                    </div>
                  </div>
                )}

                {/* Microphone Death Debug */}
                <div className="border-t border-white/20 pt-1">
                  <div className="font-bold text-red-400">
                    🔴 MIC DEATH DEBUG
                  </div>
                  <div
                    className={`text-xs ${redAreaReached ? "text-red-400 font-bold" : "text-green-400"}`}
                  >
                    Red Area Flag:{" "}
                    {redAreaReached ? "TRUE" : "FALSE"}
                  </div>
                  <div
                    className={`text-xs ${deathCountdown !== null ? "text-yellow-400 font-bold animate-pulse" : "text-gray-400"}`}
                  >
                    Death Countdown:{" "}
                    {deathCountdown !== null
                      ? `${deathCountdown.toFixed(1)}s`
                      : "INACTIVE"}
                  </div>
                </div>

                {/* Eye Closure Death Debug */}
                <div className="border-t border-white/20 pt-1">
                  <div className="font-bold text-purple-400">
                    👁️ EYE CLOSURE DEBUG
                  </div>
                  <div
                    className={`text-xs ${eyeClosureCountdown > 0 ? "text-purple-400 font-bold" : "text-green-400"}`}
                  >
                    Eye Countdown:{" "}
                    {eyeClosureCountdown.toFixed(1)}s / 10s
                  </div>
                  <div
                    className={`text-xs ${currentEvent?.type === "insanity" && insanityActive ? "text-orange-400" : "text-gray-400"}`}
                  >
                    Insanity Exemption:{" "}
                    {currentEvent?.type === "insanity" &&
                    insanityActive
                      ? "ACTIVE"
                      : "INACTIVE"}
                  </div>
                  <div
                    className={`text-xs ${isEyeClosureCountdownActive ? "text-red-400 animate-pulse" : "text-blue-400"}`}
                  >
                    Direction:{" "}
                    {isEyeClosureCountdownActive
                      ? "INCREASING ⬆️"
                      : eyeClosureCountdown > 0
                        ? "DECREASING ⬇️"
                        : "IDLE"}
                  </div>
                  <div
                    className={`text-xs ${eyeClosureDeathCountdown !== null ? "text-red-400 font-bold animate-pulse" : "text-gray-400"}`}
                  >
                    Death Countdown:{" "}
                    {eyeClosureDeathCountdown !== null
                      ? `${eyeClosureDeathCountdown.toFixed(1)}s`
                      : "INACTIVE"}
                  </div>
                </div>

                {/* Lives System Debug */}
                <div className="border-t border-white/20 pt-1">
                  <div className="font-bold text-pink-400">
                    💖 LIVES SYSTEM DEBUG
                  </div>
                  <div
                    className={`text-xs ${lostLives === 0 ? "text-green-400" : lostLives === 1 ? "text-yellow-400" : lostLives === 2 ? "text-orange-400" : "text-red-400 font-bold"}`}
                  >
                    Lives Lost: {lostLives}/3 (Remaining:{" "}
                    {3 - lostLives}/3)
                  </div>
                  <div
                    className={`text-xs ${lostLives === 0 ? "text-green-400" : lostLives === 1 ? "text-yellow-400" : lostLives === 2 ? "text-orange-400" : "text-red-400"}`}
                  >
                    Border Opacity:{" "}
                    {(getRedBorderOpacity() * 100).toFixed(0)}%
                  </div>
                  <div
                    className={`text-xs ${livesCountdown !== null ? "text-red-400 font-bold animate-pulse" : "text-gray-400"}`}
                  >
                    Lives Death Countdown:{" "}
                    {livesCountdown !== null
                      ? `${livesCountdown.toFixed(1)}s`
                      : "INACTIVE"}
                  </div>
                  <div
                    className={`text-xs ${currentEvent?.type === "footsteps" && footstepsEyesClosedTime > 0 ? "text-orange-400 animate-pulse" : "text-gray-400"}`}
                  >
                    Footsteps Eye Timer:{" "}
                    {footstepsEyesClosedTime.toFixed(1)}s / 1.0s
                  </div>
                </div>

                {/* Debug Controls */}
                <div className="border-t border-white/20 pt-2 mt-2">
                  <div className="font-bold text-cyan-400 mb-2">
                    🔧 DEBUG CONTROLS
                  </div>

                  {/* Debug Mode Toggle */}
                  <button
                    onClick={() => setDebugMode(!debugMode)}
                    className={`w-full mb-2 px-2 py-1 rounded text-xs font-medium transition-colors ${
                      debugMode
                        ? "bg-cyan-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    Debug Mode: {debugMode ? "ON" : "OFF"}
                  </button>

                  {debugMode && (
                    <div className="space-y-2">
                      {/* Event Selector */}
                      <div>
                        <label className="block text-yellow-400 text-xs mb-1">
                          Select Event:
                        </label>
                        <select
                          value={selectedDebugEvent}
                          onChange={(e) =>
                            setSelectedDebugEvent(
                              e.target
                                .value as typeof selectedDebugEvent,
                            )
                          }
                          className="w-full px-2 py-1 bg-gray-800 text-white text-xs rounded border border-gray-600 focus:border-cyan-400 focus:outline-none"
                        >
                          <option value="footsteps">
                            🦶 Light Footsteps
                          </option>
                          <option value="heavy-footsteps">
                            👹 Heavy Footsteps
                          </option>
                          <option value="face-event">
                            👻 Horror Face
                          </option>
                          <option value="insanity">
                            🧠 Insanity Event
                          </option>
                        </select>
                      </div>

                      {/* Force Event Button */}
                      <button
                        onClick={forceDebugEvent}
                        disabled={debugEventRunning || gameOver}
                        className={`w-full px-2 py-1 rounded text-xs font-medium transition-colors ${
                          debugEventRunning || gameOver
                            ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                            : "bg-red-600 text-white hover:bg-red-700"
                        }`}
                      >
                        {debugEventRunning
                          ? "🔄 Debug Event Running..."
                          : "🚀 Force Trigger Event"}
                      </button>

                      {/* Clear Events Button */}
                      <button
                        onClick={clearAllCurrentEvents}
                        disabled={gameOver}
                        className={`w-full px-2 py-1 rounded text-xs font-medium transition-colors ${
                          gameOver
                            ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                            : "bg-orange-600 text-white hover:bg-orange-700"
                        }`}
                      >
                        🧹 Clear All Events
                      </button>

                      {/* Debug Status */}
                      {debugEventRunning && (
                        <div className="text-cyan-400 text-xs animate-pulse">
                          🔧 Debug event active - Normal
                          scheduling paused
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Debug Toggle Hint - Always visible */}
            <div className="absolute z-50 bottom-4 right-4 text-white/40 text-xs bg-black/30 px-2 py-1 rounded">
              Press 'P' to toggle debug panel
            </div>

            {/* Horror Face Event */}
            {faceEvent && (
              <div
                className={`absolute pointer-events-none transition-all z-20 ${
                  faceEvent.jumpScareTriggered
                    ? "duration-100 ease-out z-[999]"
                    : "duration-300 ease-in-out z-20"
                }`}
                style={{
                  left: `${faceEvent.randomX}px`,
                  top: `${window.innerHeight / 2 - (faceEvent.jumpScareTriggered ? 150 : 75)}px`,
                  width: faceEvent.jumpScareTriggered
                    ? "300px"
                    : "150px",
                  height: faceEvent.jumpScareTriggered
                    ? "300px"
                    : "150px",
                  transform: faceEvent.jumpScareTriggered
                    ? "scale(1.2)"
                    : "scale(1.0)",
                }}
              >
                <img
                  src="https://storage.googleapis.com/the-last-cabin-storage/images/horror-face.png"
                  alt="Horror Face"
                  className={`w-full h-full object-cover transition-all duration-100 ${
                    faceEvent.jumpScareTriggered
                      ? "brightness-150 contrast-150 saturate-150 animate-pulse"
                      : "opacity-90 hover:opacity-100"
                  }`}
                  style={{
                    mixBlendMode: "multiply",
                  }}
                />

                {/* Jump scare effect overlays */}
                {faceEvent.jumpScareTriggered && (
                  <>
                    <div className="absolute inset-0 bg-red-500 opacity-40 animate-pulse rounded-lg" />
                    <div className="absolute inset-0 bg-white opacity-20 animate-ping rounded-lg" />
                    <div className="absolute -inset-4 bg-red-500 opacity-20 blur-md animate-pulse rounded-xl" />
                  </>
                )}
              </div>
            )}

            {/* Face Event Debug Info */}
            {faceEvent && debugPanelVisible && (
              <div className="absolute top-32 right-4 text-white text-xs bg-black/50 p-2 rounded border border-white/20 z-50">
                <div className="font-bold text-purple-400">
                  👻 FACE EVENT DEBUG
                </div>
                <div>Event ID: #{faceEvent.id}</div>
                <div>Side: {faceEvent.side}</div>
                <div>Size: 150px → 300px (jump scare)</div>
                <div>
                  Duration:{" "}
                  {(
                    (Date.now() - faceEvent.startTime) /
                    1000
                  ).toFixed(1)}
                  s/{(faceEvent.duration / 1000).toFixed(1)}s
                </div>
                <div>
                  Jump Scare:{" "}
                  {faceEvent.jumpScareTriggered
                    ? "💀 TRIGGERED"
                    : "👁️ WATCHING"}
                </div>

                <div className="border-t border-white/20 mt-2 pt-2">
                  <div className="font-bold text-cyan-400">
                    🎯 COLLISION DEBUG
                  </div>
                  <div className="text-yellow-400">
                    Face Pointer:{" "}
                    {faceData?.faceCenter
                      ? `${faceData.faceCenter.x.toFixed(0)}, ${faceData.faceCenter.y.toFixed(0)}`
                      : "No Face"}
                  </div>
                  <div className="text-orange-400">
                    Horror Face:{" "}
                    {(() => {
                      const faceSize =
                        faceEvent.jumpScareTriggered
                          ? 300
                          : 150;
                      const faceX =
                        faceEvent.side === "left"
                          ? 100
                          : window.innerWidth - 250;
                      const faceY =
                        window.innerHeight / 2 -
                        (faceEvent.jumpScareTriggered
                          ? 150
                          : 75);
                      return `${faceX}, ${faceY}`;
                    })()}
                  </div>
                  <div className="text-pink-400">
                    Horror Size:{" "}
                    {(() => {
                      const faceSize =
                        faceEvent.jumpScareTriggered
                          ? 300
                          : 150;
                      return `${faceSize}x${faceSize}`;
                    })()}
                  </div>
                  <div className="text-purple-400">
                    Horror Bounds:{" "}
                    {(() => {
                      const faceSize =
                        faceEvent.jumpScareTriggered
                          ? 300
                          : 150;
                      const faceX = faceEvent.randomX;
                      const faceY =
                        window.innerHeight / 2 -
                        (faceEvent.jumpScareTriggered
                          ? 150
                          : 75);
                      return `X:${faceX.toFixed(1)}-${(faceX + faceSize).toFixed(1)} Y:${faceY}-${faceY + faceSize}`;
                    })()}
                  </div>
                  <div
                    className={`${collisionDetected ? "text-red-400 font-bold animate-pulse" : "text-green-400"}`}
                  >
                    🎯 Collision:{" "}
                    {collisionDetected ? "TRUE" : "FALSE"}
                  </div>
                  <div
                    className={`${currentLookingTime > 0 ? "text-yellow-400 font-bold" : "text-gray-400"}`}
                  >
                    ⏱️ Looking Time:{" "}
                    {currentLookingTime.toFixed(2)}s / 1.20s
                  </div>

                  {/* New coordinate tracking debug info */}
                  <div className="border-t border-white/20 pt-1 mt-1">
                    <div className="text-cyan-400 text-xs">
                      📍 Coordinate Tracking:
                    </div>
                    {horrorFaceCoords ? (
                      <div className="text-purple-400 text-xs">
                        Horror Face: (
                        {horrorFaceCoords.x.toFixed(1)},{" "}
                        {horrorFaceCoords.y.toFixed(1)})
                      </div>
                    ) : (
                      <div className="text-gray-400 text-xs">
                        Horror Face: No coords
                      </div>
                    )}
                    {pointerCoords ? (
                      <div className="text-blue-400 text-xs">
                        Pointer: ({pointerCoords.x.toFixed(1)},{" "}
                        {pointerCoords.y.toFixed(1)})
                      </div>
                    ) : (
                      <div className="text-gray-400 text-xs">
                        Pointer: No coords
                      </div>
                    )}
                    {horrorFaceCoords && pointerCoords && (
                      <div className="text-yellow-400 text-xs">
                        Distance:{" "}
                        {Math.sqrt(
                          Math.pow(
                            pointerCoords.x -
                              horrorFaceCoords.x,
                            2,
                          ) +
                            Math.pow(
                              pointerCoords.y -
                                horrorFaceCoords.y,
                              2,
                            ),
                        ).toFixed(1)}
                        px
                      </div>
                    )}
                  </div>
                </div>

                {lookingTimerRef.current && (
                  <div className="text-orange-400 animate-pulse border-t border-white/20 mt-2 pt-2">
                    ⚠️ LOOKING TIMER ACTIVE
                  </div>
                )}
              </div>
            )}

            {/* Video Jump Scare */}
            {whiteScreenJumpScare && jumpScareVideoSrc && (
              <div
                className="fixed inset-0 bg-black z-[9999] flex items-center justify-center"
                style={{
                  width: "100vw",
                  height: "100vh",
                }}
              >
                <video
                  ref={jumpScareVideoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted={false}
                  playsInline
                  controls={false}
                  preload="auto"
                  onEnded={() => {
                    console.log("🎬 Jump scare video ended");
                    // Video ended naturally, proceed to game over
                  }}
                  onError={(e) => {
                    console.error(
                      "🎬 Jump scare video error:",
                      e,
                    );
                    // Fallback to immediate game over if video fails
                    setTimeout(() => {
                      setGameOverReason("video-error");
                      setGameOver(true);
                    }, 1000);
                  }}
                >
                  <source
                    src={jumpScareVideoSrc}
                    type="video/mp4"
                  />
                  Your browser does not support the video tag.
                </video>
              </div>
            )}

            {/* Lives System Blood Image Overlay */}
            {lostLives > 0 && (
              <div
                className="fixed inset-0 pointer-events-none z-40 transition-opacity duration-500"
                style={{
                  backgroundImage:
                    "url(https://storage.googleapis.com/the-last-cabin-storage/images/blood.png)",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  opacity: getRedBorderOpacity(), // Boost visibility
                  width: "100vw",
                  height: "100vh",
                  // mixBlendMode: "darken",
                }}
              />
            )}

            {/* Back to Menu (ESC key hint) */}
            <div className="absolute bottom-4 left-4 z-50  text-white text-xs opacity-50 bg-black/30 p-2 rounded">
              Press ESC to return to menu • Hold SPACE to close
              eyes
            </div>

            {/* Eye Closing Visual Effect */}
            <div
              className="fixed inset-0 bg-black pointer-events-none z-[35] transition-transform duration-300 ease-out"
              style={{
                opacity: 0.99,
                width: "100vw",
                height: "100vh",
                transform: eyesClosed
                  ? "translateY(0%)"
                  : "translateY(-100%)",
              }}
            />
          </>
        );
      })()}
    </div>
  );
};

export default PlayScreen;
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface MediaDeviceInfo {
  deviceId: string;
  label: string;
  kind: 'videoinput' | 'audioinput';
}

export interface SettingsContextType {
  // Device lists
  cameraDevices: MediaDeviceInfo[];
  microphoneDevices: MediaDeviceInfo[];
  
  // Selected device IDs
  selectedCameraId: string | null;
  selectedMicrophoneId: string | null;
  
  // Fallback settings
  useCameraFaceDetection: boolean;
  useMicrophoneDetection: boolean;
  
  // Actions
  setSelectedCameraId: (deviceId: string | null) => void;
  setSelectedMicrophoneId: (deviceId: string | null) => void;
  refreshDevices: () => Promise<void>;
  
  // Status
  isDevicesLoaded: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

const STORAGE_KEYS = {
  SELECTED_CAMERA_ID: 'horror-game-selected-camera-id',
  SELECTED_MICROPHONE_ID: 'horror-game-selected-microphone-id',
  USE_CAMERA_FACE_DETECTION: 'horror-game-use-camera-face-detection',
  USE_MICROPHONE_DETECTION: 'horror-game-use-microphone-detection'
};

export const SettingsProvider = ({ children }: SettingsProviderProps) => {
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [microphoneDevices, setMicrophoneDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.SELECTED_CAMERA_ID) || null;
  });
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.SELECTED_MICROPHONE_ID) || null;
  });
  const [isDevicesLoaded, setIsDevicesLoaded] = useState(false);

  // Derived states for fallback logic
  const useCameraFaceDetection = selectedCameraId !== null && cameraDevices.length > 0;
  const useMicrophoneDetection = selectedMicrophoneId !== null && microphoneDevices.length > 0;

  const refreshDevices = async () => {
    try {
      console.log('🎛️ SETTINGS: Refreshing media devices...');
      
      // Don't request permissions automatically - just enumerate available devices
      console.log('🎛️ SETTINGS: Enumerating devices without requesting permissions');

      // Get all media devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      console.log('🎛️ SETTINGS: Found devices:', devices);

      // Filter and map devices
      const cameras: MediaDeviceInfo[] = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 8)}`,
          kind: 'videoinput' as const
        }));

      const microphones: MediaDeviceInfo[] = devices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${device.deviceId.slice(0, 8)}`,
          kind: 'audioinput' as const
        }));

      console.log('🎛️ SETTINGS: Cameras found:', cameras.length);
      console.log('🎛️ SETTINGS: Microphones found:', microphones.length);

      setCameraDevices(cameras);
      setMicrophoneDevices(microphones);

      // Set default devices (first available) if none selected
      if (!selectedCameraId && cameras.length > 0) {
        const defaultCamera = cameras[0].deviceId;
        setSelectedCameraId(defaultCamera);
        console.log(`🎛️ SETTINGS: Default camera selected: ${cameras[0].label}`);
      }

      if (!selectedMicrophoneId && microphones.length > 0) {
        const defaultMicrophone = microphones[0].deviceId;
        setSelectedMicrophoneId(defaultMicrophone);
        console.log(`🎛️ SETTINGS: Default microphone selected: ${microphones[0].label}`);
      }

      // If no devices found, clear selections
      if (cameras.length === 0) {
        setSelectedCameraId(null);
        console.log('🎛️ SETTINGS: No cameras found - using mouse fallback');
      }

      if (microphones.length === 0) {
        setSelectedMicrophoneId(null);
        console.log('🎛️ SETTINGS: No microphones found - disabling audio detection');
      }

      setIsDevicesLoaded(true);
    } catch (error) {
      console.error('🎛️ SETTINGS: Error refreshing devices:', error);
      setIsDevicesLoaded(true);
    }
  };

  // Wrapper functions to save to localStorage
  const handleSetSelectedCameraId = (deviceId: string | null) => {
    setSelectedCameraId(deviceId);
    if (deviceId) {
      localStorage.setItem(STORAGE_KEYS.SELECTED_CAMERA_ID, deviceId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.SELECTED_CAMERA_ID);
    }
    console.log('🎛️ SETTINGS: Camera preference saved:', deviceId || 'None (Mouse fallback)');
  };

  const handleSetSelectedMicrophoneId = (deviceId: string | null) => {
    setSelectedMicrophoneId(deviceId);
    if (deviceId) {
      localStorage.setItem(STORAGE_KEYS.SELECTED_MICROPHONE_ID, deviceId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.SELECTED_MICROPHONE_ID);
    }
    console.log('🎛️ SETTINGS: Microphone preference saved:', deviceId || 'None (Disabled)');
  };

  // Initialize devices on mount
  useEffect(() => {
    refreshDevices();

    // Listen for device changes
    const handleDeviceChange = () => {
      console.log('🎛️ SETTINGS: Device change detected, refreshing...');
      refreshDevices();
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, []);

  // Log fallback states when they change
  useEffect(() => {
    console.log('🎛️ SETTINGS: Camera face detection:', useCameraFaceDetection ? 'ENABLED' : 'DISABLED (using mouse)');
    console.log('🎛️ SETTINGS: Microphone detection:', useMicrophoneDetection ? 'ENABLED' : 'DISABLED');
  }, [useCameraFaceDetection, useMicrophoneDetection]);

  const value: SettingsContextType = {
    cameraDevices,
    microphoneDevices,
    selectedCameraId,
    selectedMicrophoneId,
    useCameraFaceDetection,
    useMicrophoneDetection,
    setSelectedCameraId: handleSetSelectedCameraId,
    setSelectedMicrophoneId: handleSetSelectedMicrophoneId,
    refreshDevices,
    isDevicesLoaded,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
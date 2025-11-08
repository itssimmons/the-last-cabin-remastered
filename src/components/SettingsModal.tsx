import { useState, useEffect } from "react";
import closeButtonHoverBg from "figma:asset/ba3c79a2e24ebd2d567c67b67aa9e459630a4f48.png";
import grainTexture from "figma:asset/96389566f41e75b42f395a924273e1e81a8e64f0.png";
import { useSettings } from "../contexts/SettingsContext";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal = ({
  isOpen,
  onClose,
}: SettingsModalProps) => {
  const {
    cameraDevices,
    microphoneDevices,
    selectedCameraId,
    selectedMicrophoneId,
    setSelectedCameraId,
    setSelectedMicrophoneId,
    useCameraFaceDetection,
    useMicrophoneDetection,
    isDevicesLoaded,
    refreshDevices,
  } = useSettings();

  // Get current device labels for display
  const getCurrentCameraLabel = () => {
    if (!selectedCameraId) return "Mouse Pointer (No Camera)";
    const device = cameraDevices.find(
      (d) => d.deviceId === selectedCameraId,
    );
    return device ? device.label : "Unknown Camera";
  };

  const getCurrentMicrophoneLabel = () => {
    if (!selectedMicrophoneId)
      return "Disabled (No Microphone)";
    const device = microphoneDevices.find(
      (d) => d.deviceId === selectedMicrophoneId,
    );
    return device ? device.label : "Unknown Microphone";
  };

  const cycleCameraSetting = (direction: "next" | "prev") => {
    // Create options array: null (mouse) + all camera devices
    const options = [
      null,
      ...cameraDevices.map((d) => d.deviceId),
    ];
    const currentIndex = options.indexOf(selectedCameraId);

    let nextIndex: number;
    if (direction === "next") {
      nextIndex = (currentIndex + 1) % options.length;
    } else {
      nextIndex =
        (currentIndex - 1 + options.length) % options.length;
    }

    setSelectedCameraId(options[nextIndex]);
  };

  const cycleMicrophoneSetting = (
    direction: "next" | "prev",
  ) => {
    // Create options array: null (disabled) + all microphone devices
    const options = [
      null,
      ...microphoneDevices.map((d) => d.deviceId),
    ];
    const currentIndex = options.indexOf(selectedMicrophoneId);

    let nextIndex: number;
    if (direction === "next") {
      nextIndex = (currentIndex + 1) % options.length;
    } else {
      nextIndex =
        (currentIndex - 1 + options.length) % options.length;
    }

    setSelectedMicrophoneId(options[nextIndex]);
  };

  // Refresh devices when modal opens
  useEffect(() => {
    if (isOpen && !isDevicesLoaded) {
      refreshDevices();
    }
  }, [isOpen, isDevicesLoaded, refreshDevices]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Fondo oscurecido */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative z-10 flex flex-col w-[905px] h-[586px] bg-center bg-cover bg-no-repeat text-white rounded-lg"
        style={{
          backgroundImage: `url(https://i.imgur.com/u1qmnIx.png)`,
        }}
      >
        {/* Contenido */}
        <div className="flex flex-col h-full px-[65px] py-[51px] relative pt-[51px] pr-[65px] pb-[30px] pl-[65px]">
          {/* Título y Estado */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="capitalize font-[SF_Pro] text-[40px] leading-none text-left">
              Setting
            </h2>
            {!isDevicesLoaded ? (
              <div className="text-yellow-400 text-sm">
                Loading devices...
              </div>
            ) : (
              <button
                onClick={refreshDevices}
                className="text-[rgba(255,255,255,1)] hover:text-blue-300 text-sm no-underline font-[SF_Pro] font-bold font-normal"
              >
                Refresh Devices
              </button>
            )}
          </div>

          {/* Device Status Indicators */}
          <div className="mb-6 text-sm opacity-75 pt-[0px] pr-[0px] pb-[0px] pl-[15px]">
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`w-3 h-3 rounded-full ${useCameraFaceDetection ? "bg-green-500" : "bg-orange-500"}`}
              />
              <span>
                Camera:{" "}
                {useCameraFaceDetection
                  ? "Face Detection Active"
                  : "Mouse Pointer Mode"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${useMicrophoneDetection ? "bg-green-500" : "bg-red-500"}`}
              />
              <span>
                Microphone:{" "}
                {useMicrophoneDetection
                  ? "Audio Detection Active"
                  : "Disabled"}
              </span>
            </div>
          </div>

          {/* Lista de opciones */}
          <div className="flex flex-col items-start gap-4">
            {/* Camera row */}
            <div className="group relative w-[640px] h-[60px] flex items-center gap-6 px-4">
              {/* Background layer */}
              <div
                className="absolute inset-0 bg-no-repeat opacity-0 group-hover:opacity-100 transition"
                style={{
                  backgroundImage:
                    "url(https://i.imgur.com/HbRQ5YJ.png)",
                  backgroundPosition: "calc(50% - 45px) center",
                  backgroundSize: "120%",
                }}
              />

              {/* Content (on top of background) */}
              <span className="relative z-10 w-48 text-[25px] capitalize">
                Camera
              </span>

              <button
                className="relative z-10 flex h-6 w-6 items-center justify-center"
                onClick={() => cycleCameraSetting("prev")}
              >
                <div className="w-0 h-0 border-r-[8px] border-r-white border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent" />
              </button>

              <span className="relative z-10 w-64 text-center text-[15px] capitalize whitespace-nowrap">
                {getCurrentCameraLabel()}
              </span>

              <button
                className="relative z-10 flex h-6 w-6 items-center justify-center"
                onClick={() => cycleCameraSetting("next")}
              >
                <div className="w-0 h-0 border-l-[8px] border-l-white border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent" />
              </button>
            </div>

            {/* Microphone row */}
            <div className="group relative w-[640px] h-[60px] flex items-center gap-6 px-4">
              {/* Background layer */}
              <div
                className="absolute inset-0 bg-no-repeat opacity-0 group-hover:opacity-100 transition"
                style={{
                  backgroundImage:
                    "url(https://i.imgur.com/HbRQ5YJ.png)",
                  backgroundPosition: "calc(50% - 45px) center",
                  backgroundSize: "120%",
                }}
              />

              {/* Content (on top of background) */}
              <span className="relative z-10 w-48 text-[25px] capitalize">
                Microphone
              </span>

              <button
                className="relative z-10 flex h-6 w-6 items-center justify-center"
                onClick={() => cycleMicrophoneSetting("prev")}
              >
                <div className="w-0 h-0 border-r-[8px] border-r-white border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent" />
              </button>

              <span className="relative z-10 w-64 text-center text-[15px] capitalize whitespace-nowrap">
                {getCurrentMicrophoneLabel()}
              </span>

              <button
                className="relative z-10 flex h-6 w-6 items-center justify-center"
                onClick={() => cycleMicrophoneSetting("next")}
              >
                <div className="w-0 h-0 border-l-[8px] border-l-white border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent" />
              </button>
            </div>
          </div>

          {/* Footer: botón cerrar */}
          <div className="flex justify-center mt-auto">
            <button
              className="relative w-80 h-[70px] cursor-pointer hover:opacity-90 transition 
             bg-center bg-cover bg-no-repeat text-white text-[25px] capitalize 
             font-sans flex items-center justify-center rounded-md"
              style={{
                backgroundImage: "none",
                transition: "background-image 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundImage = `url(https://i.imgur.com/Pu4ATTN.png)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundImage = "none";
              }}
              onClick={onClose}
            >
              close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
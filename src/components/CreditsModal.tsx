import closeButtonHoverBg from "figma:asset/ba3c79a2e24ebd2d567c67b67aa9e459630a4f48.png";
import grainTexture from "figma:asset/96389566f41e75b42f395a924273e1e81a8e64f0.png";

interface CreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreditsModal = ({
  isOpen,
  onClose,
}: CreditsModalProps) => {
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
          {/* Grain texture overlay */}
        
          
          {/* Título */}
          <h2 className="capitalize font-sans text-[45px] leading-none mb-8 text-left">
            Credits
          </h2>

          {/* Grid of credits (2 columns x 3 aligned rows) */}
          <div className="grid grid-cols-3 gap-x-16 gap-y-8 auto-rows-min flex-1 pt-[0px] pr-[0px] pb-[0px] pl-[13px]">
            {/* Left column */}
            <div className="col-start-1 row-start-1 space-y-1">
              <p className="font-sans text-[20px] capitalize">Idea</p>
              <p className="font-sans text-[20px]">
                <a 
                  href="https://bento.me/scorzelli" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:underline cursor-pointer"
                >
                  Ismael Scorzelli
                </a>
              </p>
              <p className="font-sans text-[20px]">
                <a 
                  href="https://github.com/itssimmons" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:underline cursor-pointer"
                >
                  Simón Villafañe
                </a>
              </p>
            </div>

            <div className="col-start-1 row-start-2 space-y-1">
              <p className="font-sans text-[20px] capitalize">Programming</p>
              <p className="font-sans text-[20px]">
                <a 
                  href="https://bento.me/scorzelli" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:underline cursor-pointer"
                >
                  Ismael Scorzelli
                </a>
              </p>
              <p className="font-sans text-[20px]">
                <a 
                  href="https://github.com/itssimmons" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:underline cursor-pointer"
                >
                  Simón Villafañe
                </a>
              </p>
            </div>

            <div className="col-start-1 row-start-3 space-y-1">
              <p className="font-sans text-[20px] capitalize">Design</p>
              <p className="font-sans text-[20px]">
                <a 
                  href="https://bento.me/scorzelli" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:underline cursor-pointer"
                >
                  Ismael Scorzelli
                </a>
              </p>
            </div>

            {/* Right column */}
            <div className="col-start-2 row-start-1 space-y-1">
              <p className="font-sans text-[20px] capitalize">Music &amp; Audio</p>
              <p className="font-sans text-[20px]">Pixabay</p>
            </div>

            {/* Aligned with "Programming" */}
            <div className="col-start-2 row-start-2 space-y-1">
              <p className="font-sans text-[20px] capitalize">Testing &amp; Balancing</p>
              <p className="font-sans text-[20px]">
                <a 
                  href="https://bento.me/scorzelli" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:underline cursor-pointer"
                >
                  Ismael Scorzelli
                </a>
              </p>
              <p className="font-sans text-[20px]">
                <a 
                  href="https://github.com/itssimmons" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:underline cursor-pointer"
                >
                  Simón Villafañe
                </a>
              </p>
            </div>

            {/* Aligned with "Design" */}
            <div className="col-start-2 row-start-3 space-y-1">
              <p className="font-sans text-[20px] capitalize">Prototyping Tool</p>
              <p className="font-sans text-[20px]">Figma Make</p>
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

export default CreditsModal;
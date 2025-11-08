import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import SettingsModal from './SettingsModal';
import CreditsModal from './CreditsModal';

interface MainMenuProps {
  onNavigateToGame: () => void;
  onNavigateToPlay: () => void;
}

const MainMenu = ({ onNavigateToGame, onNavigateToPlay }: MainMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const menuItemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const buttonBackgroundsRef = useRef<(HTMLDivElement | null)[]>([]);
  
  // Modal state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);

  useEffect(() => {
    // Initial animation when component mounts
    gsap.fromTo(
      menuItemsRef.current,
      { 
        x: -50, 
        opacity: 0 
      },
      { 
        x: 0, 
        opacity: 1, 
        duration: 0.8, 
        stagger: 0.2, 
        ease: "power2.out" 
      }
    );

    // Set up hover animations for each menu item
    menuItemsRef.current.forEach((item, index) => {
      if (item && item.parentElement) {
        const buttonBg = buttonBackgroundsRef.current[index];
        const wrapper = item.parentElement;
        
        const handleMouseEnter = () => {
          // Move text to the right
          gsap.to(item, {
            x: 5,
            duration: 0.3,
            ease: "power2.out"
          });
          
          // Show button background
          if (buttonBg) {
            gsap.to(buttonBg, {
              opacity: 1,
              duration: 0.3,
              ease: "power2.out"
            });
          }
        };

        const handleMouseLeave = () => {
          // Reset text position
          gsap.to(item, {
            x: 0,
            duration: 0.3,
            ease: "power2.out"
          });
          
          // Hide button background
          if (buttonBg) {
            gsap.to(buttonBg, {
              opacity: 0,
              duration: 0.3,
              ease: "power2.out"
            });
          }
        };

        wrapper.addEventListener('mouseenter', handleMouseEnter);
        wrapper.addEventListener('mouseleave', handleMouseLeave);

        // Cleanup event listeners
        return () => {
          wrapper.removeEventListener('mouseenter', handleMouseEnter);
          wrapper.removeEventListener('mouseleave', handleMouseLeave);
        };
      }
    });
  }, []);

  const setMenuItemRef = (index: number) => (ref: HTMLDivElement | null) => {
    menuItemsRef.current[index] = ref;
  };

  const setButtonBackgroundRef = (index: number) => (ref: HTMLDivElement | null) => {
    buttonBackgroundsRef.current[index] = ref;
  };

  const handleMenuItemClick = (item: string) => {
    switch (item) {
      case 'play':
        onNavigateToPlay();
        break;
      case 'setting':
        setIsSettingsOpen(true);
        break;
      case 'credits':
        setIsCreditsOpen(true);
        break;
      default:
        break;
    }
  };

  return (
    <div className="main-menu-container">
      <div ref={menuRef} className="main-menu m-[0px] px-[0px] py-[26px] py-[21px]">
        <div className="menu-item-wrapper" onClick={() => handleMenuItemClick('play')}>
          <div 
            ref={setButtonBackgroundRef(0)}
            className="button-background button-background-play"
          ></div>
          <div 
            ref={setMenuItemRef(0)}
            className="menu-item menu-item-play"
            style={{ fontSize: '48px', fontFamily: 'SF Pro, -apple-system, BlinkMacSystemFont, sans-serif' }}
          >
            Play
          </div>
        </div>
        
        <div className="menu-item-wrapper" onClick={() => handleMenuItemClick('setting')}>
          <div 
            ref={setButtonBackgroundRef(1)}
            className="button-background"
          ></div>
          <div 
            ref={setMenuItemRef(1)}
            className="menu-item menu-item-default"
            style={{ fontSize: '35px', fontFamily: 'SF Pro, -apple-system, BlinkMacSystemFont, sans-serif' }}
          >
            Settings
          </div>
        </div>
        
        <div className="menu-item-wrapper" onClick={() => handleMenuItemClick('credits')}>
          <div 
            ref={setButtonBackgroundRef(2)}
            className="button-background"
          ></div>
          <div 
            ref={setMenuItemRef(2)}
            className="menu-item menu-item-default"
            style={{ fontSize: '35px', fontFamily: 'SF Pro, -apple-system, BlinkMacSystemFont, sans-serif' }}
          >
            Credits
          </div>
        </div>
      </div>

      {/* Modals */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
      <CreditsModal 
        isOpen={isCreditsOpen} 
        onClose={() => setIsCreditsOpen(false)} 
      />

      <style>{`
        .main-menu-container {
          position: flex;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: flex-end;
          padding-left: 60px;
          padding-bottom: 80px;
          z-index: 10;
        }

        .main-menu {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .menu-item-wrapper {
          position: relative;
          width: 354px;
          height: 73px;
        }

        .button-background {
          position: absolute;
          top: 0;
          left: -45px;
          width: 354px;
          height: 73px;
          z-index: 1;
          opacity: 0;
          background-image: url('https://i.imgur.com/Pu4ATTN.png');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }
.button-background-play {
  width: 450px;   /* ajustá al tamaño que quieras */
  height: 85px;
  left: -55px;
  top: -4px;
}
        .button-background::before,
        .button-background::after {
          content: '';
          position: absolute;
          left: 0;
          width: 100%;
          height: 3px;
          
          background-size: 100% 100%;
          background-repeat: no-repeat;
        }

        .button-background::before {
          top: 0;
        }

        .button-background::after {
          bottom: 0;
        }

        .menu-item {
          position: relative;
          z-index: 2;
          color: white;
          font-size: 1.75rem;
          font-weight: 400;
          cursor: pointer;
          user-select: none;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          text-transform: capitalize;
          padding: 12px 14px;
          height: 100%;
          display: flex;
          align-items: center;
          line-height: 1;
        }

        @media (max-width: 768px) {
          .main-menu-container {
            padding-left: 30px;
            padding-bottom: 100px;
          }
          
          .menu-item-wrapper {
            width: 280px;
            height: 58px;
          }

          .button-background {
            left: 0;
            width: 280px;
            height: 58px;
            background-size: 280px 58px;
          }
          
          .menu-item {
            font-size: 1.5rem;
            padding: 10px 12px;
          }

          .main-menu {
            gap: 6px;
          }
        }

        @media (max-width: 480px) {
          .main-menu-container {
            padding-left: 20px;
            align-items: flex-end;
            padding-bottom: 80px;
          }
          
          .menu-item-wrapper {
            width: 240px;
            height: 50px;
          }

          .button-background {
            left: 0;
            width: 240px;
            height: 50px;
            background-size: 240px 50px;
          }
          
          .menu-item {
            font-size: 1.25rem;
            padding: 8px 10px;
          }

          .main-menu {
            gap: 5px;
          }
        }
      `}</style>
    </div>
  );
};

export default MainMenu;
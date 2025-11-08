import imgSinTitulo11 from "figma:asset/7eb17cbfe4b61d4bc89ae19fd78b90ad5518e9d9.png";
import imgTexturelabsGrunge349M1 from "figma:asset/d5154915c1a6754ca78921085a77f61dc232155a.png";
import imgTexturelabsGrunge355M11 from "figma:asset/c00dd951017282e62210dfc358b3ab7980663cde.png";
import { imgButtonContainer, imgPolygon1, imgPolygon2, imgButtonContainer1 } from "./svg-aax1z";

function ButtonContainer() {
  return (
    <div className="absolute h-[73px] left-[84px] top-[809px] w-[354px]" data-name="Button Container">
      <div className="absolute inset-[-88.08%_-17.88%_-89.45%_-18.16%]">
        <img className="block max-w-none size-full" src={imgButtonContainer} />
      </div>
    </div>
  );
}

function Setting() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0)] blur-[11.9px] filter h-[586px] left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] w-[905px]" data-name="setting">
      <div aria-hidden="true" className="absolute border border-solid border-white inset-0 pointer-events-none" />
      <div className="absolute capitalize font-['Inter:Regular',_sans-serif] font-normal leading-[0] left-[45px] not-italic text-[45.277px] text-nowrap text-white top-[35px]">
        <p className="leading-[normal] whitespace-pre">setting</p>
      </div>
    </div>
  );
}

function Group3() {
  return (
    <div className="absolute contents left-[47px] top-[117px]">
      <div className="absolute capitalize font-['Inter:Regular',_sans-serif] font-normal leading-[0] left-[47px] not-italic text-[25px] text-nowrap text-white top-[117px]">
        <p className="leading-[normal] whitespace-pre">camera</p>
      </div>
      <div className="absolute capitalize font-['Inter:Regular',_sans-serif] font-normal leading-[0] left-[367px] not-italic text-[25px] text-nowrap text-white top-[117px]">
        <p className="leading-[normal] whitespace-pre">OBS-camera</p>
      </div>
      <div className="absolute flex h-[16px] items-center justify-center left-[559px] top-[118px] w-[15.984px]">
        <div className="flex-none rotate-[90deg]">
          <div className="relative size-4">
            <div className="absolute inset-[-106.88%_-100.18%_-81.88%_-100.18%]">
              <img className="block max-w-none size-full" src={imgPolygon1} />
            </div>
          </div>
        </div>
      </div>
      <div className="absolute flex h-[16px] items-center justify-center left-[328px] top-[118px] w-[15.984px]">
        <div className="flex-none rotate-[270deg]">
          <div className="relative size-4">
            <div className="absolute inset-[-106.88%_-100.18%_-81.88%_-100.18%]">
              <img className="block max-w-none size-full" src={imgPolygon2} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ButtonContainer1() {
  return (
    <div className="absolute h-[52px] left-[-1px] top-[-1px] w-[553px]" data-name="Button Container">
      <div className="absolute inset-[-81.91%_-7.76%_-82.24%_-7.7%]">
        <img className="block max-w-none size-full" src={imgButtonContainer1} />
      </div>
    </div>
  );
}

function ButtomCloseActive() {
  return (
    <div className="absolute h-[49px] left-[39px] top-[184px] w-[552px]" data-name="buttom close active">
      <ButtonContainer1 />
    </div>
  );
}

function Group2() {
  return (
    <div className="absolute contents left-[39px] top-[184px]">
      <ButtomCloseActive />
      <div className="absolute capitalize font-['Inter:Regular',_sans-serif] font-normal leading-[0] left-[47px] not-italic text-[25px] text-nowrap text-white top-[199px]">
        <p className="leading-[normal] whitespace-pre">microphone</p>
      </div>
      <div className="absolute capitalize font-['Inter:Regular',_sans-serif] font-normal leading-[0] left-[367px] not-italic text-[25px] text-nowrap text-white top-[200px]">
        <p className="leading-[normal] whitespace-pre">microfono</p>
      </div>
      <div className="absolute flex h-[16px] items-center justify-center left-[559px] top-[201px] w-[15.984px]">
        <div className="flex-none rotate-[90deg]">
          <div className="relative size-4">
            <div className="absolute inset-[-106.88%_-100.18%_-81.88%_-100.18%]">
              <img className="block max-w-none size-full" src={imgPolygon1} />
            </div>
          </div>
        </div>
      </div>
      <div className="absolute flex h-[16px] items-center justify-center left-[328px] top-[201px] w-[15.984px]">
        <div className="flex-none rotate-[270deg]">
          <div className="relative size-4">
            <div className="absolute inset-[-106.88%_-100.18%_-81.88%_-100.18%]">
              <img className="block max-w-none size-full" src={imgPolygon2} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PopUp() {
  return (
    <div className="absolute h-[586px] left-0 top-0 w-[905px]" data-name="pop up">
      <Setting />
      <Group3 />
      <Group2 />
    </div>
  );
}

function ButtomCloseActive1() {
  return (
    <div className="absolute h-[49.492px] left-[332px] top-[507px] w-60" data-name="buttom close active">
      <div className="absolute capitalize font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic text-[25px] text-nowrap text-white" style={{ top: "calc(50% - 8.746px)", left: "calc(50% - 33px)" }}>
        <p className="leading-[normal] whitespace-pre">close</p>
      </div>
    </div>
  );
}

function Frame7() {
  return (
    <div className="absolute h-[586px] left-[507px] top-[247px] w-[905px]">
      <PopUp />
      <ButtomCloseActive1 />
    </div>
  );
}

export default function Background() {
  return (
    <div className="bg-white relative size-full" data-name="Background">
      <div className="absolute bg-center bg-cover bg-no-repeat h-[1080px] left-0 top-0 w-[1920px]" data-name="Sin título-1 1" style={{ backgroundImage: `url('${imgSinTitulo11}')` }} />
      <div className="absolute bg-center bg-cover bg-no-repeat h-[1080px] left-0 top-0 w-[1920px]" data-name="Texturelabs_Grunge_349M 1" style={{ backgroundImage: `url('${imgTexturelabsGrunge349M1}')` }} />
      <div className="absolute h-[1281px] left-0 mix-blend-screen top-[-137px] w-[1920px]" data-name="Texturelabs_Grunge_320M (2) 1" />
      <ButtonContainer />
      <div className="absolute capitalize font-['Inter:Regular',_sans-serif] font-normal leading-[0] left-[98px] not-italic text-[45.277px] text-nowrap text-white top-[746px]">
        <p className="leading-[normal] whitespace-pre">play</p>
      </div>
      <div className="absolute capitalize font-['Inter:Regular',_sans-serif] font-normal leading-[0] left-[98px] not-italic text-[45.277px] text-nowrap text-white top-[829px]">
        <p className="leading-[normal] whitespace-pre">setting</p>
      </div>
      <div className="absolute capitalize font-['Inter:Regular',_sans-serif] font-normal leading-[0] left-[98px] not-italic text-[45.277px] text-nowrap text-white top-[912px]">
        <p className="leading-[normal] whitespace-pre">credits</p>
      </div>
      <div className="absolute bg-center bg-cover bg-no-repeat h-[1531px] left-0 opacity-70 top-[-214px] w-[1920px]" data-name="Texturelabs_Grunge_355M (1) 1" style={{ backgroundImage: `url('${imgTexturelabsGrunge355M11}')` }} />
      <Frame7 />
    </div>
  );
}
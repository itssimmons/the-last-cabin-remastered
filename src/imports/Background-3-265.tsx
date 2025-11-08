import imgSinTitulo11 from "figma:asset/7eb17cbfe4b61d4bc89ae19fd78b90ad5518e9d9.png";
import imgTexturelabsGrunge349M1 from "figma:asset/d5154915c1a6754ca78921085a77f61dc232155a.png";
import imgTexturelabsGrunge355M11 from "figma:asset/c00dd951017282e62210dfc358b3ab7980663cde.png";
import { imgButtonContainer } from "./svg-tc1ky";

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
        <p className="leading-[normal] whitespace-pre">credits</p>
      </div>
    </div>
  );
}

function PopUp() {
  return (
    <div className="absolute h-[586px] left-0 top-0 w-[905px]" data-name="pop up">
      <Setting />
    </div>
  );
}

function ButtomCloseActive() {
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
      <ButtomCloseActive />
      <div className="absolute capitalize font-['Inter:Regular',_sans-serif] font-normal leading-[normal] left-[45px] not-italic text-[25px] text-nowrap text-white top-[102px] whitespace-pre">
        <p className="mb-0">
          Idea
          <br aria-hidden="true" />
          {` Ismael Scorzelli`}
          <br aria-hidden="true" />
          {` Simón Villafañe`}
        </p>
        <p className="mb-0">&nbsp;</p>
        <p className="mb-0">
          Programming
          <br aria-hidden="true" />
          {` Ismael Scorzelli`}
          <br aria-hidden="true" />
          {` Simón Villafañe`}
        </p>
        <p className="mb-0">&nbsp;</p>
        <p className="mb-0">
          {`Design & Prototyping`}
          <br aria-hidden="true" />
          {` Ismael Scorzelli`}
          <br aria-hidden="true" />
          {` Simón Villafañe`}
        </p>
        <p>
          {` Figma Make`}
          <br aria-hidden="true" />
          <br aria-hidden="true" />
        </p>
      </div>
      <div className="absolute capitalize font-['Inter:Regular',_sans-serif] font-normal leading-[normal] left-[343px] not-italic text-[25px] text-nowrap text-white top-[102px] whitespace-pre">
        <p className="mb-0">
          {`Music & Audio`}
          <br aria-hidden="true" />
          {` Ismael Scorzelli`}
        </p>
        <p className="mb-0">{` pixabay`}</p>
        <p className="mb-0">&nbsp;</p>
        <p className="mb-0">
          {`Art & Animation`}
          <br aria-hidden="true" />
          {` Simón Villafañe`}
          <br aria-hidden="true" />
          {` Ismael Scorzelli`}
        </p>
        <p className="mb-0">
          <br aria-hidden="true" />
          {`Narrative & Concept`}
          <br aria-hidden="true" />
          {` Ismael Scorzelli`}
          <br aria-hidden="true" />
          {` Simón Villafañe`}
          <br aria-hidden="true" />
          <br aria-hidden="true" />
        </p>
        <p>&nbsp;</p>
      </div>
      <div className="absolute blur-[7.6px] capitalize filter font-['Inter:Regular',_sans-serif] font-normal leading-[0] left-[609px] not-italic text-[25px] text-nowrap text-white top-[102px]">
        <p className="leading-[normal] whitespace-pre">
          {`Testing & Balancing`}
          <br aria-hidden="true" />
          {` Ismael Scorzelli`}
          <br aria-hidden="true" />
          {` Simón Villafañe`}
        </p>
      </div>
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
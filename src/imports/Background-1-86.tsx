import imgSinTitulo11 from "figma:asset/7eb17cbfe4b61d4bc89ae19fd78b90ad5518e9d9.png";
import imgTexturelabsGrunge349M1 from "figma:asset/d5154915c1a6754ca78921085a77f61dc232155a.png";
import imgTexturelabsGrunge355M11 from "figma:asset/c00dd951017282e62210dfc358b3ab7980663cde.png";
import { imgButtonContainer } from "./svg-y2ro4";

function ButtonContainer() {
  return (
    <div className="absolute h-[73px] left-[84px] top-[726px] w-[354px]" data-name="Button Container">
      <div className="absolute inset-[-88.08%_-17.88%_-89.45%_-18.16%]">
        <img className="block max-w-none size-full" src={imgButtonContainer} />
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
      <div className="absolute capitalize font-['Inter:Regular',_sans-serif] font-normal leading-[0] left-[98px] not-italic text-[45.277px] text-nowrap text-white top-[735px]">
        <p className="leading-[normal] whitespace-pre">play</p>
      </div>
      <div className="absolute capitalize font-['Inter:Regular',_sans-serif] font-normal leading-[0] left-[98px] not-italic text-[45.277px] text-nowrap text-white top-[818px]">
        <p className="leading-[normal] whitespace-pre">setting</p>
      </div>
      <div className="absolute capitalize font-['Inter:Regular',_sans-serif] font-normal leading-[0] left-[98px] not-italic text-[45.277px] text-nowrap text-white top-[901px]">
        <p className="leading-[normal] whitespace-pre">credits</p>
      </div>
      <div className="absolute bg-center bg-cover bg-no-repeat h-[1531px] left-0 opacity-70 top-[-214px] w-[1920px]" data-name="Texturelabs_Grunge_355M (1) 1" style={{ backgroundImage: `url('${imgTexturelabsGrunge355M11}')` }} />
    </div>
  );
}
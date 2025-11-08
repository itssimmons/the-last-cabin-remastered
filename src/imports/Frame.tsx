import { imgButtonContainer, imgFrame12, imgLine2 } from "./svg-mv9ey";

function ButtonContainer() {
  return (
    <div className="absolute h-[31px] top-[50px] translate-x-[-50%] w-[703px]" data-name="Button Container" style={{ left: "calc(50% - 0.5px)" }}>
      <div className="absolute inset-[-55.16%_-2.43%]">
        <img className="block max-w-none size-full" src={imgButtonContainer} />
      </div>
    </div>
  );
}

function Frame12() {
  return (
    <div className="absolute bottom-[50px] content-stretch flex flex-col gap-[5.125px] h-[132px] items-start justify-start mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[0px_40px] mask-size-[48px_92px] right-[50px] w-12" style={{ maskImage: `url('${imgFrame12}')` }}>
      <div className="bg-[#9d9d9d] h-3 relative shrink-0 w-full">
        <div aria-hidden="true" className="absolute border-0 border-black border-solid inset-0 pointer-events-none" />
      </div>
      <div className="bg-[#9d9d9d] h-3 relative shrink-0 w-full">
        <div aria-hidden="true" className="absolute border-0 border-black border-solid inset-0 pointer-events-none" />
      </div>
      <div className="bg-[#9d9d9d] h-3 relative shrink-0 w-full">
        <div aria-hidden="true" className="absolute border-0 border-black border-solid inset-0 pointer-events-none" />
      </div>
      <div className="bg-[#9d9d9d] h-3 relative shrink-0 w-full">
        <div aria-hidden="true" className="absolute border-0 border-black border-solid inset-0 pointer-events-none" />
      </div>
      <div className="bg-[#9d9d9d] h-3 relative shrink-0 w-full">
        <div aria-hidden="true" className="absolute border-0 border-black border-solid inset-0 pointer-events-none" />
      </div>
      <div className="bg-[#9d9d9d] h-3 relative shrink-0 w-full">
        <div aria-hidden="true" className="absolute border-0 border-black border-solid inset-0 pointer-events-none" />
      </div>
      <div className="bg-[#9d9d9d] h-3 relative shrink-0 w-full">
        <div aria-hidden="true" className="absolute border-0 border-black border-solid inset-0 pointer-events-none" />
      </div>
      <div className="bg-[#9d9d9d] h-3 relative shrink-0 w-full">
        <div aria-hidden="true" className="absolute border-0 border-black border-solid inset-0 pointer-events-none" />
      </div>
    </div>
  );
}

function MaskGroup() {
  return (
    <div className="absolute contents left-[1822px] top-[938px]" data-name="Mask group">
      <Frame12 />
    </div>
  );
}

function Frame13() {
  return (
    <div className="absolute bottom-[50px] content-stretch flex flex-col gap-[5.125px] h-[132px] items-start justify-start right-[50px] w-12">
      <div className="bg-[rgba(255,255,255,0.18)] h-3 relative shrink-0 w-full">
        <div aria-hidden="true" className="absolute border border-black border-solid inset-[-0.5px] pointer-events-none" />
      </div>
      <div className="bg-[rgba(255,255,255,0.18)] h-3 relative shrink-0 w-full">
        <div aria-hidden="true" className="absolute border border-black border-solid inset-[-0.5px] pointer-events-none" />
      </div>
      <div className="bg-[rgba(255,255,255,0.18)] h-3 relative shrink-0 w-full">
        <div aria-hidden="true" className="absolute border border-black border-solid inset-[-0.5px] pointer-events-none" />
      </div>
      <div className="bg-[rgba(255,255,255,0.18)] h-3 relative shrink-0 w-full">
        <div aria-hidden="true" className="absolute border border-black border-solid inset-[-0.5px] pointer-events-none" />
      </div>
      <div className="bg-[rgba(255,255,255,0.18)] h-3 relative shrink-0 w-full">
        <div aria-hidden="true" className="absolute border border-black border-solid inset-[-0.5px] pointer-events-none" />
      </div>
      <div className="bg-[rgba(255,255,255,0.18)] h-3 relative shrink-0 w-full">
        <div aria-hidden="true" className="absolute border border-black border-solid inset-[-0.5px] pointer-events-none" />
      </div>
      <div className="bg-[rgba(255,255,255,0.18)] h-3 relative shrink-0 w-full">
        <div aria-hidden="true" className="absolute border border-black border-solid inset-[-0.5px] pointer-events-none" />
      </div>
      <div className="bg-[rgba(255,255,255,0.18)] h-3 relative shrink-0 w-full">
        <div aria-hidden="true" className="absolute border border-black border-solid inset-[-0.5px] pointer-events-none" />
      </div>
    </div>
  );
}

function AudioDetection() {
  return (
    <div className="absolute contents left-[1822px] top-[898px]" data-name="AudioDetection">
      <MaskGroup />
      <Frame13 />
    </div>
  );
}

export default function Frame() {
  return (
    <div className="bg-black relative size-full" data-name="Frame">
      <div className="absolute flex h-[656px] items-center justify-center left-1/2 translate-x-[-50%] translate-y-[-50%] w-[0px]" style={{ top: "calc(50% + 48px)" }}>
        <div className="flex-none rotate-[90deg]">
          <div className="h-0 relative w-[656px]">
            <div className="absolute inset-[-8.3px_-1.11%_-7.3px_-1.11%]">
              <img className="block max-w-none size-full" src={imgLine2} />
            </div>
          </div>
        </div>
      </div>
      <ButtonContainer />
      <AudioDetection />
    </div>
  );
}
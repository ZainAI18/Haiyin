"use client";
import type { ObjectId } from "@/lib/domain";
import type { ViewerProps } from "./visual-types";
const positions: Record<ObjectId,[number,number]> = {
  hull:[365,238], bow:[622,249], stern:[154,249], rudder:[122,287], "rudder-stock":[127,257],
  propeller:[172,284], "propeller-boss":[174,282], shaft:[196,273], anchor:[582,225], "sea-chest":[276,266],
  "bilge-keel":[406,264], anodes:[236,272], deck:[389,214],
};
const markers: ObjectId[] = ["rudder","propeller","anchor","bilge-keel","sea-chest"];
export function Diagram({scene,target,overlay,stage=0,onPick}: ViewerProps) {
  const pos = target && positions[target];
  const shipY = scene === "dry-dock" ? [-33,-15,0,0][stage]
    : scene === "floating-dock" ? [-25,-25,-59,-76][stage]
    : scene === "synchrolift" ? [-25,-25,-59,-59][stage] : 0;
  const shipX = scene === "floating-dock" ? [85,0,0,0][stage]
    : scene === "synchrolift" ? [-70,0,0,55][stage] : 0;
  const waterY = scene === "dry-dock" ? [209,245,358,358][stage] : 217;
  const floatingDeckY = [309,309,245,228][stage];
  const liftDeckY = [303,303,245,245][stage];
  return <svg className="diagram" viewBox="0 65 760 330" role={onPick ? "group" : "img"} aria-label={scene ? "Docking process profile diagram" : "Ship profile diagram"}>
    <defs><pattern id="diagram-grid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M28 0H0v28" fill="none" stroke="#2e4c59" strokeWidth=".7"/></pattern></defs>
    <rect width="760" height="420" fill="url(#diagram-grid)"/>
    {scene && <g>
      <rect y={waterY} width="760" height={395-waterY} fill="#277695" opacity=".35"/>
      <path d="M0 354H70V369H695V354H760V395H0Z" fill="#354b55" stroke="#688089"/>
      {scene === "dry-dock" && <path d={"M43 355v-150h15v150" + (stage>0 ? "M700 355v-150h15v150" : "")} fill="#5f7780" stroke="#688089"/>}
      {scene === "floating-dock" && <g transform={`translate(0 ${floatingDeckY})`}>
        <path d="M54 -80H89V0H671V-80H706V24H54Z" fill="#617d87" stroke="#a6b6b4"/>
        {[233,323,413,503].map(x => <rect key={x} x={x} y="-10" width="26" height="10" fill="#a38d72"/>)}
      </g>}
      {scene === "synchrolift" && <>
        <path d="M90 350V150h18v200m524 0V150h18v200" fill="#627d85"/>
        <path d={`M100 152V${liftDeckY} M641 152V${liftDeckY}`} stroke="#e8af70" strokeWidth="2" fill="none"/>
        <rect x="94" y={liftDeckY} width="552" height="10" fill="#708f98"/>
        <rect x="646" y="245" width="114" height="10" fill="#708f98"/>
        {[233,323,413,503].map(x => <rect key={x} x={x + (stage === 3 ? shipX : 0)} y={liftDeckY-10} width="26" height="10" fill="#a38d72"/>)}
      </>}
      {scene === "dry-dock" && Array.from({length: 8}, (_,i) => <rect key={i} x={233+i*45} y="294" width="28" height="75" fill="#a38d72"/>)}
    </g>}
    <g transform={`translate(${shipX} ${shipY})`}>
      <path d="M114 211H568l62-15q-7 37-27 61l-43 37H216l-55-27-42-11z" fill="#944e3a" stroke="#9cafb0"/>
      <path d="M114 211H568l62-15q-6 30-18 43H116z" fill="#174259" stroke="#8ca3a9"/>
      <path d="M203 210v-38h72v37m-65-39v-15h50v15m-31-17v-24h9v24" fill="#bcc9c7" stroke="#8da5ab" strokeWidth="2"/>
      <path d="M216 162h36m-37 19h49m64 32v-10h73v10m20 0v-10h73v10" fill="none" stroke="#6e909b" strokeWidth="3"/>
      <path d="M119 258l23 3-3 45h-23z" fill="#a45a46" stroke="#b77e68"/>
      <path d="M172 272l5-8 6 3-4 15 7 9-6 6-10-10z" fill="#dda65d"/>
      <path d="M582 214v21m-11-8q10 21 22 0" fill="none" stroke="#c2a777" strokeWidth="3"/>
      <path d="M267 262h19m-18 4h18m-17 4h16m89-6h77" fill="none" stroke="#54362c" strokeWidth="3"/>
      {scene === "dry-dock" && stage === 3 && (["hull", "rudder", "propeller"] as const).map(id => (
        <circle key={id} cx={positions[id][0]} cy={positions[id][1]} r="7" fill="#ffd187" stroke="#183745" strokeWidth="2">
          <title>{id}</title>
        </circle>
      ))}
      {!scene && <>
        <path d="M95 320H647 M95 315v10m552-10v10" fill="none" stroke="#6d8995" strokeDasharray="4 5"/>
        <text x="93" y="344">AFT / 船尾</text><text x="650" y="344" textAnchor="end">FWD / 船首</text>
        {(pos && overlay) && <g transform={"translate("+pos[0]+" "+pos[1]+")"} stroke="#f7b578" fill="none" strokeWidth="3">
          {overlay === "crack" ? <path d="M-13-5l8 7 8-4 9 9"/> : overlay === "dent" ? <><ellipse rx="15" ry="8"/><ellipse rx="10" ry="4"/></> : <>{[-9,-4,2,8].map((x,i)=><circle key={x} cx={x} cy={i%2?4:-3} r={i%2?2:3}/>)}</>}
        </g>}
        {(pos && !markers.includes(target!)) && <circle cx={pos[0]} cy={pos[1]} r="12" fill="none" stroke="#ffbd7e" strokeWidth="2"/>}
        {markers.map(id => { const [x,y]=positions[id]; return <g key={id} className={onPick ? "diagram-pick" : undefined} role={onPick ? "button" : undefined} aria-label={id} tabIndex={onPick ? 0 : undefined}
          onClick={() => onPick?.(id)} onKeyDown={e => { if (onPick && ["Enter"," "].includes(e.key)) { e.preventDefault(); onPick(id); } }}>
          <circle cx={x} cy={y} r="12" stroke={id===target ? "#ffc087" : "#7798a3"} fill={id===target ? "#8e533a" : "#183745"}/>
          <circle cx={x} cy={y} r="3" fill={id===target ? "#ffd19d" : "#d0e1e2"}/></g>; })}
      </>}
    </g>
  </svg>;
}

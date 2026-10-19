import type { PetDesign, RoomSlot } from "../../lib/types";

const INK = "#3D3A37";

function starPath(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join("L")}Z`;
}

function Wallpaper({ id }: { id: string | undefined }) {
  if (id === "wall-stars") {
    return (
      <g>
        <rect width={320} height={180} fill="#F0EAFC" />
        {[...Array(18)].map((_, i) => (
          <path
            key={i}
            d={starPath(24 + (i % 6) * 54, 26 + Math.floor(i / 6) * 46, 7)}
            fill="#C9B8F0"
            opacity={0.6}
          />
        ))}
      </g>
    );
  }
  if (id === "wall-rainbow") {
    const colors = ["#FFE9E6", "#FFF6D9", "#E3F7EE", "#E9F5FC", "#F0EAFC"];
    return (
      <g>
        <rect width={320} height={180} fill="#FFFFFF" />
        {colors.map((c, i) => (
          <rect key={c} x={i * 64} width={64} height={180} fill={c} />
        ))}
      </g>
    );
  }
  return <rect width={320} height={180} fill="#E3F7EE" />;
}

function Floor({ id }: { id: string | undefined }) {
  if (id === "floor-carpet") {
    return (
      <g>
        <rect y={180} width={320} height={60} fill="#C9B8F0" />
        <rect y={186} x={14} width={292} height={48} rx={10} fill="#AB93E6" />
        <rect
          y={186}
          x={14}
          width={292}
          height={48}
          rx={10}
          fill="none"
          stroke="#F0EAFC"
          strokeWidth={3}
          strokeDasharray="10 8"
        />
      </g>
    );
  }
  return (
    <g>
      <rect y={180} width={320} height={60} fill="#FFD3B6" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line key={i} x1={i * 60} y1={180} x2={i * 60 - 24} y2={240} stroke="#FFBA8F" strokeWidth={4} />
      ))}
      <line x1={0} y1={182} x2={320} y2={182} stroke={INK} strokeWidth={2.5} />
    </g>
  );
}

function Poster({ id }: { id: string | undefined }) {
  if (id === "poster-space") {
    return (
      <g>
        <rect x={196} y={28} width={96} height={72} rx={8} fill="#2A2E4A" stroke={INK} strokeWidth={3} />
        <circle cx={258} cy={56} r={14} fill="#FFB3AB" />
        <circle cx={224} cy={82} r={4} fill="#FFE38A" />
        <circle cx={244} cy={44} r={3} fill="#FFFFFF" />
        <circle cx={276} cy={84} r={3} fill="#FFFFFF" />
        <path d="M204 26 L204 104 M204 26 L288 26" stroke="#AB93E6" strokeWidth={4} />
      </g>
    );
  }
  return (
    <g>
      <rect x={36} y={30} width={96} height={72} rx={8} fill="#FFFFFF" stroke={INK} strokeWidth={3} />
      <text x={58} y={72} fontSize={30} fontWeight="bold" fill="#6D4FC2" fontFamily="monospace">
        2+2
      </text>
      <text x={104} y={72} fontSize={26} fill="#3D3A37">
        =
      </text>
      <path d="M36 26 L36 106 M36 26 L132 26" stroke="#7ED4B4" strokeWidth={4} />
    </g>
  );
}

function Toy({ id }: { id: string | undefined }) {
  if (id === "toy-bear") {
    return (
      <g>
        <circle cx={54} cy={214} r={16} fill="#FFBA8F" stroke={INK} strokeWidth={2.5} />
        <circle cx={45} cy={202} r={6} fill="#FFBA8F" stroke={INK} strokeWidth={2} />
        <circle cx={63} cy={202} r={6} fill="#FFBA8F" stroke={INK} strokeWidth={2} />
        <circle cx={50} cy={212} r={2} fill={INK} />
        <circle cx={58} cy={212} r={2} fill={INK} />
        <ellipse cx={54} cy={219} rx={5} ry={3.5} fill="#FFEEE1" />
      </g>
    );
  }
  return (
    <g>
      <circle cx={54} cy={212} r={16} fill="#A6D8F0" stroke={INK} strokeWidth={2.5} />
      <path d="M40 206 A16 16 0 0 1 68 206 A24 24 0 0 0 40 206 Z" fill="#FFB3AB" />
      <circle cx={54} cy={212} r={4} fill="#FFFFFF" opacity={0.8} />
    </g>
  );
}

function Lamp({ id }: { id: string | undefined }) {
  if (id === "lamp-moon") {
    return (
      <g>
        <line x1={286} y1={0} x2={286} y2={30} stroke={INK} strokeWidth={3} />
        <path d="M286 66 A20 20 0 1 1 286 34 A14 14 0 1 0 286 66 Z" fill="#FFE38A" stroke={INK} strokeWidth={2.5} />
        <circle cx={286} cy={50} r={30} fill="#FFE38A" opacity={0.25} />
      </g>
    );
  }
  return (
    <g>
      <line x1={286} y1={0} x2={286} y2={32} stroke={INK} strokeWidth={3} />
      <path d="M286 34 L262 62 L310 62 Z" fill="#FFD45E" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <circle cx={286} cy={52} r={30} fill="#FFE38A" opacity={0.25} />
    </g>
  );
}

function Mascot({ design }: { design: PetDesign | null }) {
  if (!design) return null;
  const colors: Record<string, string> = {
    mint: "#A8E6CF",
    lavender: "#C9B8F0",
    peach: "#FFD3B6",
    sunny: "#FFE38A",
    coral: "#FFB3AB",
    sky: "#A6D8F0",
  };
  const main = colors[design.color] ?? "#A8E6CF";
  return (
    <g transform="translate(120 168) scale(0.9)">
      {design.body === "blob" ? (
        <rect width={44} height={40} rx={18} fill={main} stroke={INK} strokeWidth={2.5} />
      ) : (
        <g>
          <circle cx={12} cy={26} r={11} fill={main} stroke={INK} strokeWidth={2.5} />
          <circle cx={32} cy={26} r={11} fill={main} stroke={INK} strokeWidth={2.5} />
          <circle cx={22} cy={18} r={13} fill={main} stroke={INK} strokeWidth={2.5} />
        </g>
      )}
      {design.eyes === "happy" ? (
        <g fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round">
          <path d="M14 18 Q17 15 20 18" />
          <path d="M24 18 Q27 15 30 18" />
        </g>
      ) : (
        <g>
          <circle cx={16} cy={18} r={2.4} fill={INK} />
          <circle cx={28} cy={18} r={2.4} fill={INK} />
        </g>
      )}
      <path d="M18 25 Q22 28 26 25" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

export interface RoomSceneProps {
  room: Partial<Record<RoomSlot, string>>;
  size?: number;
  petName?: string;
  customPet?: PetDesign | null;
  className?: string;
}

/** Комната героя: обои, пол, постер, игрушка, светильник + питомец. */
export function RoomScene({ room, size = 340, petName, customPet = null, className }: RoomSceneProps) {
  return (
    <svg
      viewBox="0 0 320 240"
      width={size}
      height={(Number(size) * 240) / 320 || size}
      role="img"
      aria-label="Комната героя"
      className={className}
    >
      <Wallpaper id={room.wallpaper} />
      <Floor id={room.floor} />
      <Poster id={room.poster} />
      <Lamp id={room.lamp} />
      <Toy id={room.toy} />
      <Mascot design={customPet} />
      {petName && (
        <text x={142} y={232} fontSize={13} fontWeight="bold" fill={INK}>
          {petName}
        </text>
      )}
    </svg>
  );
}

export default RoomScene;

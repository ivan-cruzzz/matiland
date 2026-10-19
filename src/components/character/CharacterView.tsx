import { useId } from "react";
import type {
  BaseColor,
  BaseId,
  CharColor,
  PetDesign,
  SlotId,
} from "../../lib/types";

const INK = "#3D3A37";

interface Palette {
  main: string;
  dark: string;
  soft: string;
  /** Заливка тела: цвет или градиент. */
  fill?: (id: string) => string;
}

const CHAR_COLORS: Record<CharColor, Palette> = {
  mint: { main: "#A8E6CF", dark: "#7ED4B4", soft: "#E3F7EE" },
  lavender: { main: "#C9B8F0", dark: "#AB93E6", soft: "#F0EAFC" },
  peach: { main: "#FFD3B6", dark: "#FFBA8F", soft: "#FFEEE1" },
  sunny: { main: "#FFE38A", dark: "#FFD45E", soft: "#FFF6D9" },
  coral: { main: "#FFB3AB", dark: "#FF948A", soft: "#FFE9E6" },
  sky: { main: "#A6D8F0", dark: "#7FC2E6", soft: "#E9F5FC" },
  golden: { main: "#F9C440", dark: "#E0A81E", soft: "#FFF3D1" },
  rainbow: {
    main: "#C9B8F0",
    dark: "#AB93E6",
    soft: "#F3EFFF",
    fill: (id) => `url(#${id}-rb)`,
  },
};

const CHAR_COLOR_LIST: BaseColor[] = ["mint", "lavender", "peach", "sunny", "coral", "sky"];

const CHAR_COLOR_NAMES: Record<CharColor, string> = {
  mint: "Мятный",
  lavender: "Лавандовый",
  peach: "Персиковый",
  sunny: "Солнечный",
  coral: "Коралловый",
  sky: "Небесный",
  golden: "Золотой",
  rainbow: "Радужный",
};

const BASE_NAMES: Record<BaseId, string> = {
  cat: "Котик",
  bunny: "Зайчик",
  robot: "Робот",
  dragon: "Дракончик",
  alien: "Инопланетянин",
};

export type Mood = "happy" | "sad" | "wow" | "neutral";

/** Путь пятиконечной звезды вокруг точки. */
function starPath(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join("L")}Z`;
}

function Face({ mood }: { mood: Mood }) {
  return (
    <g>
      {mood === "happy" ? (
        <g fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round">
          <path d="M84 120 Q90 113 96 120" />
          <path d="M124 120 Q130 113 136 120" />
        </g>
      ) : mood === "wow" ? (
        <g>
          <circle cx={90} cy={121} r={8} fill="#FFFFFF" stroke={INK} strokeWidth={2.5} />
          <circle cx={130} cy={121} r={8} fill="#FFFFFF" stroke={INK} strokeWidth={2.5} />
          <circle cx={90} cy={121} r={3.5} fill={INK} />
          <circle cx={130} cy={121} r={3.5} fill={INK} />
        </g>
      ) : (
        <g>
          <circle cx={90} cy={122} r={5.5} fill={INK} />
          <circle cx={130} cy={122} r={5.5} fill={INK} />
          {mood === "sad" && (
            <g stroke={INK} strokeWidth={2.5} strokeLinecap="round">
              <path d="M83 112 L96 116" fill="none" />
              <path d="M137 112 L124 116" fill="none" />
            </g>
          )}
        </g>
      )}
      <ellipse cx={74} cy={134} rx={7} ry={4.5} fill="#FFB3AB" opacity={0.8} />
      <ellipse cx={146} cy={134} rx={7} ry={4.5} fill="#FFB3AB" opacity={0.8} />
      {mood === "sad" ? (
        <path d="M100 148 Q110 140 120 148" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      ) : mood === "wow" ? (
        <ellipse cx={110} cy={145} rx={6} ry={7.5} fill={INK} />
      ) : (
        <path d="M98 140 Q110 150 122 140" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      )}
    </g>
  );
}

function Feet({ dark }: { dark: string }) {
  return (
    <g>
      <ellipse cx={88} cy={194} rx={13} ry={8} fill={dark} stroke={INK} strokeWidth={3} />
      <ellipse cx={132} cy={194} rx={13} ry={8} fill={dark} stroke={INK} strokeWidth={3} />
    </g>
  );
}

interface ArtProps {
  c: Palette;
  bodyFill?: string;
  mood: Mood;
}

function BodyRect({ c, fill, rx }: { c: Palette; fill: string; rx: number }) {
  return (
    <g>
      <rect x={62} y={76} width={96} height={118} rx={rx} fill={fill} stroke={INK} strokeWidth={3} />
      <ellipse cx={110} cy={158} rx={30} ry={24} fill={c.soft} />
    </g>
  );
}

/* ---------- Базовые персонажи ---------- */

function CatArt({ c, bodyFill, mood }: ArtProps) {
  const fill = bodyFill ?? c.main;
  return (
    <g>
      <path d="M158 172 Q188 170 182 142" fill="none" stroke={INK} strokeWidth={13} strokeLinecap="round" />
      <path d="M158 172 Q188 170 182 142" fill="none" stroke={c.dark} strokeWidth={7} strokeLinecap="round" />
      <path d="M74 86 L64 46 L104 74 Z" fill={fill} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <path d="M146 86 L156 46 L116 74 Z" fill={fill} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <path d="M78 76 L73 58 L93 72 Z" fill={c.soft} />
      <path d="M142 76 L147 58 L127 72 Z" fill={c.soft} />
      <BodyRect c={c} fill={fill} rx={46} />
      <Face mood={mood} />
      <g stroke={INK} strokeWidth={2.5} strokeLinecap="round">
        <path d="M46 118 L64 121" fill="none" />
        <path d="M46 132 L64 131" fill="none" />
        <path d="M174 118 L156 121" fill="none" />
        <path d="M174 132 L156 131" fill="none" />
      </g>
      <Feet dark={c.dark} />
    </g>
  );
}

function BunnyArt({ c, bodyFill, mood }: ArtProps) {
  const fill = bodyFill ?? c.main;
  return (
    <g>
      <ellipse cx={88} cy={38} rx={15} ry={40} fill={fill} stroke={INK} strokeWidth={3} />
      <ellipse cx={132} cy={38} rx={15} ry={40} fill={fill} stroke={INK} strokeWidth={3} />
      <ellipse cx={88} cy={42} rx={7} ry={28} fill={c.soft} />
      <ellipse cx={132} cy={42} rx={7} ry={28} fill={c.soft} />
      <BodyRect c={c} fill={fill} rx={46} />
      <Face mood={mood} />
      <Feet dark={c.dark} />
    </g>
  );
}

function RobotArt({ c, bodyFill, mood }: ArtProps) {
  const fill = bodyFill ?? c.main;
  return (
    <g>
      <line x1={110} y1={76} x2={110} y2={44} stroke={INK} strokeWidth={3} />
      <circle cx={110} cy={37} r={8} fill="#FF948A" stroke={INK} strokeWidth={3} />
      <rect x={62} y={76} width={96} height={118} rx={30} fill={fill} stroke={INK} strokeWidth={3} />
      <rect x={74} y={100} width={72} height={52} rx={18} fill="#FFFFFF" stroke={INK} strokeWidth={3} />
      <circle cx={96} cy={120} r={6} fill={INK} />
      <circle cx={124} cy={120} r={6} fill={INK} />
      <path d="M98 138 Q110 146 122 138" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <circle cx={70} cy={168} r={4.5} fill={c.dark} stroke={INK} strokeWidth={2} />
      <circle cx={150} cy={168} r={4.5} fill={c.dark} stroke={INK} strokeWidth={2} />
      <rect x={80} y={192} width={24} height={11} rx={5.5} fill={c.dark} stroke={INK} strokeWidth={3} />
      <rect x={116} y={192} width={24} height={11} rx={5.5} fill={c.dark} stroke={INK} strokeWidth={3} />
      {mood === "sad" && <path d="M74 96 L86 92 M146 96 L134 92" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />}
    </g>
  );
}

function DragonArt({ c, bodyFill, mood }: ArtProps) {
  const fill = bodyFill ?? c.main;
  return (
    <g>
      <path d="M64 112 Q28 84 38 124 Q44 150 68 144 Z" fill={c.dark} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <path d="M156 112 Q192 84 182 124 Q176 150 152 144 Z" fill={c.dark} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <path d="M86 80 L78 50 L104 74 Z" fill={c.soft} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <path d="M134 80 L142 50 L116 74 Z" fill={c.soft} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <g>
        <rect x={62} y={76} width={96} height={118} rx={46} fill={fill} stroke={INK} strokeWidth={3} />
        <ellipse cx={110} cy={156} rx={32} ry={26} fill={c.soft} />
      </g>
      <Face mood={mood} />
      <Feet dark={c.dark} />
    </g>
  );
}

function AlienArt({ c, bodyFill, mood }: ArtProps) {
  const fill = bodyFill ?? c.main;
  return (
    <g>
      <path d="M88 80 Q78 50 62 46" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <circle cx={60} cy={45} r={6} fill={c.dark} stroke={INK} strokeWidth={2.5} />
      <path d="M132 80 Q142 50 158 46" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <circle cx={160} cy={45} r={6} fill={c.dark} stroke={INK} strokeWidth={2.5} />
      <ellipse cx={110} cy={136} rx={52} ry={62} fill={fill} stroke={INK} strokeWidth={3} />
      <ellipse cx={110} cy={162} rx={30} ry={22} fill={c.soft} />
      <Face mood={mood} />
      <Feet dark={c.dark} />
    </g>
  );
}

const BASE_ART: Record<BaseId, (p: ArtProps) => React.ReactElement> = {
  cat: CatArt,
  bunny: BunnyArt,
  robot: RobotArt,
  dragon: DragonArt,
  alien: AlienArt,
};

/* ---------- Шапки ---------- */

const HAT_ART: Record<string, React.ReactElement> = {
  "hat-cap": (
    <g>
      <path d="M72 82 A38 38 0 0 1 148 82 L148 88 L72 88 Z" fill="#A6D8F0" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <rect x={140} y={76} width={40} height={13} rx={6.5} fill="#7FC2E6" stroke={INK} strokeWidth={3} />
      <circle cx={110} cy={46} r={5} fill="#E9F5FC" stroke={INK} strokeWidth={2.5} />
    </g>
  ),
  "hat-party": (
    <g>
      <path d="M110 16 L138 82 L82 82 Z" fill="#FFB3AB" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <path d="M96 52 L124 52 M89 68 L131 68" stroke="#FFE9E6" strokeWidth={5} strokeLinecap="round" />
      <circle cx={110} cy={14} r={8} fill="#FFE38A" stroke={INK} strokeWidth={3} />
    </g>
  ),
  "hat-flower": (
    <g>
      {[
        [88, 42],
        [106, 55],
        [99, 76],
        [77, 76],
        [70, 55],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={10} fill="#FFB3AB" stroke={INK} strokeWidth={2.5} />
      ))}
      <circle cx={88} cy={60} r={8.5} fill="#FFD45E" stroke={INK} strokeWidth={2.5} />
    </g>
  ),
  "hat-phones": (
    <g>
      <path d="M64 100 Q64 40 110 40 Q156 40 156 100" fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />
      <path d="M64 100 Q64 40 110 40 Q156 40 156 100" fill="none" stroke="#7FC2E6" strokeWidth={3.5} strokeLinecap="round" />
      <rect x={52} y={92} width={22} height={32} rx={11} fill="#A6D8F0" stroke={INK} strokeWidth={3} />
      <rect x={146} y={92} width={22} height={32} rx={11} fill="#A6D8F0" stroke={INK} strokeWidth={3} />
    </g>
  ),
  "hat-wizard": (
    <g>
      <path d="M110 10 L142 78 L78 78 Z" fill="#C9B8F0" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <ellipse cx={110} cy={80} rx={48} ry={12} fill="#AB93E6" stroke={INK} strokeWidth={3} />
      <path d={starPath(110, 48, 10)} fill="#FFE38A" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
    </g>
  ),
  "hat-crown": (
    <g>
      <path d="M78 82 L74 42 L94 60 L110 36 L126 60 L146 42 L142 82 Z" fill="#FFD45E" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <circle cx={74} cy={42} r={4.5} fill="#FF948A" stroke={INK} strokeWidth={2} />
      <circle cx={110} cy={36} r={4.5} fill="#FF948A" stroke={INK} strokeWidth={2} />
      <circle cx={146} cy={42} r={4.5} fill="#FF948A" stroke={INK} strokeWidth={2} />
    </g>
  ),
  "hat-crown-gold": (
    <g>
      <path d="M78 82 L74 42 L94 60 L110 36 L126 60 L146 42 L142 82 Z" fill="#F9C440" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <circle cx={74} cy={42} r={5} fill="#FFF3D1" stroke={INK} strokeWidth={2} />
      <circle cx={110} cy={36} r={5} fill="#FFF3D1" stroke={INK} strokeWidth={2} />
      <circle cx={146} cy={42} r={5} fill="#FFF3D1" stroke={INK} strokeWidth={2} />
    </g>
  ),
  "hat-boat": (
    <g>
      <path d="M78 74 L142 74 L128 52 L92 52 Z" fill="#FFFFFF" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <path d="M110 50 L110 20 L134 50 Z" fill="#A6D8F0" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <path d="M74 74 Q110 90 146 74" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
    </g>
  ),
};

/* ---------- Очки ---------- */

const GLASSES_ART: Record<string, React.ReactElement> = {
  "gl-round": (
    <g>
      <path d="M76 122 L62 118 M144 122 L158 118" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <circle cx={90} cy={122} r={14} fill="rgba(255,255,255,0.5)" stroke={INK} strokeWidth={3} />
      <circle cx={130} cy={122} r={14} fill="rgba(255,255,255,0.5)" stroke={INK} strokeWidth={3} />
      <path d="M104 122 L116 122" stroke={INK} strokeWidth={3} strokeLinecap="round" />
    </g>
  ),
  "gl-sun": (
    <g>
      <path d="M76 120 L60 114 M144 120 L160 114" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <rect x={72} y={110} width={38} height={24} rx={12} fill={INK} />
      <rect x={110} y={110} width={38} height={24} rx={12} fill={INK} />
      <path d="M80 117 L92 117 M118 117 L130 117" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" opacity={0.7} />
      <path d="M110 118 L110 120" stroke={INK} strokeWidth={3} />
    </g>
  ),
  "gl-star": (
    <g>
      <path d="M104 122 L116 122" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <path d={starPath(90, 122, 15)} fill="#FFE38A" opacity={0.9} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <path d={starPath(130, 122, 15)} fill="#FFE38A" opacity={0.9} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
    </g>
  ),
};

/* ---------- За спиной: крылья, плащ, нимб ---------- */

const BACK_ART: Record<string, React.ReactElement> = {
  "back-wings": (
    <g>
      <path d="M66 104 Q18 76 30 122 Q36 152 70 142 Z" fill="#FFFFFF" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <path d="M154 104 Q202 76 190 122 Q184 152 150 142 Z" fill="#FFFFFF" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    </g>
  ),
  "back-wings-rainbow": (
    <g>
      <path d="M66 104 Q18 76 30 122 Q36 152 70 142 Z" fill="#FFB3AB" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <path d="M154 104 Q202 76 190 122 Q184 152 150 142 Z" fill="#A6D8F0" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    </g>
  ),
  "back-cape": (
    <path d="M70 90 Q56 150 74 186 L146 186 Q164 150 150 90 Z" fill="#FF948A" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
  ),
  halo: (
    <g>
      <ellipse cx={110} cy={26} rx={26} ry={9} fill="none" stroke="#FFD45E" strokeWidth={6} />
      <ellipse cx={110} cy={26} rx={26} ry={9} fill="none" stroke={INK} strokeWidth={2} />
    </g>
  ),
};

/* ---------- Для лапки ---------- */

const HAND_ART: Record<string, React.ReactElement> = {
  "hand-flag": (
    <g>
      <line x1={158} y1={120} x2={158} y2={70} stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
      <path d="M158 70 L190 80 L158 92 Z" fill="#7ED4B4" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
    </g>
  ),
  "hand-icecream": (
    <g>
      <path d="M150 128 L168 128 L159 158 Z" fill="#FFD3B6" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <circle cx={155} cy={120} r={9} fill="#FFB3AB" stroke={INK} strokeWidth={2.5} />
      <circle cx={165} cy={122} r={8} fill="#FFF6D9" stroke={INK} strokeWidth={2.5} />
    </g>
  ),
  "hand-wand": (
    <g>
      <line x1={152} y1={140} x2={172} y2={92} stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
      <path d={starPath(178, 82, 12)} fill="#FFE38A" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
    </g>
  ),
};

/* ---------- Узоры на теле ---------- */

const PATTERN_ART: Record<string, React.ReactElement> = {
  "pat-stars": (
    <g fill="#FFFFFF" opacity={0.65}>
      <path d={starPath(92, 100, 8)} />
      <path d={starPath(128, 108, 6)} />
      <path d={starPath(102, 170, 7)} />
      <path d={starPath(134, 182, 5)} />
    </g>
  ),
  "pat-stripes": (
    <g stroke={INK} strokeWidth={7} opacity={0.14} strokeLinecap="round">
      <path d="M70 110 L150 96" />
      <path d="M68 140 L152 126" />
      <path d="M70 170 L150 156" />
    </g>
  ),
  "pat-hearts": (
    <g fill="#FFFFFF" opacity={0.6}>
      <path d="M96 104 c-3-5-11-4-11 2 c0 5 7 9 11 12 c4-3 11-7 11-12 c0-6-8-7-11-2 Z" />
      <path d="M126 152 c-3-5-11-4-11 2 c0 5 7 9 11 12 c4-3 11-7 11-12 c0-6-8-7-11-2 Z" />
    </g>
  ),
};

/* ---------- Питомцы ---------- */

const PET_ART: Record<string, React.ReactElement> = {
  "pet-star": (
    <g>
      <path d={starPath(184, 184, 17)} fill="#FFD45E" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <circle cx={179} cy={181} r={2} fill={INK} />
      <circle cx={189} cy={181} r={2} fill={INK} />
      <path d="M180 188 Q184 191 188 188" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" />
    </g>
  ),
  "pet-chick": (
    <g>
      <circle cx={182} cy={186} r={15} fill="#FFE38A" stroke={INK} strokeWidth={2.5} />
      <path d="M172 188 Q166 184 170 178" fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
      <path d="M196 184 L205 187 L196 190 Z" fill="#FF948A" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      <circle cx={187} cy={182} r={2} fill={INK} />
      <path d="M182 171 L180 166 M186 171 L188 166" stroke={INK} strokeWidth={2} strokeLinecap="round" />
    </g>
  ),
  "pet-snail": (
    <g>
      <path d="M166 198 Q158 198 162 190 Q168 182 178 190 L198 190 Q206 190 204 198 Z" fill="#FFBA8F" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <circle cx={184} cy={180} r={13} fill="#FFD3B6" stroke={INK} strokeWidth={2.5} />
      <path d="M184 172 a8 8 0 1 0 8 8" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" />
      <path d="M166 182 L162 174 M170 180 L167 172" stroke={INK} strokeWidth={2} strokeLinecap="round" />
      <circle cx={162} cy={173} r={2} fill={INK} />
      <circle cx={167} cy={171} r={2} fill={INK} />
    </g>
  ),
  "pet-ghost": (
    <g>
      <path
        d="M170 190 L170 172 Q170 156 184 156 Q198 156 198 172 L198 190 Q194 186 190 190 Q186 194 182 190 Q178 186 170 190 Z"
        fill="#F0EAFC"
        stroke={INK}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <circle cx={179} cy={174} r={2.2} fill={INK} />
      <circle cx={189} cy={174} r={2.2} fill={INK} />
      <ellipse cx={175} cy={180} rx={3} ry={2} fill="#FFB3AB" opacity={0.8} />
      <ellipse cx={193} cy={180} rx={3} ry={2} fill="#FFB3AB" opacity={0.8} />
    </g>
  ),
};

function CustomPetArt({ design }: { design: PetDesign }) {
  const c = CHAR_COLORS[design.color];
  return (
    <g>
      {design.body === "blob" ? (
        <rect x={168} y={168} width={34} height={30} rx={14} fill={c.main} stroke={INK} strokeWidth={2.5} />
      ) : (
        <g>
          <circle cx={178} cy={182} r={9} fill={c.main} stroke={INK} strokeWidth={2.5} />
          <circle cx={192} cy={182} r={9} fill={c.main} stroke={INK} strokeWidth={2.5} />
          <circle cx={185} cy={176} r={10} fill={c.main} stroke={INK} strokeWidth={2.5} />
        </g>
      )}
      {design.eyes === "dot" && (
        <g>
          <circle cx={180} cy={182} r={2} fill={INK} />
          <circle cx={190} cy={182} r={2} fill={INK} />
        </g>
      )}
      {design.eyes === "happy" && (
        <g fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round">
          <path d="M177 182 Q180 179 183 182" />
          <path d="M187 182 Q190 179 193 182" />
        </g>
      )}
      {design.eyes === "star" && (
        <g>
          <path d={starPath(180, 182, 4)} fill="#FFE38A" stroke={INK} strokeWidth={1} />
          <path d={starPath(190, 182, 4)} fill="#FFE38A" stroke={INK} strokeWidth={1} />
        </g>
      )}
      <path
        d={design.eyes === "happy" ? "M181 188 Q185 191 189 188" : "M182 188 Q185 190 188 188"}
        fill="none"
        stroke={INK}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </g>
  );
}

/* ---------- Фоны и рамки (сцена) ---------- */

function BackgroundMint() {
  return (
    <g>
      <rect width={220} height={220} rx={26} fill="#E3F7EE" />
      <path d="M0 168 Q36 150 72 168 T144 168 T216 168 T288 168 V220 H0 Z" fill="#A8E6CF" opacity={0.75} />
      <path d="M0 192 Q36 176 72 192 T144 192 T216 192 T288 192 V220 H0 Z" fill="#7ED4B4" opacity={0.6} />
    </g>
  );
}

function BackgroundLavender() {
  const dots: React.ReactElement[] = [];
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 6; col++) {
      dots.push(
        <circle
          key={`${row}-${col}`}
          cx={18 + col * 37 + (row % 2 ? 18 : 0)}
          cy={20 + row * 36}
          r={6}
          fill="#C9B8F0"
          opacity={0.55}
        />,
      );
    }
  }
  return (
    <g>
      <rect width={220} height={220} rx={26} fill="#F0EAFC" />
      {dots}
    </g>
  );
}

function BackgroundSunny() {
  return (
    <g>
      <rect width={220} height={220} rx={26} fill="#FFF6D9" />
      <g stroke="#FFD45E" strokeWidth={14} strokeLinecap="round" opacity={0.55}>
        <path d="M-10 40 L50 -20" />
        <path d="M30 130 L140 20" />
        <path d="M100 190 L210 80" />
        <path d="M170 240 L250 160" />
      </g>
    </g>
  );
}

function BackgroundPeach() {
  return (
    <g>
      <defs>
        <linearGradient id="bg-peach-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF0DD" />
          <stop offset="100%" stopColor="#FFC9A3" />
        </linearGradient>
      </defs>
      <rect width={220} height={220} rx={26} fill="url(#bg-peach-grad)" />
      <circle cx={110} cy={158} r={36} fill="#FFD45E" opacity={0.9} />
      <path d="M0 176 Q55 160 110 176 T220 176 V220 H0 Z" fill="#FF948A" opacity={0.5} />
    </g>
  );
}

function BackgroundSky() {
  return (
    <g>
      <rect width={220} height={220} rx={26} fill="#DFF0FB" />
      <rect width={220} height={110} rx={26} fill="#A6D8F0" opacity={0.8} />
      <path d={starPath(40, 36, 9)} fill="#FFF6D9" />
      <path d={starPath(120, 22, 6)} fill="#FFF6D9" />
      <path d={starPath(178, 48, 7)} fill="#FFF6D9" />
      <path d={starPath(84, 66, 5)} fill="#FFF6D9" opacity={0.8} />
      <circle cx={30} cy={160} r={5} fill="#FFFFFF" opacity={0.9} />
      <circle cx={190} cy={186} r={7} fill="#FFFFFF" opacity={0.9} />
      <circle cx={70} cy={200} r={4} fill="#FFFFFF" opacity={0.9} />
    </g>
  );
}

function BackgroundMeadow() {
  return (
    <g>
      <rect width={220} height={220} rx={26} fill="#E9F9EF" />
      <rect y={140} width={220} height={80} rx={26} fill="#A8E6CF" />
      {[30, 70, 110, 150, 190].map((x, i) => (
        <g key={x}>
          <line x1={x} y1={190} x2={x} y2={172} stroke="#7ED4B4" strokeWidth={3} />
          <circle
            cx={x}
            cy={168}
            r={6}
            fill={["#FFB3AB", "#FFE38A", "#C9B8F0", "#A6D8F0", "#FFD3B6"][i]}
            stroke={INK}
            strokeWidth={1.5}
          />
        </g>
      ))}
      <circle cx={180} cy={40} r={20} fill="#FFE38A" stroke="#FFD45E" strokeWidth={4} />
    </g>
  );
}

const BACKGROUND_ART: Record<string, () => React.ReactElement> = {
  "bg-mint": BackgroundMint,
  "bg-lavender": BackgroundLavender,
  "bg-sunny": BackgroundSunny,
  "bg-peach": BackgroundPeach,
  "bg-sky": BackgroundSky,
  "bg-meadow": BackgroundMeadow,
};

function CornerStar({ x, y }: { x: number; y: number }) {
  return <path d={starPath(x, y, 13)} fill="#C9B8F0" stroke={INK} strokeWidth={2} strokeLinejoin="round" />;
}

function CornerFlower({ x, y }: { x: number; y: number }) {
  return (
    <g>
      {[
        [0, -10],
        [10, 0],
        [0, 10],
        [-10, 0],
      ].map(([dx, dy], i) => (
        <circle key={i} cx={x + dx} cy={y + dy} r={6.5} fill="#FFB3AB" stroke={INK} strokeWidth={2} />
      ))}
      <circle cx={x} cy={y} r={5} fill="#FFD45E" stroke={INK} strokeWidth={2} />
    </g>
  );
}

function Bunting() {
  const flags: React.ReactElement[] = [];
  const colors = ["#FFB3AB", "#FFE38A", "#A8E6CF", "#A6D8F0", "#C9B8F0"];
  for (let i = 0; i < 12; i++) {
    const x = 16 + i * 16.5;
    const y = i < 6 ? 10 + i * 4 : 10 + (11 - i) * 4;
    flags.push(
      <path
        key={i}
        d={`M${x} ${y} L${x + 12} ${y} L${x + 6} ${y + 12} Z`}
        fill={colors[i % colors.length]}
        stroke={INK}
        strokeWidth={1.5}
      />,
    );
  }
  return <g>{flags}</g>;
}

const FRAME_ART: Record<string, () => React.ReactElement> = {
  "fr-dashed": () => (
    <rect
      x={7}
      y={7}
      width={206}
      height={206}
      rx={26}
      fill="none"
      stroke="#7ED4B4"
      strokeWidth={5}
      strokeDasharray="16 13"
      strokeLinecap="round"
    />
  ),
  "fr-stars": () => (
    <g>
      <rect x={7} y={7} width={206} height={206} rx={26} fill="none" stroke="#AB93E6" strokeWidth={5} />
      <CornerStar x={22} y={22} />
      <CornerStar x={198} y={22} />
      <CornerStar x={22} y={198} />
      <CornerStar x={198} y={198} />
    </g>
  ),
  "fr-flowers": () => (
    <g>
      <rect x={7} y={7} width={206} height={206} rx={26} fill="none" stroke="#FF948A" strokeWidth={5} />
      <CornerFlower x={24} y={24} />
      <CornerFlower x={196} y={24} />
      <CornerFlower x={24} y={196} />
      <CornerFlower x={196} y={196} />
    </g>
  ),
  "fr-garland": () => (
    <g>
      <rect x={7} y={7} width={206} height={206} rx={26} fill="none" stroke="#FFD45E" strokeWidth={5} />
      <Bunting />
    </g>
  ),
};

/* ---------- Публичный компонент ---------- */

export interface CharacterViewProps {
  base: BaseId;
  color: CharColor;
  equipped?: Partial<Record<SlotId, string>>;
  size?: number | string;
  /** Рисовать купленные фон и рамку (сцена профиля). */
  stage?: boolean;
  mood?: Mood;
  /** Уровень: 5+ — крылышки, 8+ — нимб. */
  level?: number;
  /** Только голова — для маленьких аватаров. */
  head?: boolean;
  /** Друг-компаньон: base id. */
  companionBase?: string | null;
  customPet?: PetDesign | null;
  className?: string;
}

export function CharacterView({
  base,
  color,
  equipped = {},
  size = 200,
  stage = false,
  mood = "happy",
  level,
  head = false,
  companionBase = null,
  customPet = null,
  className,
}: CharacterViewProps) {
  const uidRaw = useId();
  const uid = `cv${uidRaw.replace(/[^a-zA-Z0-9]/g, "")}`;
  const c = CHAR_COLORS[color] ?? CHAR_COLORS.mint;
  const Base = BASE_ART[base] ?? BASE_ART.cat;
  const bodyFill = c.fill ? c.fill(uid) : undefined;
  const Background = equipped.background ? BACKGROUND_ART[equipped.background] : null;
  const Frame = equipped.frame ? FRAME_ART[equipped.frame] : null;
  const BackItem = equipped.back ? BACK_ART[equipped.back] : null;
  const label = `${BASE_NAMES[base]}, цвет: ${CHAR_COLOR_NAMES[color].toLowerCase()}`;

  const companionColor: BaseColor =
    companionBase === "dragon" ? "mint" : companionBase === "bunny" ? "lavender" : "peach";
  const companionKey = (companionBase && companionBase in BASE_ART ? companionBase : null) as BaseId | null;

  return (
    <svg
      viewBox={head ? "44 0 132 132" : "0 0 220 220"}
      width={size}
      height={size}
      role="img"
      aria-label={label}
      className={className}
    >
      <defs>
        <linearGradient id={`${uid}-rb`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF948A" />
          <stop offset="25%" stopColor="#FFD45E" />
          <stop offset="50%" stopColor="#7ED4B4" />
          <stop offset="75%" stopColor="#7FC2E6" />
          <stop offset="100%" stopColor="#AB93E6" />
        </linearGradient>
      </defs>

      {stage && Background && <Background />}
      {!equipped.back && typeof level === "number" && level >= 5 && BACK_ART["back-wings"]}
      {BackItem}
      {companionKey && (
        <g transform="translate(-26 46) scale(0.42)">
          {BASE_ART[companionKey]({ c: CHAR_COLORS[companionColor], mood: "happy" })}
        </g>
      )}
      <Base c={c} bodyFill={bodyFill} mood={mood} />
      {equipped.pattern && PATTERN_ART[equipped.pattern]}
      {equipped.pet === "pet-custom" && customPet ? (
        <CustomPetArt design={customPet} />
      ) : (
        equipped.pet && PET_ART[equipped.pet]
      )}
      {equipped.glasses && GLASSES_ART[equipped.glasses]}
      {equipped.hat && HAT_ART[equipped.hat]}
      {equipped.hand && HAND_ART[equipped.hand]}
      {typeof level === "number" && level >= 8 && !equipped.hat && BACK_ART["halo"]}
      {stage && Frame && <Frame />}
    </svg>
  );
}

/** Совёнок Умня — аватар ИИ-помощника. */
export function MunyaAvatar({ size = 44 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="Умня, помощник">
      <path d="M14 22 L8 6 L24 14 Z" fill="#AB93E6" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M50 22 L56 6 L40 14 Z" fill="#AB93E6" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <circle cx={32} cy={34} r={24} fill="#C9B8F0" stroke={INK} strokeWidth={3} />
      <ellipse cx={32} cy={42} rx={13} ry={12} fill="#F0EAFC" />
      <circle cx={22} cy={28} r={8.5} fill="#FFFFFF" stroke={INK} strokeWidth={2.5} />
      <circle cx={42} cy={28} r={8.5} fill="#FFFFFF" stroke={INK} strokeWidth={2.5} />
      <circle cx={22} cy={28} r={3.5} fill={INK} />
      <circle cx={42} cy={28} r={3.5} fill={INK} />
      <path d="M28 36 L32 42 L36 36 Z" fill="#FFD45E" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
    </svg>
  );
}

export { CHAR_COLOR_LIST, CHAR_COLOR_NAMES, BASE_NAMES };
export type { BaseColor, BaseId, CharColor };

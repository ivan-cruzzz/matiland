export type SoundName =
  | "correct"
  | "wrong"
  | "coin"
  | "chest"
  | "fanfare"
  | "tick"
  | "click"
  | "spin";

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  try {
    if (!ctx) {
      const AC =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(
  ac: AudioContext,
  freq: number,
  start: number,
  dur: number,
  type: OscillatorType = "sine",
  gain = 0.12,
) {
  const osc = ac.createOscillator();
  const vol = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  vol.gain.setValueAtTime(0, ac.currentTime + start);
  vol.gain.linearRampToValueAtTime(gain, ac.currentTime + start + 0.015);
  vol.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + dur);
  osc.connect(vol);
  vol.connect(ac.destination);
  osc.start(ac.currentTime + start);
  osc.stop(ac.currentTime + start + dur + 0.05);
}

/** Короткие синтезированные звуки без файлов-ассетов. */
export function playSound(name: SoundName, enabled: boolean) {
  if (!enabled) return;
  const ac = audio();
  if (!ac) return;
  switch (name) {
    case "correct":
      tone(ac, 660, 0, 0.12);
      tone(ac, 880, 0.09, 0.18);
      break;
    case "wrong":
      tone(ac, 200, 0, 0.22, "sawtooth", 0.07);
      tone(ac, 150, 0.1, 0.25, "sawtooth", 0.06);
      break;
    case "coin":
      tone(ac, 990, 0, 0.07, "square", 0.06);
      tone(ac, 1320, 0.06, 0.12, "square", 0.05);
      break;
    case "chest":
      tone(ac, 523, 0, 0.12);
      tone(ac, 659, 0.1, 0.12);
      tone(ac, 784, 0.2, 0.12);
      tone(ac, 1047, 0.3, 0.25);
      break;
    case "fanfare":
      tone(ac, 523, 0, 0.14, "triangle");
      tone(ac, 659, 0.12, 0.14, "triangle");
      tone(ac, 784, 0.24, 0.14, "triangle");
      tone(ac, 1047, 0.36, 0.4, "triangle");
      break;
    case "tick":
      tone(ac, 1200, 0, 0.03, "square", 0.04);
      break;
    case "click":
      tone(ac, 700, 0, 0.05, "sine", 0.05);
      break;
    case "spin":
      tone(ac, 400, 0, 0.05, "square", 0.04);
      tone(ac, 500, 0.05, 0.05, "square", 0.04);
      break;
  }
}

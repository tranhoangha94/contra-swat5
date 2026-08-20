let actx = null;
function ctx() {
  if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
  return actx;
}
function beep({ freq = 440, dur = 0.08, type = 'square', vol = 0.15, slide = 0 }) {
  try {
    const ac = ctx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    if (slide) osc.frequency.linearRampToValueAtTime(freq + slide, ac.currentTime + dur);
    gain.gain.setValueAtTime(vol, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + dur);
  } catch (e) { /* audio unavailable */ }
}
export const SFX = {
  shoot: () => beep({ freq: 950, dur: 0.05, type: 'square', vol: 0.06, slide: -350 }),
  flame: () => beep({ freq: 260, dur: 0.05, type: 'sawtooth', vol: 0.04, slide: -40 }),
  jump: () => beep({ freq: 300, dur: 0.12, type: 'triangle', vol: 0.12, slide: 260 }),
  hit: () => beep({ freq: 150, dur: 0.12, type: 'sawtooth', vol: 0.15, slide: -70 }),
  hurt: () => beep({ freq: 200, dur: 0.22, type: 'sawtooth', vol: 0.2, slide: -150 }),
  explode: () => beep({ freq: 90, dur: 0.35, type: 'sawtooth', vol: 0.22, slide: -60 }),
  pickup: () => beep({ freq: 500, dur: 0.16, type: 'triangle', vol: 0.16, slide: 400 }),
  bossHit: () => beep({ freq: 120, dur: 0.15, type: 'square', vol: 0.14, slide: -30 }),
  reload: () => beep({ freq: 220, dur: 0.18, type: 'square', vol: 0.1, slide: -160 }),
};

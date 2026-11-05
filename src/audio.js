/**
 * Hệ thống âm thanh tổng hợp bằng WebAudio chuyên biệt cho Billiards:
 * Tiếng cơ gõ bi (Cue strike), va chạm bi (Ball collision), bi rơi vào lỗ (Pocket drop),
 * tiếng thoa lơ (Chalking), ăn mừng (Fanfare) và âm thanh đồng hồ đếm giây (Shot clock).
 */
export function createAudio() {
  let ctx = null;
  let master = null;
  let loungeNode = null;
  let muted = false;
  let volume = 0.6;

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;

    ctx = new AudioCtx();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : volume;
    master.connect(ctx.destination);
    startLoungeHum();
    return ctx;
  }

  function noiseBuffer(seconds) {
    const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  // Âm vang nhẹ của phòng CLB Bida máy lạnh cao cấp
  function startLoungeHum() {
    if (!ctx) return;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(3);
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 240;
    const g = ctx.createGain();
    g.gain.value = 0.015;
    src.connect(filter).connect(g).connect(master);
    src.start();
    loungeNode = g;
  }

  /**
   * Tiếng đầu cơ tiếp xúc gõ bi (Cue tip strike) - đanh gọn, có tiếng gỗ và tẩy da
   */
  function cueHit(strength = 1) {
    if (!ensure()) return;
    const t = ctx.currentTime;

    // Tiếng va chạm cơ học cực ngắn
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(820, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.045);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.85 * strength, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    // Tiếng ma sát lơ và da (Chalk & leather click)
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer(0.05);
    const nFilter = ctx.createBiquadFilter();
    nFilter.type = 'bandpass';
    nFilter.frequency.setValueAtTime(2400, t);
    nFilter.Q.value = 4;

    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.5 * strength, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(oscGain).connect(master);
    noise.connect(nFilter).connect(nGain).connect(master);

    osc.start(t);
    osc.stop(t + 0.055);
    noise.start(t);
  }

  /**
   * Tiếng hai bi va đập (Ball collision) - tiếng nhựa phenolic resin cao cấp leng keng
   */
  function ballClick(strength = 1) {
    if (!ensure()) return;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    const baseFreq = 2200 + Math.random() * 300;
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.035);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.7 * Math.min(1.2, strength), t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + 0.045);
  }

  /**
   * Tiếng bi rơi vào rọ / lưới lót da (Pocket drop thud)
   */
  function pocketDrop() {
    if (!ensure()) return;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.18);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.7, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  /**
   * Tiếng thoa lơ vào đầu tẩy (Chalking)
   */
  function chalk() {
    if (!ensure()) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(0.18);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3200, t);
    filter.Q.value = 5;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.25, t);
    g.gain.linearRampToValueAtTime(0.4, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    src.connect(filter).connect(g).connect(master);
    src.start(t);
  }

  /**
   * Tiếng ăn mừng chiến thắng (Fanfare)
   */
  function cheer() {
    if (!ensure()) return;
    const t = ctx.currentTime;
    const chord = [523.25, 659.25, 783.99, 1046.5]; // C E G C
    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const g = ctx.createGain();
      const delay = t + i * 0.06;
      g.gain.setValueAtTime(0, delay);
      g.gain.linearRampToValueAtTime(0.3, delay + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, delay + 0.65);
      osc.connect(g).connect(master);
      osc.start(delay);
      osc.stop(delay + 0.7);
    });
  }

  /**
   * Tiếng đếm lùi thời gian Shot Clock (Matchroom 30s beep)
   */
  function shotClockBeep(isFinal = false) {
    if (!ensure()) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = isFinal ? 1200 : 880;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.15, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + (isFinal ? 0.25 : 0.08));
    osc.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + (isFinal ? 0.26 : 0.09));
  }

  function applyVolume() {
    if (master) master.gain.value = muted ? 0 : volume;
  }

  return {
    unlock: ensure,
    cueHit,
    punch: cueHit, // Tương thích với lệnh punch cũ
    ballClick,
    pocketDrop,
    chalk,
    cheer,
    shotClockBeep,
    get muted() {
      return muted;
    },
    toggleMute() {
      muted = !muted;
      applyVolume();
      return muted;
    },
    setVolume(v) {
      volume = v;
      muted = v === 0;
      applyVolume();
    },
    close() {
      loungeNode = null;
      ctx?.close();
    },
  };
}

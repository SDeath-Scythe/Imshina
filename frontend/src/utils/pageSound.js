// Page-turn sound, synthesised with the Web Audio API (no audio files, nothing to license).
// A turn is four layers of shaped noise, timed to the animation:
//   lift:    a soft rising rustle as the sheet peels off the page
//   crackle: sparse clicks of paper fibre while it bends
//   swish:   air moving past as it swings through the middle
//   flap:    a low, short thump as it lands
// scheduleTurn() works on any AudioContext, including an OfflineAudioContext (used to export a sample).

let ctx = null

function context() {
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  if (!ctx) ctx = new AC()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

// Noise buffers, made once per context. `sparse` gives occasional sharp clicks instead of hiss.
const cache = new WeakMap()
function noise(c, kind) {
  let set = cache.get(c)
  if (!set) { set = {}; cache.set(c, set) }
  if (!set[kind]) {
    const len = Math.floor(c.sampleRate * 1.5)
    const buf = c.createBuffer(1, len, c.sampleRate)
    const d = buf.getChannelData(0)
    let last = 0
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1
      if (kind === 'sparse') d[i] = Math.random() < 0.004 ? white : white * 0.04
      else { last = (last + 0.02 * white) / 1.02; d[i] = kind === 'brown' ? last * 3.5 : white } // brown: deeper, softer
    }
    set[kind] = buf
  }
  return set[kind]
}

function layer(c, out, { kind, start, dur, type, freq, freqTo, q = 0.7, gain, attack, release }) {
  const src = c.createBufferSource()
  src.buffer = noise(c, kind)
  const filter = c.createBiquadFilter()
  filter.type = type
  filter.Q.value = q
  filter.frequency.setValueAtTime(freq, start)
  if (freqTo) filter.frequency.exponentialRampToValueAtTime(freqTo, start + dur)
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, start)
  g.gain.exponentialRampToValueAtTime(gain, start + attack)
  g.gain.setValueAtTime(gain, start + Math.max(attack, dur - release))
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  src.connect(filter).connect(g).connect(out)
  src.start(start, Math.random() * 0.4)
  src.stop(start + dur + 0.05)
}

/** Schedules one page turn of `duration` seconds on context `c`, starting at time `t0`. */
export function scheduleTurn(c, t0, duration = 0.82, volume = 1) {
  const out = c.createGain()
  out.gain.value = volume
  // Gentle compression keeps the flap from clipping on small phone speakers.
  const comp = c.createDynamicsCompressor()
  comp.threshold.value = -18
  comp.ratio.value = 3
  out.connect(comp).connect(c.destination)

  const d = duration
  // lift: rustle that brightens as the sheet peels away
  layer(c, out, { kind: 'white', start: t0, dur: d * 0.55, type: 'bandpass', freq: 1300, freqTo: 3000, q: 0.8, gain: 0.2, attack: 0.06, release: d * 0.25 })
  // crackle: a few soft fibre clicks, not a crackling fire
  layer(c, out, { kind: 'sparse', start: t0 + 0.03, dur: d * 0.6, type: 'highpass', freq: 2800, gain: 0.32, attack: 0.05, release: d * 0.3 })
  // swish: air through the middle of the swing, carrying the sound up to the landing
  layer(c, out, { kind: 'white', start: t0 + d * 0.15, dur: d * 0.7, type: 'bandpass', freq: 1000, freqTo: 520, q: 0.55, gain: 0.26, attack: d * 0.3, release: d * 0.28 })
  // body: a little low paper rumble under the swish
  layer(c, out, { kind: 'brown', start: t0 + d * 0.1, dur: d * 0.72, type: 'lowpass', freq: 900, q: 0.5, gain: 0.12, attack: d * 0.25, release: d * 0.3 })
  // flap: the sheet settling on the page
  layer(c, out, { kind: 'brown', start: t0 + d * 0.8, dur: 0.16, type: 'lowpass', freq: 420, q: 0.8, gain: 0.5, attack: 0.008, release: 0.12 })
  layer(c, out, { kind: 'white', start: t0 + d * 0.8, dur: 0.07, type: 'bandpass', freq: 2600, q: 1.2, gain: 0.07, attack: 0.004, release: 0.05 })
}

/** Plays a page turn now. Silent (never throws) where audio isn't available or is blocked. */
export function playPageTurn(duration = 0.82) {
  try {
    const c = context()
    if (!c) return
    scheduleTurn(c, c.currentTime + 0.01, duration)
  } catch { /* audio is a nicety */ }
}

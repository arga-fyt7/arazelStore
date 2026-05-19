function beep(ctx, freq, startTime, duration, volume = 0.12) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.frequency.value = freq
  gain.gain.setValueAtTime(volume, startTime)
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
  osc.start(startTime)
  osc.stop(startTime + duration)
}

function getCtx() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

export function playNotificationSound() {
  try {
    const ctx = getCtx()
    const now = ctx.currentTime
    beep(ctx, 660, now, 0.1)
    beep(ctx, 880, now + 0.1, 0.15)
  } catch {}
}

export function playOrderSound() {
  try {
    const ctx = getCtx()
    const now = ctx.currentTime
    beep(ctx, 523, now, 0.12)
    beep(ctx, 659, now + 0.12, 0.12)
    beep(ctx, 784, now + 0.24, 0.2)
  } catch {}
}

export function playToastSound(type) {
  try {
    const ctx = getCtx()
    const now = ctx.currentTime
    if (type === 'success') beep(ctx, 880, now, 0.12)
    else beep(ctx, 380, now, 0.2)
  } catch {}
}

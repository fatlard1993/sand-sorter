// Small sounds made on the spot, no files: a note is a frequency, a length and a shape
let audio;

const ready = () => {
	audio ??= new AudioContext();
	if (audio.state === 'suspended') audio.resume();

	return audio;
};

// Browsers keep sound off until the page is touched
document.addEventListener('pointerdown', ready, { once: true });

const note = (frequency, { start = 0, length = 0.15, type = 'sine', volume = 0.2, slideTo } = {}) => {
	if (!audio || audio.state !== 'running') return;

	const at = audio.currentTime + start;
	const oscillator = audio.createOscillator();
	const gain = audio.createGain();

	oscillator.type = type;
	oscillator.frequency.setValueAtTime(frequency, at);
	if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(slideTo, at + length);
	gain.gain.setValueAtTime(volume, at);
	gain.gain.exponentialRampToValueAtTime(0.001, at + length);
	oscillator.connect(gain).connect(audio.destination);
	oscillator.start(at);
	oscillator.stop(at + length);
};

export const sounds = {
	count: () => note(440, { length: 0.12, type: 'square', volume: 0.08 }),
	go: () => note(880, { length: 0.3, type: 'square', volume: 0.08 }),
	plop: () => note(500 + Math.random() * 300, { length: 0.05, volume: 0.06, slideTo: 200 }),
	win: () => [523, 659, 784, 1047].forEach((frequency, at) => note(frequency, { start: at * 0.12, length: 0.3 })),
	party: () =>
		[523, 659, 784, 659, 784, 1047, 784, 1047, 1319].forEach((frequency, at) =>
			note(frequency, { start: at * 0.14, length: 0.25, type: at % 2 ? 'triangle' : 'square', volume: 0.12 }),
		),
	spoil: () =>
		[392, 330, 262].forEach((frequency, at) =>
			note(frequency, { start: at * 0.25, length: 0.35, type: 'triangle', slideTo: frequency * 0.9 }),
		),
};

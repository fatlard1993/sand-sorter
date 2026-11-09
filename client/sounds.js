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
	// A zip up when a line is drawn, and a rubbery squeak down when the sponge wipes
	draw: () => note(300, { length: 0.18, type: 'triangle', volume: 0.1, slideTo: 900 }),
	wipe: () => {
		note(1200, { length: 0.08, type: 'sine', volume: 0.08, slideTo: 700 });
		note(900, { start: 0.08, length: 0.08, type: 'sine', volume: 0.08, slideTo: 500 });
	},
	// A quick twinkle, a little different each time, when sand changes color
	sparkle: () => {
		const high = 1500 + Math.random() * 600;

		note(high, { length: 0.06, volume: 0.05 });
		note(high * 1.5, { start: 0.05, length: 0.08, volume: 0.04 });
	},
	// A low buzz when sand lands in the wrong jar and takes a point away
	oops: () => note(160, { length: 0.12, type: 'sawtooth', volume: 0.05, slideTo: 110 }),
	// Fireworks: a whistle going up, then a boom of rumbling noise with a crackle on top
	whistle: () => note(600, { length: 0.5, type: 'sine', volume: 0.04, slideTo: 1800 }),
	boom: () => {
		if (!audio || audio.state !== 'running') return;

		const length = 0.8;
		const buffer = audio.createBuffer(1, audio.sampleRate * length, audio.sampleRate);
		const data = buffer.getChannelData(0);

		for (let at = 0; at < data.length; at++) data[at] = (Math.random() * 2 - 1) * (1 - at / data.length) ** 3;

		const source = audio.createBufferSource();
		const filter = audio.createBiquadFilter();
		const gain = audio.createGain();

		source.buffer = buffer;
		filter.type = 'lowpass';
		filter.frequency.value = 500 + Math.random() * 400;
		gain.gain.value = 0.35;
		source.connect(filter).connect(gain).connect(audio.destination);
		source.start();
		for (let pop = 0; pop < 5; pop++) note(2000 + Math.random() * 2000, { start: 0.1 + Math.random() * 0.4, length: 0.03, type: 'square', volume: 0.03 });
	},
	// A bubbly fizz when dirt dissolves in water
	fizz: () => {
		for (let bubble = 0; bubble < 3; bubble++)
			note(700 + Math.random() * 900, { start: bubble * 0.04, length: 0.05, volume: 0.04, slideTo: 1600 + Math.random() * 800 });
	},
	// A wish: a magic run of high bell notes
	wish: () =>
		[1047, 1319, 1568, 2093, 2637].forEach((frequency, at) => note(frequency, { start: at * 0.07, length: 0.4, volume: 0.07 })),
	// The settling countdown: a wooden tick, then a lower tock, a second apart
	tick: high => note(high ? 1400 : 1000, { length: 0.05, type: 'triangle', volume: 0.1 }),
	// A gem in a jar: a bright bell with a shimmer on top
	gem: () => {
		note(1760, { length: 0.6, volume: 0.1 });
		note(2637, { start: 0.05, length: 0.5, volume: 0.06 });
		note(3520, { start: 0.1, length: 0.4, volume: 0.04 });
	},
	// Sand burning in lava: a short hiss of noise
	sizzle: () => {
		if (!audio || audio.state !== 'running') return;

		const length = 0.25;
		const buffer = audio.createBuffer(1, audio.sampleRate * length, audio.sampleRate);
		const data = buffer.getChannelData(0);

		for (let at = 0; at < data.length; at++) data[at] = (Math.random() * 2 - 1) * (1 - at / data.length);

		const source = audio.createBufferSource();
		const filter = audio.createBiquadFilter();
		const gain = audio.createGain();

		source.buffer = buffer;
		filter.type = 'highpass';
		filter.frequency.value = 3000;
		gain.gain.value = 0.08;
		source.connect(filter).connect(gain).connect(audio.destination);
		source.start();
	},
	// The monster: a crunchy chomp when it eats sand, and a springy boing when it's bonked
	chomp: () => note(180, { length: 0.08, type: 'square', volume: 0.06, slideTo: 90 }),
	bonk: () => {
		note(300, { length: 0.25, type: 'triangle', volume: 0.12, slideTo: 900 });
		note(900, { start: 0.12, length: 0.25, type: 'triangle', volume: 0.08, slideTo: 300 });
	},
	// A monster burning up: a falling whoop
	poof: () => note(700, { length: 0.5, type: 'sawtooth', volume: 0.06, slideTo: 80 }),
	// Counting the score: a blip that climbs as points go up, and a low one for each point taken off
	tally: (up, score) =>
		up
			? note(400 + Math.min(score, 300) * 4, { length: 0.04, type: 'square', volume: 0.04 })
			: note(220, { length: 0.04, type: 'triangle', volume: 0.05 }),
	spoil: () =>
		[392, 330, 262].forEach((frequency, at) =>
			note(frequency, { start: at * 0.25, length: 0.35, type: 'triangle', slideTo: frequency * 0.9 }),
		),
};

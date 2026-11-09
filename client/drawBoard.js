import { theme } from '@vanilla-bean/components';

import { SPOUT_WIDTH, STEPS_PER_SECOND, STILL_STEPS } from '../sand.js';

export const SCALE = 6;

// Each player draws in their own color, in the order they joined
const penHues = ['teal', 'pink', 'green', 'purple', 'orange', 'blue'];

export const penHue = (players, playerId) => {
	const at = players.findIndex(({ id }) => id === playerId);

	return penHues[Math.max(0, at) % penHues.length];
};

const { colors } = theme;
const cache = {};
const once = (key, make) => (cache[key] ??= make());
const hex = color => color.toHexString();
const rgba = (color, alpha) => colors.alpha(color, alpha).toRgbString();

const sandShades = [-8, -3, 2, 7];
// Dirt (gray) is drawn a muddy brown, so it looks like something to wash away
// and gold a bright shiny yellow
const sandColor = (name, shade = 0) =>
	once(`sand${name}${shade}`, () => {
		if (name === 'gray') return hex(colors.darker(colors.orange).desaturate(30).lighten(sandShades[shade]));
		if (name === 'gold') return hex(colors.yellow.clone().saturate(30).lighten(sandShades[shade] + 8));
		if (name === 'gem') return hex(colors.lightest(colors.teal).lighten(sandShades[shade] + 5));

		return hex(colors.light(colors[name]).lighten(sandShades[shade]));
	});

// A night sky over dunes, drawn once and stamped behind every frame
// Each level gets its own sky, going round these: top, middle and ground colors
const skies = [
	['purple', 'blue', 'orange'],
	['blue', 'teal', 'yellow'],
	['red', 'purple', 'pink'],
	['green', 'teal', 'yellow'],
	['blue', 'purple', 'teal'],
	['purple', 'pink', 'orange'],
	['teal', 'blue', 'green'],
];

const backdrop = (width, height, level = 0) =>
	once(`backdrop${width}x${height}x${level}`, () => {
		const [top, middle, ground] = skies[level % skies.length];
		const canvas = new OffscreenCanvas(width, height);
		const pen = canvas.getContext('2d');
		const sky = pen.createLinearGradient(0, 0, 0, height);

		sky.addColorStop(0, hex(colors.darkest(colors[top])));
		sky.addColorStop(0.7, hex(colors.darker(colors[middle])));
		sky.addColorStop(1, hex(colors.darker(colors[ground])));
		pen.fillStyle = sky;
		pen.fillRect(0, 0, width, height);

		pen.fillStyle = rgba(colors.white, 0.5);
		for (let star = 0; star < 40; star++) {
			const x = (star * 97 + level * 31) % width;
			const y = (star * 53) % (height * 0.6);

			pen.fillRect(x, y, star % 3 ? 1.5 : 2.5, star % 3 ? 1.5 : 2.5);
		}

		// A moon in a different spot each level: full on some, a thin crescent on others
		const moon = new OffscreenCanvas(width, height);
		const moonPen = moon.getContext('2d');
		const moonX = width * (0.15 + ((level * 0.37) % 1) * 0.7);
		const moonY = height * 0.16;
		const moonSize = width * 0.07;

		moonPen.fillStyle = hex(colors.lightest(colors.yellow));
		moonPen.beginPath();
		moonPen.arc(moonX, moonY, moonSize, 0, Math.PI * 2);
		moonPen.fill();
		if (level % 2) {
			moonPen.globalCompositeOperation = 'destination-out';
			moonPen.beginPath();
			moonPen.arc(moonX + moonSize * 0.5, moonY - moonSize * 0.2, moonSize, 0, Math.PI * 2);
			moonPen.fill();
		}
		pen.save();
		pen.shadowColor = rgba(colors.lightest(colors.yellow), 0.8);
		pen.shadowBlur = moonSize;
		pen.drawImage(moon, 0, 0);
		pen.restore();

		[
			[0.82, colors.darker(colors[ground]), 0.5],
			[0.9, colors.dark(colors[ground]), 0.35],
		].forEach(([top, color, alpha], layer) => {
			pen.fillStyle = rgba(color, alpha);
			pen.beginPath();
			pen.moveTo(0, height);
			for (let x = 0; x <= width; x += 8)
				pen.lineTo(x, height * top + Math.sin(x / (60 + layer * 30) + layer * 2 + level) * height * 0.03);
			pen.lineTo(width, height);
			pen.fill();
		});

		return canvas;
	});

const strokeLine = (pen, points, style, glow) => {
	if (!points.length) return;

	pen.save();
	pen.strokeStyle = style;
	pen.lineWidth = SCALE * 2;
	pen.lineCap = 'round';
	pen.lineJoin = 'round';
	if (glow) {
		pen.shadowColor = glow;
		pen.shadowBlur = SCALE * 2;
	}
	// Through the midpoints between points, curving at each point, so a hand-drawn line comes out smooth
	const at = index => [(points[index][0] - 0.5) * SCALE, (points[index][1] - 0.5) * SCALE];

	pen.beginPath();
	pen.moveTo(...at(0));
	if (points.length === 1) pen.lineTo(at(0)[0] + 0.1, at(0)[1]);
	for (let index = 1; index < points.length - 1; index++) {
		const [x, y] = at(index);
		const [nextX, nextY] = at(index + 1);

		pen.quadraticCurveTo(x, y, (x + nextX) / 2, (y + nextY) / 2);
	}
	if (points.length > 1) pen.lineTo(...at(points.length - 1));
	pen.stroke();
	pen.restore();
};

const roundedBox = (pen, x, y, width, height, radius) => {
	pen.beginPath();
	pen.roundRect(x, y, width, height, radius);
};

const bigText = (pen, text, x, y, size, fill) => {
	pen.save();
	pen.font = `bold ${size}px sans-serif`;
	pen.textAlign = 'center';
	pen.textBaseline = 'middle';
	pen.shadowColor = rgba(colors.vantablack, 0.6);
	pen.shadowBlur = size / 8;
	pen.fillStyle = fill;
	pen.fillText(text, x, y);
	pen.restore();
};

const drawPaints = (pen, paints = []) => {
	for (const { x, y, width, height, color } of paints) {
		const glow = pen.createLinearGradient(0, y * SCALE, 0, (y + height) * SCALE);

		glow.addColorStop(0, rgba(colors[color], 0.15));
		glow.addColorStop(0.5, rgba(colors[color], 0.55));
		glow.addColorStop(1, rgba(colors[color], 0.15));
		pen.fillStyle = glow;
		roundedBox(pen, x * SCALE, y * SCALE, width * SCALE, height * SCALE, SCALE * 2);
		pen.fill();
		pen.save();
		pen.strokeStyle = hex(colors.light(colors[color]));
		pen.lineWidth = 2;
		pen.setLineDash([SCALE, SCALE]);
		pen.stroke();
		pen.restore();

		// Plain sand on top, an arrow, and sand in the new color underneath: whatever falls through comes out this color
		const middle = (x + width / 2) * SCALE;
		const grain = SCALE * 1.2;
		const row = (atY, fill) => {
			pen.fillStyle = fill;
			for (let at = -2; at <= 2; at++) pen.fillRect(middle + at * grain * 1.6 - grain / 2, atY, grain, grain);
		};

		row((y - 2) * SCALE - grain, hex(colors.light(colors.gray)));
		bigText(pen, '⬇', middle, (y + height / 2) * SCALE, height * SCALE * 0.7, hex(colors.white));
		row((y + height + 2) * SCALE, hex(colors.light(colors[color])));
	}
};

// Gusts: wavy streaks racing across each wind's box the way it blows, drawn fresh every frame so the wind moves
const drawGusts = (pen, winds = [], time = performance.now() / 1000) => {
	for (const { x, y, width, height, blow } of winds) {
		pen.save();
		roundedBox(pen, x * SCALE, y * SCALE, width * SCALE, height * SCALE, SCALE * 2);
		pen.clip();
		pen.lineWidth = 2;
		pen.lineCap = 'round';

		const count = Math.max(3, Math.floor(width / 6));

		for (let gust = 0; gust < count; gust++) {
			const row = y + height * (0.15 + ((gust * 0.37) % 1) * 0.7);
			const speed = 24 + (gust % 3) * 10;
			const length = 6 + (gust % 4) * 2;
			const travelled = ((gust * 13.7 + time * speed) % (width + length)) - length;
			const head = blow > 0 ? x + travelled + length : x + width - travelled - length;
			const fade = Math.sin((Math.PI * (travelled + length)) / (width + length));

			pen.strokeStyle = rgba(colors.white, 0.7 * fade);
			pen.beginPath();
			for (let along = 0; along <= length; along += 1) {
				const atX = head - blow * along;
				const wave = Math.sin(atX / 3 + time * 6 + gust) * 0.6;

				along ? pen.lineTo(atX * SCALE, (row + wave) * SCALE) : pen.moveTo(atX * SCALE, (row + wave) * SCALE);
			}
			pen.stroke();
		}
		pen.restore();
	}
};

// Little twinkles on the sand passing through a color area, in that color and white, so you can see it changing
const drawSparkles = (pen, { grains, paints = [] }) => {
	// Gold glints white here and there; a gem shines with a glow and glints far more often
	for (const [x, y, color] of grains)
		if (color === 'gem') {
			pen.save();
			pen.fillStyle = hex(colors.lightest(colors.teal));
			pen.shadowColor = hex(colors.teal);
			pen.shadowBlur = SCALE * 2;
			pen.beginPath();
			pen.moveTo((x + 0.5) * SCALE, (y - 0.5) * SCALE);
			pen.lineTo((x + 1.5) * SCALE, (y + 0.5) * SCALE);
			pen.lineTo((x + 0.5) * SCALE, (y + 1.5) * SCALE);
			pen.lineTo((x - 0.5) * SCALE, (y + 0.5) * SCALE);
			pen.closePath();
			pen.fill();
			pen.restore();
		}

	pen.fillStyle = hex(colors.white);
	for (const [x, y, color] of grains)
		if ((color === 'gold' && Math.random() < 0.15) || (color === 'gem' && Math.random() < 0.5)) {
			pen.fillRect((x + 0.5) * SCALE - SCALE, (y + 0.5) * SCALE - 0.5, SCALE * 2, 1);
			pen.fillRect((x + 0.5) * SCALE - 0.5, (y + 0.5) * SCALE - SCALE, 1, SCALE * 2);
		}

	for (const paint of paints) {
		const passing = grains.filter(([x, y]) => x >= paint.x && x < paint.x + paint.width && y >= paint.y && y < paint.y + paint.height + 3);

		for (const [x, y] of passing) {
			if (Math.random() > 0.25) continue;

			const size = SCALE * (1 + Math.random() * 1.5);
			const centerX = (x + 0.5) * SCALE;
			const centerY = (y + 0.5) * SCALE;

			pen.save();
			pen.fillStyle = Math.random() < 0.5 ? hex(colors.white) : hex(colors.lightest(colors[paint.color]));
			pen.shadowColor = rgba(colors[paint.color], 0.9);
			pen.shadowBlur = SCALE;
			pen.beginPath();
			pen.moveTo(centerX, centerY - size);
			pen.lineTo(centerX + size / 4, centerY - size / 4);
			pen.lineTo(centerX + size, centerY);
			pen.lineTo(centerX + size / 4, centerY + size / 4);
			pen.lineTo(centerX, centerY + size);
			pen.lineTo(centerX - size / 4, centerY + size / 4);
			pen.lineTo(centerX - size, centerY);
			pen.lineTo(centerX - size / 4, centerY - size / 4);
			pen.closePath();
			pen.fill();
			pen.restore();
		}
	}
};

// Now and then a shooting star zooms across the top of the sky, from a different spot each time; where its head is
// right now, if one is flying (in canvas pixels), so a tap can catch it
export const shootingStar = (width, height, time = performance.now() / 1000) => {
	const every = 5;
	const which = Math.floor(time / every);
	const flight = ((time % every) - (which % 3)) / 0.9;

	if (flight <= 0 || flight >= 1) return null;

	const fromX = width * (0.3 + ((which * 0.618) % 1) * 0.6);
	const fromY = height * (0.05 + ((which * 0.37) % 1) * 0.2);

	return { x: fromX - flight * width * 0.45, y: fromY + flight * height * 0.18, flight, which };
};

// The sky's bigger stars, glinting brighter and dimmer at their own pace, drawn fresh every frame
const drawTwinkles = (pen, level = 0, width, height, time = performance.now() / 1000) => {
	pen.save();
	for (let star = 0; star < 40; star += 3) {
		const x = (star * 97 + level * 31) % width;
		const y = (star * 53) % (height * 0.6);
		const glint = Math.max(0, Math.sin(time * (1.5 + (star % 5) * 0.4) + star * 1.7));
		const size = 2 + glint * 5;

		pen.fillStyle = rgba(colors.white, glint * 0.9);
		pen.fillRect(x + 1.25 - size, y + 0.75, size * 2, 1);
		pen.fillRect(x + 0.75, y + 1.25 - size, 1, size * 2);
	}

	const star = shootingStar(width, height, time);

	if (star) {
		const { x: headX, y: headY, flight } = star;
		const tail = pen.createLinearGradient(headX, headY, headX + width * 0.12, headY - height * 0.05);

		tail.addColorStop(0, rgba(colors.white, 0.95 * (1 - flight * 0.5)));
		tail.addColorStop(1, rgba(colors.white, 0));
		pen.strokeStyle = tail;
		pen.lineWidth = 2.5;
		pen.lineCap = 'round';
		pen.beginPath();
		pen.moveTo(headX, headY);
		pen.lineTo(headX + width * 0.12, headY - height * 0.05);
		pen.stroke();
		pen.fillStyle = rgba(colors.white, 1 - flight * 0.5);
		pen.beginPath();
		pen.arc(headX, headY, 2.5, 0, Math.PI * 2);
		pen.fill();
	}
	pen.restore();
};

// Whirlwinds: a soft round glow with curly arcs going round it the way it spins, drawn fresh every frame
const drawWhirls = (pen, whirls = [], time = performance.now() / 1000) => {
	for (const { x, y, size, spin } of whirls) {
		const centerX = (x + 0.5) * SCALE;
		const centerY = (y + 0.5) * SCALE;
		const radius = size * SCALE;
		const glow = pen.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);

		glow.addColorStop(0, rgba(colors.teal, 0.25));
		glow.addColorStop(1, rgba(colors.teal, 0));
		pen.fillStyle = glow;
		pen.beginPath();
		pen.arc(centerX, centerY, radius, 0, Math.PI * 2);
		pen.fill();

		pen.save();
		pen.lineCap = 'round';
		pen.lineWidth = 2;
		for (let ring = 0; ring < 3; ring++) {
			const turn = spin * time * (3 - ring * 0.6) + ring * 2;

			pen.strokeStyle = rgba(colors.white, 0.55 - ring * 0.12);
			for (let arm = 0; arm < 2; arm++) {
				const start = turn + arm * Math.PI;

				pen.beginPath();
				pen.arc(centerX, centerY, radius * (0.35 + ring * 0.28), start, start + 1.4);
				pen.stroke();
			}
		}
		pen.restore();
	}
};

// Water pools: see-through blue with a wavy top and bubbles rising, drawn fresh every frame so the water moves
const drawWaters = (pen, waters = [], time = performance.now() / 1000) => {
	for (const { x, y, width, height } of waters) {
		const left = x * SCALE;
		const right = (x + width) * SCALE;
		const bottom = (y + height) * SCALE;
		const wave = at => y * SCALE + Math.sin(at / 8 + time * 3) * SCALE * 0.6;

		pen.save();
		pen.fillStyle = rgba(colors.blue, 0.35);
		pen.beginPath();
		pen.moveTo(left, bottom);
		for (let at = left; at <= right; at += 3) pen.lineTo(at, wave(at));
		pen.lineTo(right, bottom);
		pen.closePath();
		pen.fill();
		pen.clip();

		pen.strokeStyle = rgba(colors.lightest(colors.blue), 0.8);
		pen.lineWidth = 2;
		pen.beginPath();
		for (let at = left; at <= right; at += 3) pen.lineTo(at, wave(at) + 1);
		pen.stroke();

		pen.strokeStyle = rgba(colors.white, 0.6);
		pen.lineWidth = 1;
		for (let bubble = 0; bubble < width / 3; bubble++) {
			const rise = (time * (0.4 + (bubble % 3) * 0.2) + bubble * 0.37) % 1;

			pen.beginPath();
			pen.arc(left + ((bubble * 7.3) % width) * SCALE, bottom - rise * height * SCALE, 1.5 + (bubble % 2), 0, Math.PI * 2);
			pen.stroke();
		}
		pen.restore();
		bigText(pen, '💧', (x + width / 2) * SCALE, (y + height / 2) * SCALE, height * SCALE * 0.5, hex(colors.white));
	}
};

// Lava: glowing red and orange, with a wobbly top and bubbles that swell and pop, drawn fresh every frame
const drawLavas = (pen, lavas = [], time = performance.now() / 1000) => {
	for (const { x, y, width, height } of lavas) {
		const left = x * SCALE;
		const right = (x + width) * SCALE;
		const bottom = (y + height) * SCALE;
		const top = at => y * SCALE + Math.sin(at / 6 + time * 2) * SCALE * 0.5;
		const heat = pen.createLinearGradient(0, y * SCALE, 0, bottom);

		heat.addColorStop(0, hex(colors.orange));
		heat.addColorStop(1, hex(colors.dark(colors.red)));
		pen.save();
		pen.shadowColor = rgba(colors.orange, 0.9);
		pen.shadowBlur = SCALE * 3;
		pen.fillStyle = heat;
		pen.beginPath();
		pen.moveTo(left, bottom);
		for (let at = left; at <= right; at += 3) pen.lineTo(at, top(at));
		pen.lineTo(right, bottom);
		pen.closePath();
		pen.fill();
		pen.restore();

		pen.fillStyle = rgba(colors.lightest(colors.yellow), 0.8);
		for (let bubble = 0; bubble < width / 4; bubble++) {
			const swell = (time * (0.5 + (bubble % 3) * 0.3) + bubble * 0.41) % 1;

			pen.beginPath();
			pen.arc(left + ((bubble * 9.7) % width) * SCALE, y * SCALE + (0.3 + (bubble % 2) * 0.3) * height * SCALE, swell * SCALE, 0, Math.PI * 2);
			pen.fill();
		}
	}
};

const drawWinds = (pen, winds = []) => {
	for (const { x, y, width, height, blow } of winds) {
		pen.fillStyle = rgba(colors.teal, 0.18);
		roundedBox(pen, x * SCALE, y * SCALE, width * SCALE, height * SCALE, SCALE * 2);
		pen.fill();
		pen.fillStyle = rgba(colors.white, 0.25);
		pen.font = `${height * SCALE * 0.6}px sans-serif`;
		pen.textAlign = 'center';
		pen.textBaseline = 'middle';
		for (let at = x + 8; at < x + width; at += 16) pen.fillText(blow > 0 ? '→' : '←', at * SCALE, (y + height / 2) * SCALE);
	}
};

// A glass jar: a tint of its color filling as sand arrives, and a rim in its color so it's plain which sand it wants
const drawCups = (pen, cups) => {
	for (const { x, y, width, height, color, count, need } of cups) {
		const fill = Math.min(1, count / need);
		const left = (x + 0.5) * SCALE;
		const right = (x + width + 0.5) * SCALE;
		const bottom = (y + height + 0.5) * SCALE;

		pen.fillStyle = rgba(colors.white, 0.06);
		pen.fillRect(left, y * SCALE, right - left, bottom - y * SCALE);
		pen.fillStyle = rgba(colors[color], 0.3);
		pen.fillRect(left, bottom - (bottom - y * SCALE) * fill, right - left, (bottom - y * SCALE) * fill);

		// Straight sides and square corners: a jar, not a bowl
		pen.save();
		pen.strokeStyle = hex(colors.light(colors[color]));
		pen.lineWidth = SCALE * 1.5;
		pen.lineJoin = 'miter';
		pen.lineCap = 'butt';
		pen.shadowColor = rgba(colors[color], 0.8);
		pen.shadowBlur = SCALE * 2;
		pen.beginPath();
		pen.moveTo(left, y * SCALE);
		pen.lineTo(left, bottom);
		pen.lineTo(right, bottom);
		pen.lineTo(right, y * SCALE);
		pen.stroke();
		pen.restore();
	}
};

const drawSpouts = (pen, spouts = []) => {
	for (const { x, color } of spouts) {
		const left = (x - (SPOUT_WIDTH >> 1)) * SCALE;
		const right = left + SPOUT_WIDTH * SCALE;

		pen.save();
		pen.fillStyle = hex(colors.light(colors[color]));
		pen.strokeStyle = hex(colors.dark(colors[color]));
		pen.lineWidth = 2;
		pen.shadowColor = rgba(colors[color], 0.9);
		pen.shadowBlur = SCALE * 2;
		pen.beginPath();
		pen.moveTo(left - SCALE * 4, 0);
		pen.lineTo(right + SCALE * 4, 0);
		pen.lineTo(right, SCALE * 4);
		pen.lineTo(left, SCALE * 4);
		pen.closePath();
		pen.fill();
		pen.stroke();
		pen.restore();
	}
};

const lineColors = (players, playerId) => [
	hex(colors.lightest(colors[penHue(players, playerId)])),
	rgba(colors[penHue(players, playerId)], 0.9),
];

// What stays put between sand frames: sky, paint, wind, walls and lines. Drawn once each time the lines or players
// change, so a frame is a stamp of this plus the sand; glowing lines are too slow on a phone to draw every frame.
const drawStill = (width, height, state, players) => {
	const canvas = new OffscreenCanvas(width, height);
	const pen = canvas.getContext('2d');

	pen.drawImage(backdrop(width, height, state.level), 0, 0);
	drawPaints(pen, state.paints);
	drawWinds(pen, state.winds);
	// Sieves: a mesh of short dashes, holes and all, that only fine sand can fall through
	const drawSieve = (sieve, color = hex(colors.light(colors.teal))) => {
		pen.save();
		pen.strokeStyle = color;
		pen.lineWidth = SCALE;
		pen.setLineDash([SCALE * 0.6, SCALE * 0.6]);
		pen.beginPath();
		sieve.forEach(([x, y], at) => (at ? pen.lineTo : pen.moveTo).call(pen, (x + 0.5) * SCALE, (y + 0.5) * SCALE));
		pen.stroke();
		pen.restore();
	};

	for (const sieve of state.sieves ?? []) drawSieve(sieve);
	// This level's color recipes, written in color dots near the top: 🟡 + 🔵 = 🟢
	const dots = { yellow: '🟡', blue: '🔵', red: '🔴', green: '🟢', purple: '🟣', orange: '🟠', pink: '🩷', teal: '🩵' };

	(state.mixes ?? []).forEach(([first, second, made], at) =>
		bigText(pen, `${dots[first]} + ${dots[second]} = ${dots[made]}`, width / 2, (10 + at * 7) * SCALE, SCALE * 4.5, hex(colors.white)),
	);
	for (const wall of state.walls ?? [])
		strokeLine(pen, wall.map(([x, y]) => [x + 0.5, y + 0.5]), hex(colors.light(colors.gray)));
	// Ice: a pale blue glowing line with a thin white shine along it
	for (const ice of state.ices ?? []) {
		const points = ice.map(([x, y]) => [x + 0.5, y + 0.5]);

		strokeLine(pen, points, hex(colors.lighter(colors.blue)), rgba(colors.lightest(colors.blue), 0.9));
		pen.save();
		pen.strokeStyle = rgba(colors.white, 0.9);
		pen.lineWidth = 1.5;
		pen.beginPath();
		points.forEach(([x, y], at) => (at ? pen.lineTo : pen.moveTo).call(pen, (x - 0.5) * SCALE, (y - 0.5) * SCALE - SCALE * 0.4));
		pen.stroke();
		pen.restore();
	}
	// A sieve a player drew is a mesh in their color; any other line is solid
	for (const { points, by, sieve } of state.lines)
		if (sieve) drawSieve(points, lineColors(players, by)[0]);
		else strokeLine(pen, points.map(([x, y]) => [x + 0.5, y + 0.5]), ...lineColors(players, by));

	return canvas;
};

export const boardPainter = pen => {
	let still;
	let stillFor;

	return (state, drawing, players = [], me) => {
		const { width, height } = pen.canvas;

		if (stillFor?.lines !== state.lines || stillFor?.players !== players) {
			still = drawStill(width, height, state, players);
			stillFor = { lines: state.lines, players };
		}

		pen.drawImage(still, 0, 0);
		drawTwinkles(pen, state.level, width, height);
		drawGusts(pen, state.winds);
		drawWhirls(pen, state.whirls);
		drawWaters(pen, state.waters);
		drawLavas(pen, state.lavas);
		// Monsters: a creeping, bobbing 👾, or a dizzy 😵 after a bonk
		for (const { x, y, dizzy } of state.monsters ?? []) {
			const bob = dizzy > 0 ? 0 : Math.abs(Math.sin(performance.now() / 150)) * SCALE;

			bigText(pen, dizzy > 0 ? '😵' : '👾', (x + 3) * SCALE, (y + 3) * SCALE - bob, SCALE * 7, hex(colors.white));
		}
		// Rock that was lava: dark and lumpy, still glowing a little at the cracks
		for (const { x, y, width, height } of state.rocks ?? []) {
			pen.save();
			pen.fillStyle = hex(colors.darker(colors.gray));
			pen.shadowColor = rgba(colors.red, 0.5);
			pen.shadowBlur = SCALE;
			roundedBox(pen, x * SCALE, y * SCALE, width * SCALE, height * SCALE, SCALE * 1.5);
			pen.fill();
			pen.strokeStyle = rgba(colors.orange, 0.5);
			pen.lineWidth = 1;
			pen.beginPath();
			for (let crack = 1; crack < width / 5; crack++) {
				pen.moveTo((x + crack * 5) * SCALE, y * SCALE + 2);
				pen.lineTo((x + crack * 5 - 1.5) * SCALE, (y + height / 2) * SCALE);
				pen.lineTo((x + crack * 5 + 1) * SCALE, (y + height) * SCALE - 2);
			}
			pen.stroke();
			pen.restore();
		}
		for (const { x, y, width } of state.sliders ?? [])
			strokeLine(pen, [[x + 0.5, y + 0.5], [x + width + 0.5, y + 0.5]], hex(colors.lightest(colors.gray)), rgba(colors.teal, 0.9));
		drawCups(pen, state.cups);
		if (drawing) {
			const [line, glow] = lineColors(players, me);

			strokeLine(pen, drawing.map(([x, y]) => [x + 0.5, y + 0.5]), line, glow);
		}

		// Chunky grains are drawn big and fine grains small, so you can tell the sand apart at a glance
		for (const [x, y, name, , shade, texture] of state.grains) {
			const size = SCALE * (texture === 'chunky' ? 1.7 : texture === 'fine' ? 0.75 : 1);
			const offset = (SCALE - size) / 2;

			pen.fillStyle = sandColor(name, shade);
			pen.fillRect(x * SCALE + offset, y * SCALE + offset, size, size);
		}

		drawSparkles(pen, state);
		drawSpouts(pen, state.spouts);

		if (state.spoiled) bigText(pen, '😢', width / 2, height / 3, width / 4, hex(colors.white));
		// Won: the score as it's counted, with what's being counted under it (right sand, wrong sand, lines)
		if (state.won) {
			const { tally } = state;

			bigText(pen, `⏳ ${tally ? tally.score : state.caught ?? 0}`, width / 2, height / 3, width / 6, hex(colors.yellow));
			if (tally && tally.phase !== 'done')
				bigText(pen, { right: '✅ ➕', wrong: '❌ ➖', lines: '✏️ ➖' }[tally.phase], width / 2, height / 3 + width / 7, width / 10, hex(colors.white));
		}
		// The sand has stopped and the spouts are empty: count down the seconds left before the round ends
		if (!state.won && !state.spoiled && state.still > STEPS_PER_SECOND / 2)
			bigText(
				pen,
				`⏳ ${Math.max(1, Math.ceil((STILL_STEPS - state.still) / STEPS_PER_SECOND))}`,
				width / 2,
				height * 0.35,
				height / 9,
				hex(colors.lightest(colors.orange)),
			);
		if (state.wait > 0) {
			bigText(pen, String(Math.ceil(state.wait / STEPS_PER_SECOND)), width / 2, height / 2, height / 4, hex(colors.lightest(colors.yellow)));
			// Something new in this level: its hint under the countdown, on a dark band so it reads over anything
			(state.hints ?? []).forEach((hint, at) => {
				const y = height * 0.72 + at * height * 0.09;

				pen.fillStyle = rgba(colors.vantablack, 0.55);
				pen.fillRect(0, y - height * 0.04, width, height * 0.08);
				bigText(pen, hint, width / 2, y, height * 0.05, hex(colors.white));
			});
		}
	};
};

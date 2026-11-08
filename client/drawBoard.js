import { theme } from '@vanilla-bean/components';

import { SPOUT_WIDTH, STEPS_PER_SECOND } from '../sand.js';

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
const sandColor = (name, shade = 0) =>
	once(`sand${name}${shade}`, () => hex(colors.light(colors[name]).lighten(sandShades[shade])));

// A night sky over dunes, drawn once and stamped behind every frame
const backdrop = (width, height) =>
	once(`backdrop${width}x${height}`, () => {
		const canvas = new OffscreenCanvas(width, height);
		const pen = canvas.getContext('2d');
		const sky = pen.createLinearGradient(0, 0, 0, height);

		sky.addColorStop(0, hex(colors.darkest(colors.purple)));
		sky.addColorStop(0.7, hex(colors.darker(colors.blue)));
		sky.addColorStop(1, hex(colors.darker(colors.orange)));
		pen.fillStyle = sky;
		pen.fillRect(0, 0, width, height);

		pen.fillStyle = rgba(colors.white, 0.5);
		for (let star = 0; star < 40; star++) {
			const x = (star * 97) % width;
			const y = (star * 53) % (height * 0.6);

			pen.fillRect(x, y, star % 3 ? 1.5 : 2.5, star % 3 ? 1.5 : 2.5);
		}

		[
			[0.82, colors.darker(colors.orange), 0.5],
			[0.9, colors.dark(colors.orange), 0.35],
		].forEach(([top, color, alpha], layer) => {
			pen.fillStyle = rgba(color, alpha);
			pen.beginPath();
			pen.moveTo(0, height);
			for (let x = 0; x <= width; x += 8)
				pen.lineTo(x, height * top + Math.sin(x / (60 + layer * 30) + layer * 2) * height * 0.03);
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
		bigText(pen, '✨', (x + width / 2) * SCALE, (y + height / 2) * SCALE, height * SCALE * 0.6, hex(colors.white));
	}
};

const drawWinds = (pen, winds = []) => {
	for (const { x, y, width, height, blow } of winds) {
		pen.fillStyle = rgba(colors.teal, 0.18);
		roundedBox(pen, x * SCALE, y * SCALE, width * SCALE, height * SCALE, SCALE * 2);
		pen.fill();
		pen.fillStyle = rgba(colors.white, 0.5);
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

		strokeLine(
			pen,
			[
				[x + 0.5, y],
				[x + 0.5, y + height + 0.5],
				[x + width + 0.5, y + height + 0.5],
				[x + width + 0.5, y],
			],
			hex(colors.light(colors[color])),
			rgba(colors[color], 0.8),
		);
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

export const drawBoard = (pen, state, drawing, players = [], me) => {
	const { width, height } = pen.canvas;

	pen.drawImage(backdrop(width, height), 0, 0);

	drawPaints(pen, state.paints);
	drawWinds(pen, state.winds);
	drawCups(pen, state.cups);

	for (const wall of state.walls ?? [])
		strokeLine(pen, wall.map(([x, y]) => [x + 0.5, y + 0.5]), hex(colors.light(colors.gray)));
	for (const { points, by } of state.lines)
		strokeLine(pen, points.map(([x, y]) => [x + 0.5, y + 0.5]), hex(colors.lightest(colors[penHue(players, by)])), rgba(colors[penHue(players, by)], 0.9));
	if (drawing)
		strokeLine(pen, drawing.map(([x, y]) => [x + 0.5, y + 0.5]), rgba(colors.lightest(colors[penHue(players, me)]), 0.6), rgba(colors[penHue(players, me)], 0.6));

	for (const [x, y, name, , shade] of state.grains) {
		pen.fillStyle = sandColor(name, shade);
		pen.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
	}

	drawSpouts(pen, state.spouts);

	if (state.spoiled) bigText(pen, '😢', width / 2, height / 3, width / 4, hex(colors.white));
	if (state.won)
		bigText(pen, '⭐'.repeat(state.stars) + '☆'.repeat(3 - state.stars), width / 2, height / 3, width / 6, hex(colors.yellow));
	if (state.wait > 0)
		bigText(pen, String(Math.ceil(state.wait / STEPS_PER_SECOND)), width / 2, height / 2, height / 4, hex(colors.lightest(colors.yellow)));
};

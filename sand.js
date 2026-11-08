export const WIDTH = 80;
export const HEIGHT = 110;

export const SPOUT_WIDTH = 4;
export const SHADES = 4;
export const STEPS_PER_SECOND = 60;

const COLORS = ['yellow', 'blue', 'red', 'green', 'purple', 'orange', 'pink', 'teal'];

// Sand as three bytes a grain (x, y, color), so a whole box of it is a short message
export const pack = grains =>
	btoa(String.fromCharCode(...grains.flatMap(([x, y, color, , shade = 0]) => [x, y, COLORS.indexOf(color) * SHADES + shade])));

export const unpack = packed => {
	const bytes = Uint8Array.from(atob(packed), character => character.charCodeAt(0));
	const grains = [];

	for (let at = 0; at < bytes.length; at += 3) grains.push([bytes[at], bytes[at + 1], COLORS[Math.floor(bytes[at + 2] / SHADES)], 0, bytes[at + 2] % SHADES]);

	return grains;
};

export const levels = [
	{
		par: 70,
		spouts: [{ x: 12, color: 'yellow', amount: 300 }],
		cups: [{ x: 56, y: 90, width: 16, height: 16, color: 'yellow', need: 120 }],
	},
	{
		par: 75,
		spouts: [{ x: 66, color: 'yellow', amount: 300 }],
		cups: [{ x: 6, y: 88, width: 14, height: 18, color: 'yellow', need: 120 }],
	},
	{
		par: 85,
		spouts: [{ x: 40, color: 'yellow', amount: 300 }],
		walls: [
			[
				[28, 40],
				[52, 40],
			],
		],
		cups: [{ x: 34, y: 92, width: 12, height: 14, color: 'yellow', need: 100 }],
	},
	{
		par: 90,
		spouts: [{ x: 10, color: 'yellow', amount: 320 }],
		walls: [
			[
				[40, 30],
				[40, 100],
			],
		],
		cups: [{ x: 58, y: 90, width: 14, height: 16, color: 'yellow', need: 120 }],
	},
	{
		par: 120,
		spouts: [{ x: 12, color: 'yellow', amount: 320 }],
		paints: [{ x: 50, y: 40, width: 16, height: 10, color: 'blue' }],
		cups: [{ x: 8, y: 90, width: 14, height: 16, color: 'blue', need: 100 }],
	},
	{
		par: 115,
		spouts: [
			{ x: 30, color: 'yellow', amount: 250 },
			{ x: 50, color: 'blue', amount: 250 },
		],
		cups: [
			{ x: 4, y: 90, width: 14, height: 16, color: 'yellow', need: 90 },
			{ x: 62, y: 90, width: 14, height: 16, color: 'blue', need: 90 },
		],
	},
	{
		par: 110,
		spouts: [{ x: 40, color: 'yellow', amount: 400 }],
		paints: [{ x: 8, y: 50, width: 16, height: 8, color: 'blue' }],
		cups: [
			{ x: 6, y: 90, width: 14, height: 16, color: 'blue', need: 90 },
			{ x: 60, y: 90, width: 14, height: 16, color: 'yellow', need: 90 },
		],
	},
	{
		par: 60,
		spouts: [{ x: 8, color: 'yellow', amount: 350 }],
		walls: [
			[
				[0, 45],
				[30, 45],
			],
			[
				[50, 70],
				[79, 70],
			],
		],
		cups: [{ x: 62, y: 50, width: 14, height: 14, color: 'yellow', need: 100 }],
	},
	{
		par: 120,
		spouts: [
			{ x: 14, color: 'yellow', amount: 300 },
			{ x: 66, color: 'yellow', amount: 300 },
		],
		paints: [{ x: 60, y: 40, width: 14, height: 8, color: 'red' }],
		walls: [
			[
				[40, 30],
				[40, 105],
			],
		],
		cups: [
			{ x: 22, y: 90, width: 14, height: 16, color: 'yellow', need: 90 },
			{ x: 46, y: 90, width: 14, height: 16, color: 'red', need: 90 },
		],
	},
	{
		par: 40,
		spouts: [{ x: 12, color: 'yellow', amount: 350 }],
		winds: [{ x: 0, y: 30, width: 80, height: 14, blow: 1 }],
		walls: [
			[
				[50, 60],
				[50, 105],
			],
		],
		cups: [
			{ x: 60, y: 90, width: 14, height: 16, color: 'yellow', need: 100 },
		],
	},
	{
		par: 90,
		spouts: [
			{ x: 20, color: 'yellow', amount: 300 },
			{ x: 60, color: 'blue', amount: 300 },
		],
		winds: [{ x: 0, y: 55, width: 80, height: 12, blow: -1 }],
		cups: [
			{ x: 14, y: 90, width: 14, height: 16, color: 'yellow', need: 90 },
			{ x: 54, y: 90, width: 14, height: 16, color: 'blue', need: 90 },
		],
	},
	{
		par: 60,
		spouts: [{ x: 10, color: 'yellow', amount: 350 }],
		cups: [{ x: 30, y: 90, width: 14, height: 16, color: 'yellow', need: 120, slide: { from: 30, to: 62, every: 6 } }],
	},
	{
		par: 70,
		spouts: [
			{ x: 10, color: 'yellow', amount: 500 },
			{ x: 40, color: 'blue', amount: 300 },
		],
		cups: [
			{ x: 4, y: 92, width: 14, height: 14, color: 'yellow', need: 80, slide: { from: 4, to: 46, every: 5 } },
			{ x: 62, y: 92, width: 14, height: 14, color: 'blue', need: 90 },
		],
	},
	{
		par: 45,
		spouts: [
			{ x: 12, color: 'yellow', amount: 450 },
			{ x: 66, color: 'blue', amount: 600 },
		],
		winds: [{ x: 0, y: 28, width: 38, height: 10, blow: 1 }],
		paints: [{ x: 42, y: 54, width: 14, height: 8, color: 'red' }],
		walls: [
			[
				[40, 70],
				[40, 105],
			],
		],
		cups: [
			{ x: 2, y: 92, width: 14, height: 14, color: 'yellow', need: 100, slide: { from: 2, to: 22, every: 6 } },
			{ x: 43, y: 92, width: 14, height: 14, color: 'red', need: 100 },
			{ x: 62, y: 92, width: 14, height: 14, color: 'blue', need: 100 },
		],
	},
];

const index = (x, y) => y * WIDTH + x;
const inside = (x, y) => x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT;

export const newRound = level => ({
	level,
	spouts: levels[level].spouts,
	wait: 3 * STEPS_PER_SECOND,
	par: levels[level].par,
	ink: 0,
	stars: 0,
	walls: levels[level].walls ?? [],
	paints: levels[level].paints ?? [],
	winds: levels[level].winds ?? [],
	lines: [],
	grains: [],
	poured: levels[level].spouts.map(() => 0),
	cups: levels[level].cups.map(cup => ({ ...cup, count: 0, heading: 1 })),
	steps: 0,
	won: false,
	spoiled: false,
});

const stamp = (walls, x, y) => {
	for (let dy = -1; dy <= 0; dy++)
		for (let dx = -1; dx <= 0; dx++) if (inside(x + dx, y + dy)) walls[index(x + dx, y + dy)] = 1;
};

const drawSegment = (walls, [x1, y1], [x2, y2]) => {
	const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), 1);

	for (let step = 0; step <= steps; step++)
		stamp(walls, Math.round(x1 + ((x2 - x1) * step) / steps), Math.round(y1 + ((y2 - y1) * step) / steps));
};

export const buildWalls = round => {
	const walls = new Uint8Array(WIDTH * HEIGHT);

	for (const { x, y, width, height } of round.cups) {
		drawSegment(walls, [x, y], [x, y + height]);
		drawSegment(walls, [x + width, y], [x + width, y + height]);
		drawSegment(walls, [x, y + height], [x + width, y + height]);
	}

	for (const line of [...round.walls, ...round.lines.map(({ points }) => points)])
		for (let at = 1; at < line.length; at++) drawSegment(walls, line[at - 1], line[at]);

	return walls;
};

const inBox = ({ x, y, width, height }, grainX, grainY) =>
	grainX > x && grainX < x + width && grainY > y && grainY < y + height;

export const inkOf = line =>
	line.reduce((total, [x, y], at) => (at ? total + Math.hypot(x - line[at - 1][0], y - line[at - 1][1]) : total), 0);

const distanceToSegment = ([px, py], [x1, y1], [x2, y2]) => {
	const length = (x2 - x1) ** 2 + (y2 - y1) ** 2;
	const along = length ? Math.max(0, Math.min(1, ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / length)) : 0;

	return Math.hypot(px - (x1 + along * (x2 - x1)), py - (y1 + along * (y2 - y1)));
};

// The strokes with a piece passing within reach of a point
export const linesNear = (lines, point, reach) =>
	new Set(
		lines
			.filter(({ points }) =>
				points.some((at, index) => distanceToSegment(point, points[Math.max(0, index - 1)], at) <= reach),
			)
			.map(({ stroke }) => stroke),
	);

// Sand a new line lands on is pushed up out of it, not lost
export const liftOutOfWalls = (round, walls) => {
	const taken = new Uint8Array(walls);

	for (const [x, y] of round.grains) if (!walls[index(x, y)]) taken[index(x, y)] = 1;

	round.grains = round.grains.filter(grain => {
		if (!walls[index(grain[0], grain[1])]) return true;

		for (let y = grain[1] - 1; y >= 0; y--) {
			if (taken[index(grain[0], y)]) continue;

			grain[1] = y;
			taken[index(grain[0], y)] = 1;

			return true;
		}

		return false;
	});
};

// One step of falling sand; says whether anything changed
// A cup with a `slide` moves a cell at a time between its two ends, taking the sand inside it along
const slideCups = (round, walls) => {
	let moved = false;

	for (const cup of round.cups) {
		if (!cup.slide || round.steps % cup.slide.every) continue;

		if (cup.x + cup.heading < cup.slide.from || cup.x + cup.heading > cup.slide.to) cup.heading = -cup.heading;

		const inside = round.grains.filter(([x, y]) => inBox(cup, x, y));

		cup.x += cup.heading;
		for (const grain of inside) grain[0] += cup.heading;
		moved = true;
	}

	if (!moved) return false;

	walls.set(buildWalls(round));
	liftOutOfWalls(round, walls);

	return true;
};

export const step = (round, walls) => {
	round.steps = (round.steps ?? 0) + 1;

	const slid = round.wait > 0 ? false : slideCups(round, walls);
	const taken = new Uint8Array(walls);
	let changed = slid;

	for (const [x, y] of round.grains) taken[index(x, y)] = 1;

	// A count of three before any sand comes
	if (round.wait > 0) {
		round.wait--;

		return round.wait % STEPS_PER_SECOND === 0;
	}

	// Each spout pours from a mouth a few grains wide, a grain or two at a time, so the stream has some spread
	if (!round.spoiled) round.spouts.forEach((spout, at) => {
		for (let count = 0; count < 2; count++) {
			const x = spout.x + Math.floor(Math.random() * SPOUT_WIDTH) - (SPOUT_WIDTH >> 1);

			if (round.poured[at] >= spout.amount || taken[index(x, 0)] || Math.random() < 0.4) continue;

			round.grains.push([x, 0, spout.color, Math.random() < 0.5 ? -1 : 1, Math.floor(Math.random() * SHADES)]);
			taken[index(x, 0)] = 1;
			round.poured[at]++;
			changed = true;
		}
	});

	round.grains.sort((a, b) => b[1] - a[1]);
	const move = (grain, toX, toY) => {
		taken[index(grain[0], grain[1])] = walls[index(grain[0], grain[1])];
		taken[index(toX, toY)] = 1;
		grain[0] = toX;
		grain[1] = toY;
		changed = true;
	};

	// Down if it can, else down to a side; on a line (not on other sand) it slides along, so lines carry sand
	round.grains = round.grains.filter(grain => {
		const [x, y] = grain;
		const side = grain[3];

		// Under a line drawn on top of it, or off the bottom: gone
		if (walls[index(x, y)] || y + 1 >= HEIGHT) {
			taken[index(x, y)] = walls[index(x, y)];
			changed = true;

			return false;
		}

		if (Math.random() < 0.08) return true;

		// In the wind, sand is blown sideways more often than it falls
		const wind = round.winds?.find(box => inBox(box, x, y));

		if (wind && Math.random() < 0.7) {
			const toX = x + wind.blow;

			grain[3] = wind.blow;
			if (toX >= 0 && toX < WIDTH && !taken[index(toX, y)]) {
				move(grain, toX, y);

				return true;
			}
		}

		for (const [dx, dy] of [
			[0, 1],
			[side, 1],
			[-side, 1],
		]) {
			const toX = x + dx;

			if (toX < 0 || toX >= WIDTH || taken[index(toX, y + dy)]) continue;

			if (dx) grain[3] = dx;
			move(grain, toX, y + dy);

			return true;
		}

		if (walls[index(x, y + 1)]) {
			const toX = x + side;

			if (toX >= 0 && toX < WIDTH && !taken[index(toX, y)]) move(grain, toX, y);
		}

		return true;
	});

	for (const grain of round.grains)
		for (const paint of round.paints ?? []) if (inBox(paint, grain[0], grain[1])) grain[2] = paint.color;

	for (const cup of round.cups)
		cup.count = round.grains.filter(([x, y, color]) => color === cup.color && inBox(cup, x, y)).length;

	// Sand of the wrong color in a cup spoils the round: the spouts stop, and it's time to try again
	if (!round.won && round.grains.some(([x, y, color]) => round.cups.some(cup => color !== cup.color && inBox(cup, x, y))))
		round.spoiled = true;

	if (!round.won && !round.spoiled && round.cups.every(cup => cup.count >= cup.need)) {
		round.won = true;
		round.stars = round.ink <= round.par ? 3 : round.ink <= round.par * 2 ? 2 : 1;
	}

	// Every spout empty and the sand gone still, without the cups full: the round is over
	const pouredAll = round.spouts.every((spout, at) => round.poured[at] >= spout.amount);

	if (!changed && pouredAll && !round.won && !round.spoiled) {
		round.spoiled = true;
		changed = true;
	}

	return changed;
};

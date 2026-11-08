export const WIDTH = 80;
export const HEIGHT = 110;

export const levels = [
	{
		spouts: [{ x: 12, color: 'yellow', amount: 300 }],
		cups: [{ x: 56, y: 90, width: 16, height: 16, color: 'yellow', need: 120 }],
	},
	{
		spouts: [{ x: 66, color: 'yellow', amount: 300 }],
		cups: [{ x: 6, y: 88, width: 14, height: 18, color: 'yellow', need: 120 }],
	},
	{
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
		spouts: [{ x: 10, color: 'yellow', amount: 320 }],
		walls: [
			[
				[40, 30],
				[40, 100],
			],
		],
		cups: [{ x: 58, y: 90, width: 14, height: 16, color: 'yellow', need: 120 }],
	},
];

const index = (x, y) => y * WIDTH + x;
const inside = (x, y) => x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT;

export const newRound = level => ({
	level,
	walls: levels[level].walls ?? [],
	lines: [],
	grains: [],
	poured: levels[level].spouts.map(() => 0),
	cups: levels[level].cups.map(cup => ({ ...cup, count: 0 })),
	won: false,
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

	for (const line of [...round.walls, ...round.lines])
		for (let at = 1; at < line.length; at++) drawSegment(walls, line[at - 1], line[at]);

	return walls;
};

const inCup = ({ x, y, width, height }, grainX, grainY) =>
	grainX > x && grainX < x + width && grainY > y && grainY < y + height;

// One step of falling sand; says whether anything changed
export const step = (round, walls) => {
	const taken = new Uint8Array(walls);
	let changed = false;

	for (const [x, y] of round.grains) taken[index(x, y)] = 1;

	levels[round.level].spouts.forEach((spout, at) => {
		if (round.poured[at] >= spout.amount || taken[index(spout.x, 0)]) return;

		round.grains.push([spout.x, 0, spout.color, Math.random() < 0.5 ? -1 : 1]);
		taken[index(spout.x, 0)] = 1;
		round.poured[at]++;
		changed = true;
	});

	round.grains.sort((a, b) => b[1] - a[1]);
	const move = (grain, toX, toY) => {
		taken[index(grain[0], grain[1])] = 0;
		taken[index(toX, toY)] = 1;
		grain[0] = toX;
		grain[1] = toY;
		changed = true;
	};

	// Down if it can, else down to a side; on a line (not on other sand) it slides along, so lines carry sand
	round.grains = round.grains.filter(grain => {
		const [x, y] = grain;
		const side = grain[3];

		if (y + 1 >= HEIGHT) {
			taken[index(x, y)] = 0;
			changed = true;

			return false;
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

	for (const cup of round.cups)
		cup.count = round.grains.filter(([x, y, color]) => color === cup.color && inCup(cup, x, y)).length;

	round.won = round.cups.every(cup => cup.count >= cup.need);

	return changed;
};

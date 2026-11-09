export const WIDTH = 80;
export const HEIGHT = 110;

export const SPOUT_WIDTH = 4;
export const SHADES = 4;
export const STEPS_PER_SECOND = 60;
// How long all the sand must sit still, every spout empty, before a round that isn't won is over
export const STILL_STEPS = 5 * STEPS_PER_SECOND;

// Gray is dirt: it belongs in no jar, and water washes it away
// Gold comes from wishing on a shooting star: it's welcome in every jar and worth extra
// and a gem, now and then one in a spout's pour, is welcome anywhere and worth even more
const COLORS = ['yellow', 'blue', 'red', 'green', 'purple', 'orange', 'pink', 'teal', 'gray', 'gold', 'gem'];
export const GOLD_POINTS = 3;
export const GEM_POINTS = 10;
const GEM_CHANCE = 1 / 70;
// Treasure: never the wrong color, never painted, mixed or washed away
const treasure = color => color === 'gold' || color === 'gem';
// How big a grain is: 'chunky' is heavy and piles up steep, 'fine' runs flat almost like water and slips through sieves
const TEXTURES = ['normal', 'chunky', 'fine'];

// Sand as three bytes a grain (x, y, and its color, size and shade in one), so a whole box of it is a short message
export const pack = grains =>
	btoa(
		String.fromCharCode(
			...grains.flatMap(([x, y, color, , shade = 0, texture = 'normal']) => [
				x,
				y,
				(Math.max(0, TEXTURES.indexOf(texture)) * COLORS.length + COLORS.indexOf(color)) * SHADES + shade,
			]),
		),
	);

export const unpack = packed => {
	const bytes = Uint8Array.from(atob(packed), character => character.charCodeAt(0));
	const grains = [];

	for (let at = 0; at < bytes.length; at += 3) {
		const kind = Math.floor(bytes[at + 2] / SHADES);

		grains.push([bytes[at], bytes[at + 1], COLORS[kind % COLORS.length], 0, bytes[at + 2] % SHADES, TEXTURES[Math.floor(kind / COLORS.length)]]);
	}

	return grains;
};

export const levels = [
	// ─── World 1: Start ───
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
	// Swap: each color starts over the other color's jar, with a pillar in the middle to get past
	{
		par: 90,
		spouts: [
			{ x: 14, color: 'blue', amount: 300 },
			{ x: 66, color: 'yellow', amount: 300 },
		],
		walls: [
			[
				[40, 50],
				[40, 105],
			],
		],
		cups: [
			{ x: 6, y: 90, width: 14, height: 16, color: 'yellow', need: 90 },
			{ x: 60, y: 90, width: 14, height: 16, color: 'blue', need: 90 },
		],
	},
	// New colors: purple and orange sand, with a shelf in the way
	{
		par: 100,
		spouts: [
			{ x: 30, color: 'purple', amount: 300 },
			{ x: 50, color: 'orange', amount: 300 },
		],
		walls: [
			[
				[20, 50],
				[60, 50],
			],
		],
		cups: [
			{ x: 60, y: 90, width: 14, height: 16, color: 'purple', need: 90 },
			{ x: 6, y: 90, width: 14, height: 16, color: 'orange', need: 90 },
		],
	},
	// ─── World 2: Colors ───
	{
		par: 120,
		spouts: [{ x: 12, color: 'yellow', amount: 320 }],
		paints: [{ x: 50, y: 40, width: 16, height: 10, color: 'blue' }],
		cups: [{ x: 8, y: 90, width: 14, height: 16, color: 'blue', need: 100 }],
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
	// Split: one pile of sand has to be shared, half turned red on one side and half turned blue on the other
	{
		par: 110,
		spouts: [{ x: 40, color: 'yellow', amount: 450 }],
		paints: [
			{ x: 6, y: 55, width: 16, height: 8, color: 'red' },
			{ x: 58, y: 55, width: 16, height: 8, color: 'blue' },
		],
		cups: [
			{ x: 6, y: 90, width: 14, height: 16, color: 'red', need: 90 },
			{ x: 60, y: 90, width: 14, height: 16, color: 'blue', need: 90 },
		],
	},
	// Pink sand: it pours from the top, and yellow sand turns pink in the middle, so both fill the pink jar
	{
		par: 90,
		spouts: [
			{ x: 66, color: 'pink', amount: 250 },
			{ x: 14, color: 'yellow', amount: 250 },
		],
		paints: [{ x: 32, y: 50, width: 16, height: 8, color: 'pink' }],
		cups: [{ x: 33, y: 88, width: 14, height: 18, color: 'pink', need: 150 }],
	},
	// Stairs: sand bounces down three steps, turns green, and lands in the jar at the bottom
	{
		par: 80,
		spouts: [{ x: 10, color: 'yellow', amount: 350 }],
		walls: [
			[
				[0, 30],
				[26, 30],
			],
			[
				[22, 52],
				[50, 52],
			],
			[
				[46, 74],
				[79, 74],
			],
		],
		paints: [{ x: 30, y: 40, width: 14, height: 8, color: 'green' }],
		cups: [{ x: 8, y: 90, width: 14, height: 16, color: 'green', need: 100 }],
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
	// Mixing: yellow and blue sand that touch turn green, and only green fills the jar
	{
		par: 90,
		spouts: [
			{ x: 14, color: 'yellow', amount: 350 },
			{ x: 66, color: 'blue', amount: 350 },
		],
		mixes: [['yellow', 'blue', 'green']],
		whirls: [{ x: 40, y: 50, size: 14, spin: 1 }],
		cups: [{ x: 33, y: 88, width: 14, height: 18, color: 'green', need: 100 }],
	},
	// Two mixes from three spouts: red with yellow makes orange, red with blue makes purple
	{
		par: 120,
		spouts: [
			{ x: 12, color: 'yellow', amount: 300 },
			{ x: 40, color: 'red', amount: 500 },
			{ x: 68, color: 'blue', amount: 300 },
		],
		mixes: [
			['red', 'yellow', 'orange'],
			['red', 'blue', 'purple'],
		],
		whirls: [
			{ x: 20, y: 52, size: 12, spin: 1 },
			{ x: 60, y: 52, size: 12, spin: -1 },
		],
		cups: [
			{ x: 13, y: 90, width: 14, height: 16, color: 'orange', need: 70 },
			{ x: 53, y: 90, width: 14, height: 16, color: 'purple', need: 70 },
		],
	},
	// ─── World 3: Wind ───
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
	// A whirlwind: the sand gets caught and spins round, and drops out all over the place
	{
		par: 90,
		spouts: [{ x: 40, color: 'yellow', amount: 400 }],
		whirls: [{ x: 40, y: 40, size: 16, spin: 1 }],
		cups: [{ x: 60, y: 90, width: 14, height: 16, color: 'yellow', need: 100 }],
	},
	// Two whirlwinds spinning opposite ways: the colors swirl and mix, and need sorting out at the bottom
	{
		par: 120,
		spouts: [
			{ x: 22, color: 'blue', amount: 350 },
			{ x: 58, color: 'pink', amount: 350 },
		],
		whirls: [
			{ x: 28, y: 42, size: 13, spin: 1 },
			{ x: 52, y: 42, size: 13, spin: -1 },
		],
		cups: [
			{ x: 4, y: 90, width: 14, height: 16, color: 'blue', need: 90 },
			{ x: 62, y: 90, width: 14, height: 16, color: 'pink', need: 90 },
		],
	},
	// ─── World 4: Moving ───
	{
		par: 60,
		spouts: [{ x: 10, color: 'yellow', amount: 350 }],
		cups: [{ x: 30, y: 90, width: 14, height: 16, color: 'yellow', need: 120, slide: { from: 30, to: 62, every: 6 } }],
	},
	// A moving spout: it sweeps back and forth over the top, so the sand never falls in the same place
	{
		par: 80,
		spouts: [{ x: 10, color: 'yellow', amount: 350, slide: { from: 10, to: 70, every: 4 } }],
		cups: [{ x: 33, y: 90, width: 14, height: 16, color: 'yellow', need: 110 }],
	},
	// A moving wall: a bar slides back and forth under the sand, so a line has to catch it at the right time
	{
		par: 80,
		spouts: [{ x: 40, color: 'yellow', amount: 350 }],
		sliders: [{ x: 20, y: 45, width: 22, slide: { from: 10, to: 48, every: 5 } }],
		cups: [{ x: 60, y: 90, width: 14, height: 16, color: 'yellow', need: 110 }],
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
	// Two moving spouts that cross over each other, each with its own jar
	{
		par: 110,
		spouts: [
			{ x: 10, color: 'blue', amount: 300, slide: { from: 10, to: 70, every: 5 } },
			{ x: 70, color: 'orange', amount: 300, slide: { from: 10, to: 70, every: 5 } },
		],
		walls: [
			[
				[40, 70],
				[40, 105],
			],
		],
		cups: [
			{ x: 6, y: 90, width: 14, height: 16, color: 'blue', need: 90 },
			{ x: 60, y: 90, width: 14, height: 16, color: 'orange', need: 90 },
		],
	},
	// Three moving walls stacked up, sliding different ways and speeds, and the jar off to one side
	{
		par: 90,
		spouts: [{ x: 40, color: 'green', amount: 400 }],
		sliders: [
			{ x: 10, y: 35, width: 18, slide: { from: 10, to: 52, every: 4 } },
			{ x: 52, y: 55, width: 18, slide: { from: 10, to: 52, every: 6 } },
			{ x: 30, y: 75, width: 14, slide: { from: 20, to: 46, every: 5 } },
		],
		cups: [{ x: 62, y: 90, width: 14, height: 16, color: 'green', need: 110 }],
	},
	// Three jars from one moving spout: keep some yellow, and turn the rest red on one side and blue on the other
	{
		par: 130,
		spouts: [{ x: 20, color: 'yellow', amount: 550, slide: { from: 20, to: 60, every: 4 } }],
		paints: [
			{ x: 4, y: 58, width: 16, height: 8, color: 'red' },
			{ x: 60, y: 58, width: 16, height: 8, color: 'blue' },
		],
		cups: [
			{ x: 4, y: 90, width: 14, height: 16, color: 'red', need: 70 },
			{ x: 33, y: 90, width: 14, height: 16, color: 'yellow', need: 70 },
			{ x: 62, y: 90, width: 14, height: 16, color: 'blue', need: 70 },
		],
	},
	// ─── World 5: Sizes ───
	// Chunky sand: big heavy grains that pile up tall and only slide down a steep line
	{
		par: 80,
		texture: 'chunky',
		spouts: [{ x: 14, color: 'orange', amount: 300 }],
		walls: [
			[
				[30, 60],
				[50, 60],
			],
		],
		cups: [{ x: 60, y: 90, width: 14, height: 16, color: 'orange', need: 90 }],
	},
	// Fine sand: tiny grains that run along flat shelves almost like water
	{
		par: 70,
		texture: 'fine',
		spouts: [{ x: 10, color: 'teal', amount: 400 }],
		walls: [
			[
				[0, 40],
				[50, 40],
			],
			[
				[30, 70],
				[79, 70],
			],
		],
		cups: [{ x: 4, y: 90, width: 14, height: 16, color: 'teal', need: 110 }],
	},
	// Sorting by size: one spout pours chunky red and fine blue all jumbled; the sieve lets only the fine sand through
	{
		par: 90,
		spouts: [
			{
				x: 20,
				amount: 500,
				mix: [
					{ color: 'red', texture: 'chunky' },
					{ color: 'blue', texture: 'fine' },
				],
			},
		],
		sieves: [
			[
				[4, 45],
				[50, 55],
			],
		],
		cups: [
			{ x: 6, y: 90, width: 14, height: 16, color: 'blue', need: 70 },
			{ x: 60, y: 90, width: 14, height: 16, color: 'red', need: 90 },
		],
	},
	// Sorting in the wind: fine sand blows far away, chunky sand drops nearly straight down
	{
		par: 90,
		spouts: [
			{
				x: 12,
				amount: 500,
				mix: [
					{ color: 'green', texture: 'fine' },
					{ color: 'purple', texture: 'chunky' },
				],
			},
		],
		winds: [{ x: 0, y: 30, width: 72, height: 20, blow: 1 }],
		cups: [
			{ x: 40, y: 90, width: 14, height: 16, color: 'purple', need: 90 },
			{ x: 62, y: 90, width: 14, height: 16, color: 'green', need: 90 },
		],
	},
	// Dirty sand: gray dirt is mixed in with the yellow, and has to be washed out in the water before the jar
	{
		par: 90,
		spouts: [
			{
				x: 14,
				amount: 450,
				mix: [
					{ color: 'yellow' },
					{ color: 'yellow' },
					{ color: 'gray' },
				],
			},
		],
		waters: [{ x: 50, y: 60, width: 18, height: 10 }],
		cups: [{ x: 60, y: 90, width: 14, height: 16, color: 'yellow', need: 110 }],
	},
	// Sieve, then wash: chunky red rolls off the sieve, fine blue and fine dirt fall through, and the dirt must be washed
	{
		par: 120,
		spouts: [
			{
				x: 20,
				amount: 600,
				mix: [
					{ color: 'red', texture: 'chunky' },
					{ color: 'blue', texture: 'fine' },
					{ color: 'gray', texture: 'fine' },
				],
			},
		],
		sieves: [
			[
				[4, 40],
				[46, 50],
			],
		],
		waters: [{ x: 2, y: 66, width: 20, height: 10 }],
		cups: [
			{ x: 6, y: 90, width: 14, height: 16, color: 'blue', need: 60 },
			{ x: 60, y: 90, width: 14, height: 16, color: 'red', need: 90 },
		],
	},
	// ─── World 6: Ice ───
	// A flat ice shelf: sand skates off whichever end it's headed for, so block the wrong end
	{
		par: 60,
		spouts: [{ x: 22, color: 'blue', amount: 250 }],
		ices: [
			[
				[4, 50],
				[40, 50],
			],
		],
		cups: [{ x: 42, y: 90, width: 18, height: 16, color: 'blue', need: 130 }],
	},
	// An icy slope: the sand comes down too fast and flies past the jar unless something stops it
	{
		par: 70,
		spouts: [{ x: 8, color: 'teal', amount: 350 }],
		ices: [
			[
				[0, 30],
				[40, 60],
			],
		],
		cups: [{ x: 28, y: 90, width: 14, height: 16, color: 'teal', need: 110 }],
	},
	// Two colors on one ice shelf, each needing to skate off its own end
	{
		par: 100,
		spouts: [
			{ x: 32, color: 'yellow', amount: 200 },
			{ x: 48, color: 'purple', amount: 200 },
		],
		ices: [
			[
				[24, 45],
				[56, 45],
			],
		],
		cups: [
			{ x: 2, y: 90, width: 14, height: 16, color: 'yellow', need: 100 },
			{ x: 64, y: 90, width: 14, height: 16, color: 'purple', need: 100 },
		],
	},
	// ─── World 7: Lava ───
	// Lava right under the spout: steer the sand around it to the jar
	{
		par: 70,
		spouts: [{ x: 40, color: 'orange', amount: 350 }],
		lavas: [{ x: 28, y: 68, width: 24, height: 8 }],
		cups: [{ x: 60, y: 90, width: 14, height: 16, color: 'orange', need: 110 }],
	},
	// A lava floor with one jar in the middle: every grain that misses burns
	{
		par: 80,
		spouts: [{ x: 12, color: 'red', amount: 350 }],
		lavas: [
			{ x: 0, y: 100, width: 32, height: 9 },
			{ x: 48, y: 100, width: 32, height: 9 },
		],
		cups: [{ x: 33, y: 90, width: 14, height: 16, color: 'red', need: 110 }],
	},
	// A moving spout over two lava pits, with a jar on each side
	{
		par: 110,
		spouts: [{ x: 20, color: 'yellow', amount: 450, slide: { from: 20, to: 60, every: 4 } }],
		lavas: [
			{ x: 22, y: 76, width: 14, height: 8 },
			{ x: 44, y: 76, width: 14, height: 8 },
		],
		cups: [
			{ x: 4, y: 90, width: 14, height: 16, color: 'yellow', need: 70 },
			{ x: 62, y: 90, width: 14, height: 16, color: 'yellow', need: 70 },
		],
	},
	// Moving lava: a pool creeps back and forth under the sand, so time it or build a bridge over it
	{
		par: 90,
		spouts: [{ x: 30, color: 'green', amount: 400 }],
		lavas: [{ x: 20, y: 72, width: 22, height: 8, slide: { from: 4, to: 54, every: 5 } }],
		cups: [{ x: 60, y: 90, width: 14, height: 16, color: 'green', need: 100 }],
	},
	// A volcano: sand shoots up out of it and rains down, with lava on each side to catch what misses
	{
		par: 110,
		spouts: [{ x: 40, y: 100, volcano: 55, color: 'orange', amount: 400 }],
		walls: [
			[
				[30, 108],
				[37, 101],
			],
			[
				[43, 101],
				[50, 108],
			],
		],
		lavas: [
			{ x: 0, y: 102, width: 28, height: 7 },
			{ x: 52, y: 102, width: 28, height: 7 },
		],
		cups: [
			{ x: 6, y: 60, width: 14, height: 16, color: 'orange', need: 75 },
			{ x: 60, y: 60, width: 14, height: 16, color: 'orange', need: 75 },
		],
	},
	// A sneaky monster creeps along the bottom and eats sand from the jars; tap it to bonk it back home
	{
		par: 100,
		spouts: [{ x: 20, color: 'red', amount: 300 }],
		lavas: [{ x: 36, y: 70, width: 18, height: 8 }],
		monsters: [{ x: 0, y: 102, every: 8 }],
		cups: [
			{ x: 14, y: 84, width: 14, height: 16, color: 'red', need: 120 },
			{ x: 60, y: 84, width: 14, height: 16, color: 'red', need: 120 },
		],
	},
	// Two monsters creep in from both sides, but a lava pit slides along the floor between the jars: they may walk
	// right into it and go poof
	{
		par: 110,
		spouts: [
			{ x: 34, color: 'yellow', amount: 300 },
			{ x: 46, color: 'blue', amount: 300 },
		],
		lavas: [{ x: 34, y: 104, width: 12, height: 5, slide: { from: 30, to: 40, every: 10 } }],
		monsters: [
			{ x: 0, y: 102, every: 9 },
			{ x: 74, y: 102, every: 9, heading: -1 },
		],
		cups: [
			{ x: 13, y: 84, width: 14, height: 16, color: 'yellow', need: 120 },
			{ x: 53, y: 84, width: 14, height: 16, color: 'blue', need: 120 },
		],
	},
	// Wind blows the sand toward the lava; a line has to shield it
	{
		par: 90,
		spouts: [{ x: 14, color: 'pink', amount: 400 }],
		winds: [{ x: 0, y: 40, width: 80, height: 14, blow: 1 }],
		lavas: [{ x: 56, y: 60, width: 24, height: 10 }],
		cups: [{ x: 30, y: 90, width: 14, height: 16, color: 'pink', need: 110 }],
	},
	// ─── World 8: Finale ───
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
	// The new big last level, with everything new in it: a moving spout, pink sand, wind, a moving wall, purple paint
	// and a jar that slides
	{
		par: 140,
		spouts: [
			{ x: 10, color: 'yellow', amount: 400, slide: { from: 10, to: 36, every: 5 } },
			{ x: 70, color: 'pink', amount: 600 },
		],
		winds: [{ x: 40, y: 22, width: 40, height: 10, blow: -1 }],
		sliders: [{ x: 30, y: 48, width: 16, slide: { from: 20, to: 50, every: 6 } }],
		paints: [{ x: 62, y: 62, width: 14, height: 8, color: 'purple' }],
		walls: [
			[
				[40, 74],
				[40, 105],
			],
		],
		cups: [
			{ x: 2, y: 92, width: 14, height: 14, color: 'yellow', need: 100, slide: { from: 2, to: 20, every: 6 } },
			{ x: 44, y: 92, width: 14, height: 14, color: 'pink', need: 100 },
			{ x: 62, y: 92, width: 14, height: 14, color: 'purple', need: 100 },
		],
	},
	// The grand finale, with everything: a moving spout, chunky and fine sand, dirt, a sieve, water, a moving wall and
	// a whirlwind that mixes yellow and red into orange
	{
		par: 160,
		spouts: [
			{ x: 8, color: 'yellow', amount: 350, slide: { from: 8, to: 26, every: 5 } },
			{
				x: 68,
				amount: 650,
				mix: [
					{ color: 'red', texture: 'chunky' },
					{ color: 'blue', texture: 'fine' },
					{ color: 'gray', texture: 'fine' },
				],
			},
		],
		sieves: [
			[
				[78, 24],
				[50, 34],
			],
		],
		waters: [{ x: 60, y: 46, width: 18, height: 8 }],
		sliders: [{ x: 4, y: 40, width: 12, slide: { from: 2, to: 20, every: 7 } }],
		whirls: [{ x: 42, y: 62, size: 10, spin: 1 }],
		mixes: [['yellow', 'red', 'orange']],
		cups: [
			{ x: 34, y: 90, width: 14, height: 16, color: 'orange', need: 50 },
			{ x: 62, y: 90, width: 14, height: 16, color: 'blue', need: 70 },
		],
	},
];

// The level map's groups, in order: each world's picture and how many levels it holds
export const worlds = [
	{ icon: '🏖️', count: 8 },
	{ icon: '✨', count: 8 },
	{ icon: '💨', count: 4 },
	{ icon: '🚚', count: 7 },
	{ icon: '🪨', count: 6 },
	{ icon: '❄️', count: 3 },
	{ icon: '🌋', count: 8 },
	{ icon: '🏆', count: 3 },
];

// Where each level sat before they were put in order, easy to hard, so saved games can follow them to their new spots
export const OLD_ORDER = [0, 1, 2, 3, 5, 7, 14, 16, 4, 6, 15, 17, 13, 8, 9, 10, 27, 28, 11, 18, 20, 12, 19, 21, 22, 23, 24, 25, 26, -1, -1, 29, 30];

const index = (x, y) => y * WIDTH + x;
const inside = (x, y) => x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT;

// The extra tools a level gives (the pen and sponge are always there): a sieve pen where there's chunky and fine sand,
// water where there's dirt, whirlwinds where colors mix. A level can name its own with `tools`.
const toolsFor = level => {
	if (level.tools) return level.tools;

	const kinds = level.spouts.flatMap(spout => spout.mix?.map(kind => ({ texture: spout.texture, ...kind })) ?? [spout]);
	const textures = new Set(kinds.map(({ texture }) => texture ?? level.texture ?? 'normal'));

	return [
		...(textures.has('chunky') || textures.has('fine') ? ['sieve'] : []),
		...(kinds.some(({ color }) => color === 'gray') || level.lavas ? ['water'] : []),
		...(level.mixes ? ['whirl'] : []),
	];
};

// What a level has in it that might need explaining, each with a picture and a few words
const things = [
	[level => level.paints, '✨ Changes the color'],
	[level => level.winds, '💨 Wind pushes sand'],
	[level => level.whirls, '🌪️ Whirlwinds spin sand'],
	[level => level.cups.some(cup => cup.slide), '🚚 The jar moves'],
	[level => level.spouts.some(spout => spout.slide), '🚿 The spout moves'],
	[level => level.sliders, '↔️ The wall moves'],
	[level => level.texture || level.spouts.some(spout => spout.mix?.some(kind => kind.texture)), '🪨 Big and tiny sand'],
	[level => level.sieves, '🧺 Tiny sand falls through'],
	[level => level.waters, '💧 Water washes dirt away'],
	[level => level.mixes, '🧪 Colors mix'],
	[level => level.lavas, '🌋 Lava burns sand'],
	[level => level.lavas, '🧊 Water turns lava to rock'],
	[level => level.spouts.some(spout => spout.volcano), '🌋 The volcano shoots sand up'],
	[level => level.monsters, '👾 Tap the monster to stop it'],
	[level => level.ices, '❄️ Sand slides on ice'],
];

// And the tools a level is the first to give
const toolHints = { sieve: '🧺 Draw a sieve', water: '💧 Tap to add water', whirl: '🌪️ Tap to add a whirlwind' };

// The things and tools a level is the first to have, so it can show a hint for each as it starts
const hintsFor = at => [
	...things.filter(([has]) => has(levels[at]) && !levels.slice(0, at).some(has)).map(([, hint]) => hint),
	...toolsFor(levels[at])
		.filter(tool => !levels.slice(0, at).some(level => toolsFor(level).includes(tool)))
		.map(tool => toolHints[tool]),
];

export const newRound = level => ({
	level,
	spouts: levels[level].spouts.map(spout => ({ texture: levels[level].texture ?? 'normal', ...spout, heading: 1 })),
	wait: 3 * STEPS_PER_SECOND,
	par: levels[level].par,
	ink: 0,
	caught: 0,
	painted: 0,
	walls: levels[level].walls ?? [],
	paints: levels[level].paints ?? [],
	winds: levels[level].winds ?? [],
	// Mesh shelves: fine and normal sand fall through them, chunky sand rolls along them like a line
	sieves: levels[level].sieves ?? [],
	// Whirlwinds: round spots where sand gets caught and spins around, mixing up, before it drops out the bottom
	whirls: (levels[level].whirls ?? []).map(whirl => ({ ...whirl })),
	// Water pools: dirt dissolves in them and is gone; all other sand falls straight through
	waters: (levels[level].waters ?? []).map(water => ({ ...water })),
	dissolved: 0,
	// Lava: any sand that touches it burns up and is gone
	lavas: (levels[level].lavas ?? []).map(lava => ({ ...lava })),
	burned: 0,
	// Rock: what lava becomes when water meets it; sand sits on it like a wall
	rocks: [],
	// Sneaky monsters: they creep along the bottom and eat sand out of any jar they reach, until a tap bonks them home
	monsters: (levels[level].monsters ?? []).map(monster => ({ heading: 1, ...monster, home: monster.x, start: monster.heading ?? 1, dizzy: 0 })),
	poofed: 0,
	// Ice: slippery lines that sand skates along fast, even when they're flat, until it hits something or the end
	ices: levels[level].ices ?? [],
	// Color recipes: two colors of sand that touch blend into a third, like yellow and blue making green
	mixes: levels[level].mixes ?? [],
	tools: toolsFor(levels[level]),
	hints: hintsFor(level),
	sliders: (levels[level].sliders ?? []).map(slider => ({ ...slider, heading: 1 })),
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

	for (const { x, y, width } of round.sliders ?? []) drawSegment(walls, [x, y], [x + width, y]);

	for (const line of round.ices ?? []) for (let at = 1; at < line.length; at++) drawSegment(walls, line[at - 1], line[at]);

	for (const { x, y, width, height } of round.rocks ?? [])
		for (let row = y; row <= y + height; row++) drawSegment(walls, [x, row], [x + width, row]);

	for (const line of [...round.walls, ...round.lines.filter(({ sieve }) => !sieve).map(({ points }) => points)])
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
	// Once every spout is empty the jars stop too, so a round that can't be won settles and ends
	if (round.spouts.every((spout, at) => round.poured[at] >= spout.amount)) return false;

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

// A spout with a `slide` moves back and forth along the top between its two ends, pouring as it goes
const slideSpouts = round => {
	let moved = false;

	// Only while it still has sand to pour, so an empty spout lets the round settle and end
	round.spouts.forEach((spout, at) => {
		if (!spout.slide || round.steps % spout.slide.every || round.poured[at] >= spout.amount || round.spoiled) return;

		spout.heading ??= 1;
		if (spout.x + spout.heading < spout.slide.from || spout.x + spout.heading > spout.slide.to) spout.heading = -spout.heading;
		spout.x += spout.heading;
		moved = true;
	});

	return moved;
};

// A moving wall: a flat bar that slides back and forth, carrying the sand sitting on it, until every spout is empty
const slideSliders = (round, walls) => {
	if (round.spouts.every((spout, at) => round.poured[at] >= spout.amount)) return false;

	let moved = false;

	for (const slider of round.sliders ?? []) {
		if (round.steps % slider.slide.every) continue;

		slider.heading ??= 1;
		if (slider.x + slider.heading < slider.slide.from || slider.x + slider.heading > slider.slide.to) slider.heading = -slider.heading;

		const riding = round.grains.filter(([x, y]) => y < slider.y && y >= slider.y - 3 && x >= slider.x && x <= slider.x + slider.width);

		slider.x += slider.heading;
		for (const grain of riding) grain[0] = Math.max(0, Math.min(WIDTH - 1, grain[0] + slider.heading));
		moved = true;
	}

	if (!moved) return false;

	walls.set(buildWalls(round));
	liftOutOfWalls(round, walls);

	return true;
};

// Lava with a `slide` creeps back and forth between its two ends, until every spout is empty
const slideLavas = round => {
	if (round.spouts.every((spout, at) => round.poured[at] >= spout.amount)) return false;

	let moved = false;

	for (const lava of round.lavas ?? []) {
		if (!lava.slide || round.steps % lava.slide.every) continue;

		lava.heading ??= 1;
		if (lava.x + lava.heading < lava.slide.from || lava.x + lava.heading > lava.slide.to) lava.heading = -lava.heading;
		lava.x += lava.heading;
		moved = true;
	}

	return moved;
};

// Each monster creeps a cell every few steps, turning at the edges; at a jar it nibbles a grain off the top now and
// then. A bonked monster is dizzy for a while and doesn't move. It all stops once every spout is empty.
const MONSTER_SIZE = 6;

const creepMonsters = round => {
	if (!round.monsters?.length || round.spouts.every((spout, at) => round.poured[at] >= spout.amount)) return false;

	let changed = false;

	// A monster that walks into lava goes poof, gone for the round
	const burning = round.monsters.filter(({ x, y }) =>
		round.lavas?.some(lava => x + MONSTER_SIZE > lava.x && x < lava.x + lava.width && y + MONSTER_SIZE > lava.y && y < lava.y + lava.height),
	);

	if (burning.length) {
		round.monsters = round.monsters.filter(monster => !burning.includes(monster));
		round.poofed = (round.poofed ?? 0) + burning.length;
		changed = true;
	}

	for (const monster of round.monsters) {
		if (monster.dizzy > 0) {
			monster.dizzy--;
			changed ||= monster.dizzy === 0;
			continue;
		}

		if (round.steps % monster.every === 0) {
			if (monster.x + monster.heading < 0 || monster.x + monster.heading > WIDTH - MONSTER_SIZE) monster.heading = -monster.heading;
			monster.x += monster.heading;
			changed = true;
		}

		const cup = round.cups.find(({ x, width }) => monster.x + MONSTER_SIZE > x && monster.x < x + width);

		if (cup && round.steps % 4 === 0) {
			const inside = round.grains.filter(([x, y]) => inBox(cup, x, y)).sort((one, two) => one[1] - two[1]);

			if (inside.length) {
				round.grains.splice(round.grains.indexOf(inside[0]), 1);
				round.eaten = (round.eaten ?? 0) + 1;
				changed = true;
			}
		}
	}

	return changed;
};

// A tap near a monster bonks it: back home it goes, dizzy for two seconds
export const bonk = (round, [atX, atY]) => {
	const monster = round.monsters?.find(
		({ x, y }) => Math.hypot(atX - (x + MONSTER_SIZE / 2), atY - (y + MONSTER_SIZE / 2)) < MONSTER_SIZE * 1.5,
	);

	if (!monster) return false;

	monster.x = monster.home;
	monster.heading = monster.start ?? 1;
	monster.dizzy = 2 * STEPS_PER_SECOND;

	return true;
};

// Counting the score at the end of a won round, a few grains a step so it can be watched: first the sand in the jar
// of its own color goes, each grain a point up (gold and gems worth more); then the sand in the wrong jar, each a point
// down; then the lines are rubbed out from their ends, a point down for every cell of line
const TALLY_PER_STEP = 3;

const tallyStep = (round, walls) => {
	const tally = round.tally;
	const cupOf = ([x, y]) => round.cups.find(cup => inBox(cup, x, y));
	const take = belongs => {
		const picked = round.grains
			.filter(grain => cupOf(grain) && belongs(grain, cupOf(grain)))
			.sort((one, two) => one[1] - two[1])
			.slice(0, TALLY_PER_STEP);

		round.grains = round.grains.filter(grain => !picked.includes(grain));

		return picked;
	};

	if (tally.phase === 'right') {
		const picked = take(([, , color], cup) => treasure(color) || color === cup.color);

		for (const [, , color] of picked) tally.score += color === 'gem' ? GEM_POINTS : color === 'gold' ? GOLD_POINTS : 1;
		if (!picked.length) tally.phase = 'wrong';

		return true;
	}

	if (tally.phase === 'wrong') {
		const picked = take(([, , color], cup) => !treasure(color) && color !== cup.color);

		tally.score -= picked.length;
		if (!picked.length) tally.phase = 'lines';

		return true;
	}

	if (tally.phase === 'lines') {
		for (let rub = 0; rub < 2; rub++) {
			const line = round.lines.at(-1);

			if (!line) {
				tally.phase = 'done';
				break;
			}

			if (line.points.length <= 1) {
				round.lines = round.lines.slice(0, -1);
				tally.carry += 1;
			} else {
				const points = line.points.slice(0, -1);

				tally.carry += Math.hypot(line.points.at(-1)[0] - points.at(-1)[0], line.points.at(-1)[1] - points.at(-1)[1]);
				round.lines = [...round.lines.slice(0, -1), { ...line, points }];
			}

			while (tally.carry >= 1) {
				tally.score--;
				tally.carry--;
			}
		}

		walls.set(buildWalls(round));

		return true;
	}

	return false;
};

export const step = (round, walls) => {
	round.steps = (round.steps ?? 0) + 1;

	// Once a won round has settled, the sand stops and the score is counted up instead
	if (round.tally) return tallyStep(round, walls);

	const slid = round.wait > 0 ? false : Boolean(slideCups(round, walls) | slideSliders(round, walls));
	const taken = new Uint8Array(walls);
	let changed = slid || (round.wait > 0 ? false : slideSpouts(round) | slideLavas(round) | creepMonsters(round));

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
			// A volcano is a spout down low that shoots its sand up into the air
			const fromY = spout.volcano ? spout.y : 0;

			if (round.poured[at] >= spout.amount || taken[index(x, fromY)] || Math.random() < 0.4) continue;

			// A spout with a `mix` pours a jumble of kinds of sand, picked at random grain by grain
			const { color, texture = spout.texture } = spout.mix ? spout.mix[Math.floor(Math.random() * spout.mix.length)] : spout;

			const gem = Math.random() < GEM_CHANCE;

			const grain = [x, fromY, gem ? 'gem' : color, Math.random() < 0.5 ? -1 : 1, Math.floor(Math.random() * SHADES), gem ? 'normal' : texture];

			// How many steps it rises before falling back down
			if (spout.volcano) grain[8] = spout.volcano * (0.6 + Math.random() * 0.6);
			round.grains.push(grain);
			taken[index(x, fromY)] = 1;
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

	const sieve = new Uint8Array(WIDTH * HEIGHT);
	const ice = new Uint8Array(WIDTH * HEIGHT);

	for (const line of round.ices ?? []) for (let at = 1; at < line.length; at++) drawSegment(ice, line[at - 1], line[at]);

	// The level's sieves and any a player drew
	for (const line of [...(round.sieves ?? []), ...round.lines.filter(({ sieve }) => sieve).map(({ points }) => points)])
		for (let at = 1; at < line.length; at++) drawSegment(sieve, line[at - 1], line[at]);

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

		const chunky = grain[5] === 'chunky';
		const fine = grain[5] === 'fine';
		// Chunky sand can't get through a sieve; everything else can
		const blocked = (toX, toY) => taken[index(toX, toY)] || (chunky && sieve[index(toX, toY)]);

		// In a whirlwind sand goes round and round for a while, then is let go to fall; chunky sand is let go soonest,
		// fine sand spins longest. A grain let go isn't caught again.
		const whirl =
			grain[6] !== -1 && round.whirls?.find(({ x: whirlX, y: whirlY, size }) => Math.hypot(x - whirlX, y - whirlY) < size);

		if (whirl) grain[6] = (grain[6] ?? 0) + 1;
		if (whirl && grain[6] > (chunky ? 60 : fine ? 240 : 140) * (0.6 + Math.random() * 0.8)) grain[6] = -1;

		if (whirl && grain[6] !== -1) {
			const fromX = x - whirl.x;
			const fromY = y - whirl.y;
			const away = Math.hypot(fromX, fromY) || 1;
			// Around the middle, and a little in toward it near the edge so the sand stays caught
			const pull = away > whirl.size * 0.75 ? 0.5 : 0;
			const aroundX = (-fromY * whirl.spin) / away - (fromX / away) * pull;
			const aroundY = ((fromX * whirl.spin) / away - (fromY / away) * pull) * 0.9 + 0.1;
			const tries =
				Math.random() * (Math.abs(aroundX) + Math.abs(aroundY)) < Math.abs(aroundX)
					? [
							[Math.sign(aroundX), 0],
							[0, Math.sign(aroundY)],
						]
					: [
							[0, Math.sign(aroundY)],
							[Math.sign(aroundX), 0],
						];

			for (const [dx, dy] of tries) {
				const toX = x + dx;
				const toY = y + dy;

				if ((!dx && !dy) || toX < 0 || toX >= WIDTH || toY < 0 || toY >= HEIGHT || blocked(toX, toY)) continue;

				if (dx) grain[3] = dx;
				move(grain, toX, toY);

				return true;
			}
		}

		// In the wind, sand is blown sideways more often than it falls: fine sand most, chunky sand least
		const wind = round.winds?.find(box => inBox(box, x, y));

		if (wind && Math.random() < (fine ? 0.9 : chunky ? 0.35 : 0.7)) {
			const toX = x + wind.blow;

			grain[3] = wind.blow;
			if (toX >= 0 && toX < WIDTH && !blocked(toX, y)) {
				move(grain, toX, y);

				return true;
			}
		}

		// Shot up from a volcano: up it goes, spreading sideways now and then, until it's spent or hits something
		if (grain[8] > 0) {
			grain[8]--;
			// Straight up at first, curving outward near the top, then flying on sideways as it starts to fall
			if (grain[8] <= 0) grain[7] = 14;

			for (const [dx, dy] of Math.random() < (grain[8] < 14 ? 0.7 : 0.08)
				? [
						[side, -1],
						[0, -1],
					]
				: [
						[0, -1],
						[side, -1],
					]) {
				const toX = x + dx;

				if (toX < 0 || toX >= WIDTH || y + dy < 0 || blocked(toX, y + dy)) continue;

				move(grain, toX, y + dy);

				return true;
			}
			grain[8] = 0;
		}

		// Flying off ice it heads on sideways as it falls
		const flying = grain[7] > 0;

		if (flying) grain[7]--;

		for (const [dx, dy] of flying
			? [
					[side, 1],
					[0, 1],
				]
			: [
					[0, 1],
					[side, 1],
					[-side, 1],
				]) {
			const toX = x + dx;

			if (toX < 0 || toX >= WIDTH || blocked(toX, y + dy)) continue;
			// Chunky grains catch on each other, so they often stay put instead of rolling off a pile
			if (dx && chunky && !flying && Math.random() < 0.7) return true;

			if (dx) grain[3] = dx;
			move(grain, toX, y + dy);

			return true;
		}

		// On ice every kind of sand skates, two cells a step, and keeps going the way it's headed; it bounces back off a
		// wall (or uphill), and stops against other sand
		if (ice[index(x, y + 1)]) {
			for (let skate = 0; skate < 2; skate++) {
				const toX = grain[0] + side;

				if (toX < 0 || toX >= WIDTH || walls[index(toX, grain[1])]) {
					grain[3] = -side;
					break;
				}
				if (blocked(toX, grain[1])) break;
				move(grain, toX, grain[1]);
				// Skating off the end, it flies on through the air a way before dropping
				if (!ice[index(grain[0], grain[1] + 1)]) {
					grain[7] = 16;
					break;
				}
			}

			return true;
		}

		// On a line it slides along (chunky sand only now and then); fine sand runs sideways over other sand too
		if (walls[index(x, y + 1)] ? !chunky || Math.random() < 0.4 : fine || (chunky && sieve[index(x, y + 1)])) {
			const toX = x + side;

			if (toX >= 0 && toX < WIDTH && !blocked(toX, y)) move(grain, toX, y);
		}

		return true;
	});

	for (const grain of round.grains)
		for (const paint of round.paints ?? [])
			if (inBox(paint, grain[0], grain[1]) && grain[2] !== paint.color && grain[2] !== 'gray' && !treasure(grain[2])) {
				grain[2] = paint.color;
				// How many grains have changed color this round, so a page can sparkle when it goes up
				round.painted = (round.painted ?? 0) + 1;
			}

	// Grains of two colors in a recipe, side by side or one on the other, now and then both turn the recipe's color
	if (round.mixes?.length) {
		const at = new Map(round.grains.map(grain => [index(grain[0], grain[1]), grain]));
		const blend = (one, two) =>
			round.mixes.find(([first, second]) => (one === first && two === second) || (one === second && two === first))?.[2];

		for (const grain of round.grains)
			for (const [dx, dy] of [
				[1, 0],
				[0, 1],
			]) {
				const next = at.get(index(grain[0] + dx, grain[1] + dy));
				const made = next && grain[0] + dx < WIDTH && blend(grain[2], next[2]);

				if (made && Math.random() < 0.3) {
					grain[2] = made;
					next[2] = made;
					round.painted = (round.painted ?? 0) + 2;
					changed = true;
				}
			}
	}

	// Water touching lava: both are gone, and the lava's spot turns to rock
	const overlap = (one, two) =>
		one.x < two.x + two.width && two.x < one.x + one.width && one.y < two.y + two.height && two.y < one.y + one.height;
	const cooled = (round.lavas ?? []).filter(lava => round.waters?.some(water => overlap(lava, water)));

	if (cooled.length) {
		round.waters = round.waters.filter(water => !cooled.some(lava => overlap(lava, water)));
		round.lavas = round.lavas.filter(lava => !cooled.includes(lava));
		round.rocks = [...(round.rocks ?? []), ...cooled.map(({ x, y, width, height }) => ({ x, y, width, height }))];
		walls.set(buildWalls(round));
		liftOutOfWalls(round, walls);
		changed = true;
	}

	const unburned = round.grains.length;

	round.grains = round.grains.filter(([x, y]) => !round.lavas?.some(lava => inBox(lava, x, y)));
	if (round.grains.length < unburned) {
		round.burned = (round.burned ?? 0) + unburned - round.grains.length;
		changed = true;
	}

	const before = round.grains.length;

	round.grains = round.grains.filter(([x, y, color]) => color !== 'gray' || !round.waters?.some(water => inBox(water, x, y)));
	if (round.grains.length < before) {
		round.dissolved = (round.dissolved ?? 0) + before - round.grains.length;
		changed = true;
	}

	for (const cup of round.cups)
		cup.count = round.grains.filter(([x, y, color]) => color === cup.color && inBox(cup, x, y)).length;

	// The score: every grain sitting in a jar of its own color, less every grain in a jar of another color, and extra
	// for every gold grain in any jar
	const wrong = round.grains.filter(
		([x, y, color]) => !treasure(color) && round.cups.some(cup => color !== cup.color && inBox(cup, x, y)),
	).length;
	const bonus = round.grains.reduce(
		(total, [x, y, color]) =>
			treasure(color) && round.cups.some(cup => inBox(cup, x, y)) ? total + (color === 'gem' ? GEM_POINTS : GOLD_POINTS) : total,
		0,
	);

	round.caught = round.cups.reduce((total, { count }) => total + count, 0) - wrong + bonus;

	if (!round.won && !round.spoiled && round.cups.every(cup => cup.count >= cup.need)) {
		round.won = true;
	}

	// Every spout empty and the sand still for a few seconds, without the cups full: the round is over. Sand pauses now
	// and then on its own, and a line drawn or rubbed out can set it going again, so one quiet step is not enough.
	const pouredAll = round.spouts.every((spout, at) => round.poured[at] >= spout.amount);

	round.still = changed || !pouredAll ? 0 : (round.still ?? 0) + 1;

	if (round.still > STILL_STEPS && !round.won && !round.spoiled) {
		round.spoiled = true;
		changed = true;
	}

	// A won round, every spout empty and the sand still for a second: time to count the score
	if (round.won && !round.tally && round.still > STEPS_PER_SECOND) {
		round.tally = { phase: 'right', score: 0, carry: 0 };
		changed = true;
	}

	// While the sand sits still, say so a few times a second anyway, so pages can show the countdown going down
	return changed || (round.still > 0 && !round.won && !round.spoiled && round.still % (STEPS_PER_SECOND / 4) === 0);
};

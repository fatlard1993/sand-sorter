import { Game as BaseGame } from '@fatlard1993/web-game-framework';

import {
	HEIGHT,
	OLD_ORDER,
	STEPS_PER_SECOND,
	WIDTH,
	buildWalls,
	inkOf,
	levels,
	liftOutOfWalls,
	linesNear,
	newRound,
	bonk,
	pack,
	step,
	worlds,
} from './sand.js';

const STEPS_PER_TICK = 2;
const ERASE_REACH = 3;
// Players can drop a few little water pools of their own each round
const WATER_SIZE = { width: 10, height: 6 };
const MOST_WATERS = 3;
// And a couple of little whirlwinds, each spinning the other way from the one before
const WHIRL_SIZE = 8;
const MOST_WHIRLS = 2;
// A wish on a shooting star drops a handful of gold sand, a few times a round
const GOLD_GRAINS = 30;
const MOST_WISHES = 3;
// A level's fingerprint, so a saved game can find it again after levels are added or moved
const levelKey = level => Bun.hash(JSON.stringify(level)).toString(36);
const TICK_MS = (1000 * STEPS_PER_TICK) / STEPS_PER_SECOND;

// One running game, on the server. `state` is the round: its lines, its sand, its cups. The sand falls here, and every
// page draws what it's sent (client/Play.js).
export default class Game extends BaseGame {
	constructor(options) {
		super(options);

		this.state = options.saveState?.state?.lines?.every(line => line.points) ? options.saveState.state : newRound(0);
		// The most grains caught on each level won, the score (saved apart from the stars that used to be the score)
		this.best = options.saveState?.mostCaught ?? {};
		this.reached = options.saveState?.reached ?? this.state.level;

		// Levels get added and moved around; a save remembers which level sat at each spot, so its level, scores and
		// progress follow each level to wherever it is now, and every level it had opened stays open
		if (options.saveState) {
			const keys = levels.map(levelKey);
			const { levelKeys, inOrder } = options.saveState;
			// Saves from before levels were remembered this way: either the first easy-to-hard order (before the two
			// washing levels at spots 29 and 30), or the order before that
			const savedKeys =
				levelKeys ??
				(inOrder
					? keys.filter((_, at) => at !== 29 && at !== 30)
					: OLD_ORDER.reduce((saved, old, at) => (old >= 0 ? Object.assign(saved, { [old]: keys[at] }) : saved), []));
			const moved = old => keys.indexOf(savedKeys[old]);
			const level = Math.max(0, moved(this.state.level));

			if (level !== this.state.level) this.state = newRound(level);
			this.best = Object.fromEntries(
				Object.entries(this.best)
					.map(([old, caught]) => [moved(Number(old)), caught])
					.filter(([at]) => at >= 0),
			);
			this.reached = Math.max(level, ...savedKeys.map((_, old) => (old <= this.reached ? moved(old) : 0)));
		}
		this.walls = buildWalls(this.state);

		this.timer = setInterval(() => {
			try {
				this.tick();
			} catch (error) {
				this.logger.error('Sand stopped', { gameId: this.id, error: error.stack });
				clearInterval(this.timer);
			}
		}, TICK_MS);
	}

	tick() {
		// Deleted
		if (this.server?.games[this.id] !== this) {
			clearInterval(this.timer);

			return;
		}

		let changed = false;

		for (let count = 0; count < STEPS_PER_TICK; count++) changed = step(this.state, this.walls) || changed;

		if (!changed) return;

		const { grains, cups, spouts, sliders, lavas, rocks, waters, monsters, eaten, poofed, won, spoiled, wait, caught, painted, dissolved, burned, still, level } = this.state;

		// The score counted up at the end of a won round is the one kept
		const { tally, lines } = this.state;

		if (tally?.phase === 'done' && !(this.best[level] >= tally.score)) this.best[level] = Math.max(0, tally.score);

		this.broadcast('sand', { sand: pack(grains), cups, spouts, sliders, lavas, rocks, waters, monsters, eaten, poofed, won, spoiled, wait, caught, painted, dissolved, burned, still, best: this.best, ...(tally ? { tally, lines } : {}) });
		this.save();
	}

	toClient() {
		return {
			...super.toClient(),
			state: this.state,
			best: this.best,
			reached: this.reached,
			levelCount: levels.length,
			worlds,
			size: { width: WIDTH, height: HEIGHT },
		};
	}

	toSaveState() {
		return { ...super.toSaveState(), state: this.state, mostCaught: this.best, reached: this.reached, levelKeys: levels.map(levelKey) };
	}

	announce() {
		const { grains, ...state } = this.state;

		this.broadcast('state', { state, best: this.best, reached: this.reached, sand: pack(grains), players: [...this.players.values()] });
	}

	// Something a player did, from their page: { gameId, playerId, type, ...whatever the type carries }
	receive({ type, playerId, line, stroke, at, level, sieve }) {
		if (!this.players.has(playerId)) return;

		// Only the tools this level gives
		const tools = this.state.tools ?? [];

		if ((type === 'water' || type === 'whirl') && !tools.includes(type)) return;
		if (sieve && !tools.includes('sieve')) return;

		const clamp = (value, max) => Math.max(0, Math.min(max - 1, Math.round((Number(value) || 0) * 10) / 10));

		// A line arrives a piece at a time; its pieces share the stroke they were drawn in, so they erase together
		if (type === 'line' && Array.isArray(line) && line.length > 0 && line.length < 500) {
			const points = line.map(([x, y]) => [clamp(x, WIDTH), clamp(y, HEIGHT)]);

			this.state.lines.push({ stroke: String(stroke ?? Math.random()), by: playerId, points, ...(sieve ? { sieve: true } : {}) });
			this.state.ink += inkOf(points);
		}

		this.state.waters ??= [];
		this.state.whirls ??= [];

		if (type === 'water' && Array.isArray(at)) {
			const drawn = this.state.waters.filter(water => water.by);

			if (drawn.length >= MOST_WATERS) return;

			const x = Math.round(Math.min(WIDTH - WATER_SIZE.width, Math.max(0, clamp(at[0], WIDTH) - WATER_SIZE.width / 2)));
			const y = Math.round(Math.min(HEIGHT - WATER_SIZE.height, Math.max(0, clamp(at[1], HEIGHT) - WATER_SIZE.height / 2)));

			this.state.waters.push({ x, y, ...WATER_SIZE, by: playerId });
		}

		if (type === 'bonk' && Array.isArray(at)) {
			if (!bonk(this.state, [clamp(at[0], WIDTH), clamp(at[1], HEIGHT)])) return;
		}

		if (type === 'wish' && Array.isArray(at)) {
			if ((this.state.wishes ?? 0) >= MOST_WISHES || this.state.won || this.state.spoiled) return;

			const taken = new Set(this.state.grains.map(([x, y]) => `${x},${y}`));
			const middle = Math.round(clamp(at[0], WIDTH));

			this.state.wishes = (this.state.wishes ?? 0) + 1;
			for (let grain = 0, tries = 0; grain < GOLD_GRAINS && tries < 200; tries++) {
				const x = Math.max(0, Math.min(WIDTH - 1, middle + Math.floor(Math.random() * 9) - 4));
				const y = Math.floor(Math.random() * 6);

				if (taken.has(`${x},${y}`) || this.walls[y * WIDTH + x]) continue;

				taken.add(`${x},${y}`);
				this.state.grains.push([x, y, 'gold', Math.random() < 0.5 ? -1 : 1, Math.floor(Math.random() * 4), 'normal']);
				grain++;
			}
		}

		if (type === 'whirl' && Array.isArray(at)) {
			const drawn = this.state.whirls.filter(whirl => whirl.by);

			if (drawn.length >= MOST_WHIRLS) return;

			const x = Math.round(Math.min(WIDTH - WHIRL_SIZE, Math.max(WHIRL_SIZE, clamp(at[0], WIDTH))));
			const y = Math.round(Math.min(HEIGHT - WHIRL_SIZE, Math.max(WHIRL_SIZE, clamp(at[1], HEIGHT))));

			this.state.whirls.push({ x, y, size: WHIRL_SIZE, spin: drawn.length % 2 ? -1 : 1, by: playerId });
		}

		if (type === 'erase' && Array.isArray(at)) {
			// The sponge soaks up a player's water pool too
			const [atX, atY] = [clamp(at[0], WIDTH), clamp(at[1], HEIGHT)];
			const pools = this.state.waters.length + this.state.whirls.length;

			this.state.waters = this.state.waters.filter(
				water => !water.by || atX < water.x - 1 || atX > water.x + water.width + 1 || atY < water.y - 1 || atY > water.y + water.height + 1,
			);

			const touched = linesNear(this.state.lines, [clamp(at[0], WIDTH), clamp(at[1], HEIGHT)], ERASE_REACH);

			this.state.whirls = this.state.whirls.filter(whirl => !whirl.by || Math.hypot(atX - whirl.x, atY - whirl.y) > whirl.size);

			if (!touched.size && this.state.waters.length + this.state.whirls.length === pools) return;

			this.state.lines = this.state.lines.filter(({ stroke: id }) => !touched.has(id));
		}

		if (type === 'restart') this.state = newRound(this.state.level);

		if (type === 'level' && Number.isInteger(level) && level >= 0 && level <= this.reached) this.state = newRound(level);

		if (type === 'next' && this.state.won) {
			this.state = newRound((this.state.level + 1) % levels.length);
			this.reached = Math.max(this.reached, this.state.level);
		}

		this.walls = buildWalls(this.state);
		liftOutOfWalls(this.state, this.walls);
		this.state.still = 0;
		this.announce();
	}

	onPlayerAdded() {
		this.save();
		this.announce();
	}

	onPlayerRemoved() {
		this.save();
		this.announce();
	}
}

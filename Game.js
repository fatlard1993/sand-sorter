import { Game as BaseGame } from '@fatlard1993/web-game-framework';

import { HEIGHT, STEPS_PER_SECOND, WIDTH, buildWalls, inkOf, levels, liftOutOfWalls, linesNear, newRound, pack, step } from './sand.js';

const STEPS_PER_TICK = 2;
const ERASE_REACH = 3;
const TICK_MS = (1000 * STEPS_PER_TICK) / STEPS_PER_SECOND;

// One running game, on the server. `state` is the round: its lines, its sand, its cups. The sand falls here, and every
// page draws what it's sent (client/Play.js).
export default class Game extends BaseGame {
	constructor(options) {
		super(options);

		this.state = options.saveState?.state?.lines?.every(line => line.points) ? options.saveState.state : newRound(0);
		this.best = options.saveState?.best ?? {};
		this.reached = options.saveState?.reached ?? this.state.level;
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

		const { grains, cups, won, spoiled, wait, stars, level } = this.state;

		if (won && !(this.best[level] >= stars)) {
			this.best[level] = stars;
			this.announce();
		}

		this.broadcast('sand', { sand: pack(grains), cups, won, spoiled, wait, stars });
		this.save();
	}

	toClient() {
		return {
			...super.toClient(),
			state: this.state,
			best: this.best,
			reached: this.reached,
			levelCount: levels.length,
			size: { width: WIDTH, height: HEIGHT },
		};
	}

	toSaveState() {
		return { ...super.toSaveState(), state: this.state, best: this.best, reached: this.reached };
	}

	announce() {
		const { grains, ...state } = this.state;

		this.broadcast('state', { state, best: this.best, reached: this.reached, sand: pack(grains), players: [...this.players.values()] });
	}

	// Something a player did, from their page: { gameId, playerId, type, ...whatever the type carries }
	receive({ type, playerId, line, stroke, at, level }) {
		if (!this.players.has(playerId)) return;

		const clamp = (value, max) => Math.max(0, Math.min(max - 1, Math.round((Number(value) || 0) * 10) / 10));

		// A line arrives a piece at a time; its pieces share the stroke they were drawn in, so they erase together
		if (type === 'line' && Array.isArray(line) && line.length > 0 && line.length < 500) {
			const points = line.map(([x, y]) => [clamp(x, WIDTH), clamp(y, HEIGHT)]);

			this.state.lines.push({ stroke: String(stroke ?? Math.random()), by: playerId, points });
			this.state.ink += inkOf(points);
		}

		if (type === 'erase' && Array.isArray(at)) {
			const touched = linesNear(this.state.lines, [clamp(at[0], WIDTH), clamp(at[1], HEIGHT)], ERASE_REACH);

			if (!touched.size) return;

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

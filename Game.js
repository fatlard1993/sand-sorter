import { Game as BaseGame } from '@fatlard1993/web-game-framework';

import { HEIGHT, STEPS_PER_SECOND, WIDTH, buildWalls, inkOf, levels, liftOutOfWalls, newRound, pack, step } from './sand.js';

const STEPS_PER_TICK = 2;
const TICK_MS = (1000 * STEPS_PER_TICK) / STEPS_PER_SECOND;

// One running game, on the server. `state` is the round: its lines, its sand, its cups. The sand falls here, and every
// page draws what it's sent (client/Play.js).
export default class Game extends BaseGame {
	constructor(options) {
		super(options);

		this.state = options.saveState?.state?.par ? options.saveState.state : newRound(0);
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
		// Deleted, or replaced by a fresh copy from the save file (`bun --hot` makes one on every change)
		if (this.server?.games[this.id] !== this) {
			clearInterval(this.timer);

			return;
		}

		let changed = false;

		for (let count = 0; count < STEPS_PER_TICK; count++) changed = step(this.state, this.walls) || changed;

		if (!changed) return;

		const { grains, cups, won, wait, stars } = this.state;

		this.broadcast('sand', { sand: pack(grains), cups, won, wait, stars });
		this.save();
	}

	toClient() {
		return { ...super.toClient(), state: this.state, size: { width: WIDTH, height: HEIGHT } };
	}

	toSaveState() {
		return { ...super.toSaveState(), state: this.state };
	}

	announce() {
		const { grains, ...state } = this.state;

		this.broadcast('state', { state, sand: pack(grains), players: [...this.players.values()] });
	}

	// Something a player did, from their page: { gameId, playerId, type, ...whatever the type carries }
	receive({ type, playerId, line }) {
		if (!this.players.has(playerId)) return;

		if (type === 'line' && Array.isArray(line) && line.length > 0 && line.length < 500) {
			const clamp = (value, max) => Math.max(0, Math.min(max - 1, Math.round(Number(value) || 0)));

			const piece = line.map(([x, y]) => [clamp(x, WIDTH), clamp(y, HEIGHT)]);

			this.state.lines.push(piece);
			this.state.ink += inkOf(piece);
		}

		if (type === 'restart') this.state = newRound(this.state.level);

		if (type === 'next' && this.state.won) this.state = newRound((this.state.level + 1) % levels.length);

		this.walls = buildWalls(this.state);
		liftOutOfWalls(this.state, this.walls);
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

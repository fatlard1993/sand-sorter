import { Game as BaseGame } from '@fatlard1993/web-game-framework';

import { HEIGHT, WIDTH, buildWalls, newRound, step } from './sand.js';

const TICK_MS = 50;

// `bun --hot` makes new games from the save file on every change; one timer per game id keeps the old ones from ticking
globalThis.sandTimers ??= {};

// One running game, on the server. `state` is the round: its lines, its sand, its cups. The sand falls here, and every
// page draws what it's sent (client/Play.js).
export default class Game extends BaseGame {
	constructor(options) {
		super(options);

		this.state = options.saveState?.state?.cups ? options.saveState.state : newRound(0);
		this.walls = buildWalls(this.state);

		clearInterval(globalThis.sandTimers[this.id]);
		globalThis.sandTimers[this.id] = setInterval(() => this.tick(), TICK_MS);
	}

	tick() {
		if (this.server?.games[this.id] !== this) {
			clearInterval(globalThis.sandTimers[this.id]);

			return;
		}

		if (!this.players.size || !step(this.state, this.walls)) return;

		const { grains, cups, won } = this.state;

		this.broadcast('sand', { grains, cups, won });
		this.save();
	}

	toClient() {
		return { ...super.toClient(), state: this.state, size: { width: WIDTH, height: HEIGHT } };
	}

	toSaveState() {
		return { ...super.toSaveState(), state: this.state };
	}

	announce() {
		this.broadcast('state', { state: this.state, players: [...this.players.values()] });
	}

	// Something a player did, from their page: { gameId, playerId, type, ...whatever the type carries }
	receive({ type, playerId, line }) {
		if (!this.players.has(playerId)) return;

		if (type === 'line' && Array.isArray(line) && line.length > 0 && line.length < 500) {
			const clamp = (value, max) => Math.max(0, Math.min(max - 1, Math.round(Number(value) || 0)));

			this.state.lines.push(line.map(([x, y]) => [clamp(x, WIDTH), clamp(y, HEIGHT)]));
		}

		if (type === 'restart') this.state = newRound(this.state.level);

		this.walls = buildWalls(this.state);
		this.announce();
	}

	onPlayerAdded() {
		this.announce();
	}

	onPlayerRemoved() {
		this.announce();
	}
}

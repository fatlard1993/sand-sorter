import { Button, Component, Link, styled, theme } from '@vanilla-bean/components';
import { gameContext, getGame, onMessage, socket } from '@fatlard1993/web-game-framework/client';
import { View } from '@fatlard1993/web-game-framework/ui';

import { STEPS_PER_SECOND, STILL_STEPS, unpack } from '../sand.js';
import { SCALE, boardPainter, penHue, shootingStar } from './drawBoard.js';
import { invite } from './Invite.js';
import { pickLevel } from './LevelPicker.js';
import { confetti, fireworks, together } from './confetti.js';
import { sounds } from './sounds.js';

const Board = styled(
	Component,
	({ space }) => `
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: ${space.sm};
		padding: ${space.sm};
		height: 100%;
		box-sizing: border-box;
	`,
);

// The room left between the top and the buttons; the sand box grows to fill it, and a finger landing anywhere in it
// draws, held to the box's edge
const Fit = styled(
	Component,
	() => `
		flex: 1;
		min-height: 0;
		min-width: 0;
		align-self: stretch;
		display: flex;
		align-items: center;
		justify-content: center;
		touch-action: none;
		cursor: crosshair;
	`,
);

// The game's middle row: the sand box, with the drawing tools in a column along its side
const Stage = styled(
	Component,
	({ space }) => `
		display: flex;
		flex: 1;
		min-height: 0;
		align-self: stretch;
		gap: ${space.sm};
	`,
);

const Tools = styled(
	Component,
	({ space }) => `
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: ${space.sm};
		font-size: 1.5em;
	`,
);

const Box = styled(
	Component,
	({ colors, radius }) => `
		display: block;
		border-radius: ${radius.lg};
		border: 2px solid ${colors.border};
	`,
);

const Buttons = styled(
	Component,
	({ space }) => `
		display: flex;
		gap: ${space.xs};
		font-size: 1.3em;
	`,
);


const Team = styled(
	Component,
	({ space }) => `
		display: flex;
		align-items: center;
		gap: ${space.sm};
		font-size: 1.15em;
	`,
);

const Friend = styled(
	Component,
	({ space }) => `
		border-bottom: 4px solid;
		padding: 0 ${space.xs};
	`,
);

const Status = styled(
	Component,
	() => `
		font-size: 1.15em;
		white-space: nowrap;
	`,
);

const dots = { yellow: '🟡', blue: '🔵', red: '🔴', green: '🟢', purple: '🟣', orange: '🟠', pink: '🩷', teal: '🩵' };

// One player's screen: the sand box. The sand falls on the server; a line drawn here is sent there, and shows up on
// every screen once it comes back.
export default class Play extends View {
	static schema = { gameId: {} };

	constructor(options, ...children) {
		super(
			{
				...options,
				toolbar: { heading: '', left: [new Link({ textContent: '🏠', href: '#/hub', variant: 'button' })] },
			},
			...children,
		);
	}

	build() {
		super.build();
		this._init();
	}

	async _init() {
		const { gameId } = this.options;
		const playerId = localStorage.getItem(gameId);
		const { body: game, response } = await getGame(gameId, { invalidateAfter: 0 });

		if (response.status !== 200 || !game.players.some(({ id }) => id === playerId)) {
			window.location.href = `#/join/${gameId}`;

			return;
		}

		gameContext.gameId = gameId;
		gameContext.playerId = playerId;

		const { width, height } = game.size;
		const board = new Board({ appendTo: this._body });
		// Everything but the sand box and its tools lives in the top bar: home and the level's score and cups on the
		// left, the friends playing and the round's buttons on the right
		const status = new Status();
		const team = new Team();
		let players = game.players;

		const drawTeam = () => {
			team.empty();
			for (const player of players)
				new Friend({
					appendTo: team,
					textContent: player.name,
					style: { borderColor: theme.colors[penHue(players, player.id)].toHexString() },
				});
			new Button({ appendTo: team, textContent: '➕👫', onPointerPress: () => invite(gameId) });
		};

		drawTeam();
		const stage = new Stage({ appendTo: board });
		const fit = new Fit({ appendTo: stage });
		const tools = new Tools({ appendTo: stage });
		const box = new Box({ tag: 'canvas', appendTo: fit });

		const canvas = box.elem;
		const pen = canvas.getContext('2d');

		canvas.width = width * SCALE;
		canvas.height = height * SCALE;

		const sizer = new ResizeObserver(() => {
			const border = 4;
			const room = Math.min((fit.elem.clientWidth - border) / width, (fit.elem.clientHeight - border) / height);

			canvas.style.width = `${Math.max(0, Math.floor(room * width))}px`;
			canvas.style.height = `${Math.max(0, Math.floor(room * height))}px`;
		});

		sizer.observe(fit.elem);
		this.addCleanup('sizer', () => sizer.disconnect());

		const buttons = new Buttons();

		this._toolbar.options.left = [new Link({ textContent: '🏠', href: '#/hub', variant: 'button' }), status];
		this._toolbar.options.right = [team, buttons];

		new Button({
			textContent: '🔄',
			appendTo: buttons,
			onPointerPress: () => socket.send({ gameId, playerId, type: 'restart' }),
		});
		let best = game.best ?? {};
		let reached = game.reached ?? 0;

		new Button({
			textContent: '🗺️',
			appendTo: buttons,
			onPointerPress: () =>
				pickLevel({
					count: game.levelCount,
					worlds: game.worlds,
					best,
					reached,
					onPick: level => socket.send({ gameId, playerId, type: 'level', level }),
				}),
		});
		const next = new Button({
			textContent: '➡️',
			appendTo: buttons,
			onPointerPress: () => socket.send({ gameId, playerId, type: 'next' }),
		});

		let state = game.state;
		let drawing = null;
		let settling = null;
		let stroke;
		let tool = 'pen';

		const penButton = new Button({ textContent: '✏️', appendTo: tools, onPointerPress: () => pick('pen') });
		const sieveButton = new Button({ textContent: '🧺', appendTo: tools, onPointerPress: () => pick('sieve') });
		const whirlButton = new Button({ textContent: '🌪️', appendTo: tools, onPointerPress: () => pick('whirl') });
		const waterButton = new Button({ textContent: '💧', appendTo: tools, onPointerPress: () => pick('water') });
		const spongeButton = new Button({ textContent: '🧽', appendTo: tools, onPointerPress: () => pick('sponge') });
		const pick = chosen => {
			tool = chosen;
			penButton.elem.style.opacity = tool === 'pen' ? '' : '0.4';
			spongeButton.elem.style.opacity = tool === 'sponge' ? '' : '0.4';
			waterButton.elem.style.opacity = tool === 'water' ? '' : '0.4';
			sieveButton.elem.style.opacity = tool === 'sieve' ? '' : '0.4';
			whirlButton.elem.style.opacity = tool === 'whirl' ? '' : '0.4';
		};

		pick('pen');

		// Show only the tools this level gives; if the one in hand goes away, back to the pen
		const showTools = () => {
			const tools = state.tools ?? [];

			for (const [name, button] of [
				['sieve', sieveButton],
				['whirl', whirlButton],
				['water', waterButton],
			])
				button.elem.style.display = tools.includes(name) ? '' : 'none';
			if (tool !== 'pen' && tool !== 'sponge' && !tools.includes(tool)) pick('pen');
		};

		showTools();

		let party;
		let wished;
		const bangs = { onLaunch: sounds.whistle, onBurst: sounds.boom };
		let roundBest = best[state.level] ?? 0;
		let cheered = false;
		const drawBoard = boardPainter(pen);
		const draw = () => {
			drawBoard(state, drawing ?? settling, players, playerId);

			if (party?.(pen)) redraw();
			else party = undefined;

			const counts = state.cups.map(cup => `${dots[cup.color] ?? '🪣'} ${Math.min(cup.count, cup.need)}/${cup.need}`).join('  ');

			const score = Object.values(best).reduce((total, caught) => total + caught, 0);

			status.elem.textContent = `⏳ ${score}   🏁 ${state.level + 1}   ${state.won ? (cheered ? '🏆✨' : '🎉') : state.spoiled ? '❌ 🔄' : counts}`;
			next.elem.style.display = state.won ? '' : 'none';
		};

		// Grid units, kept to a tenth so the line follows the finger instead of stepping cell to cell
		const toGrid = ({ clientX, clientY }) => {
			const rect = canvas.getBoundingClientRect();
			const tenth = (value, most) => Math.round(Math.min(most, Math.max(0, value)) * 10) / 10;

			return [
				tenth(((clientX - rect.left) / rect.width) * width, width - 0.5),
				tenth(((clientY - rect.top) / rect.height) * height, height - 0.5),
			];
		};

		let erasing = false;
		const erase = event => socket.send({ gameId, playerId, type: 'erase', at: toGrid(event) });

		// The whole stroke stays on screen as drawn; it goes to the server a piece at a time, so it catches sand before the
		// finger lifts, and stays drawn here until the server's picture has it
		let sentUpTo = 0;
		let sentAt = 0;
		const sendPiece = () => {
			if (!drawing || drawing.length - 1 <= sentUpTo) return;

			socket.send({ gameId, playerId, type: 'line', line: drawing.slice(sentUpTo), stroke, sieve: tool === 'sieve' });
			sentUpTo = drawing.length - 1;
			sentAt = Date.now();
		};

		fit.elem.addEventListener('pointerdown', event => {
			fit.elem.setPointerCapture(event.pointerId);

			// A tap on a monster bonks it, whatever tool is in hand
			const [gridX, gridY] = toGrid(event);
			const hit = state.monsters?.some(({ x, y }) => Math.hypot(gridX - (x + 3), gridY - (y + 3)) < 9);

			if (hit) {
				socket.send({ gameId, playerId, type: 'bonk', at: [gridX, gridY] });
				sounds.bonk();

				return;
			}

			// Catch a shooting star with a tap to make a wish: a magic tune and fireworks, once per star
			const star = shootingStar(canvas.width, canvas.height);
			const rect = canvas.getBoundingClientRect();
			const tapX = ((event.clientX - rect.left) / rect.width) * canvas.width;
			const tapY = ((event.clientY - rect.top) / rect.height) * canvas.height;

			if (star && star.which !== wished && Math.hypot(tapX - star.x, tapY - star.y) < canvas.width * 0.1) {
				wished = star.which;
				sounds.wish();
				socket.send({ gameId, playerId, type: 'wish', at: [((event.clientX - rect.left) / rect.width) * width, 0] });
				party = together(party, fireworks(canvas.width, canvas.height, 4, bangs));
				redraw();

				return;
			}

			// The water tool drops a little pool where it's tapped
			if (tool === 'water') {
				socket.send({ gameId, playerId, type: 'water', at: toGrid(event) });
				sounds.fizz();

				return;
			}

			// The whirlwind tool drops a little whirlwind where it's tapped
			if (tool === 'whirl') {
				socket.send({ gameId, playerId, type: 'whirl', at: toGrid(event) });
				sounds.whistle();

				return;
			}

			if (tool === 'sponge') {
				erasing = true;
				sounds.wipe();
				erase(event);

				return;
			}

			stroke = `${playerId}${Date.now()}`;
			drawing = [toGrid(event)];
			sentUpTo = 0;
			sentAt = Date.now();
			redraw();
		});

		fit.elem.addEventListener('pointermove', event => {
			if (erasing && Date.now() - sentAt > 50) {
				erase(event);
				sentAt = Date.now();
			}

			if (!drawing || (tool !== 'pen' && tool !== 'sieve')) return;

			const point = toGrid(event);
			const last = drawing.at(-1);

			if (Math.hypot(point[0] - last[0], point[1] - last[1]) < 1) return;

			drawing.push(point);
			if (Date.now() - sentAt > 80) sendPiece();
			redraw();
		});
		const finish = () => {
			erasing = false;

			if (!drawing) return;

			if (drawing.length === 1) socket.send({ gameId, playerId, type: 'line', line: drawing, stroke, sieve: tool === 'sieve' });
			else sendPiece();
			sounds.draw();
			settling = drawing;
			drawing = null;
			redraw();
		};

		fit.elem.addEventListener('pointerup', finish);
		fit.elem.addEventListener('pointercancel', finish);

		let plopAt = 0;
		let sparkleAt = 0;
		let fizzAt = 0;
		let tallyAt = 0;
		let sizzleAt = 0;
		let oopsAt = 0;
		// Gems sitting in any jar, so one landing can ring
		const gemsInCups = ({ grains = [], cups = [] }) =>
			grains.filter(([x, y, color]) => color === 'gem' && cups.some(cup => x > cup.x && x < cup.x + cup.width && y > cup.y && y < cup.y + cup.height)).length;
		const inCups = ({ cups }) => cups.reduce((total, { count }) => total + count, 0);
		const playSounds = (before, after) => {
			const secondsBefore = Math.ceil((before.wait ?? 0) / STEPS_PER_SECOND);
			const secondsAfter = Math.ceil(after.wait / STEPS_PER_SECOND);

			if (secondsAfter !== secondsBefore) secondsAfter ? sounds.count() : sounds.go();
			// Every win gets fireworks; the last level gets confetti and twice the fireworks
			if (after.won && !before.won) {
				if (state.level === game.levelCount - 1) {
					sounds.party();
					party = together(confetti(canvas.width, canvas.height), fireworks(canvas.width, canvas.height, 12, bangs));
				} else {
					sounds.win();
					party = fireworks(canvas.width, canvas.height, 6, bangs);
				}
				redraw();
			}
			// Beating this level's best score is a party too, once a round
			if (after.tally?.phase === 'done' && after.tally.score > roundBest && !cheered) {
				cheered = true;
				sounds.party();
				party = together(party, confetti(canvas.width, canvas.height));
				redraw();
			}
			if (after.spoiled && !before.spoiled) sounds.spoil();

			// Tick, tock with each second of the settling countdown, once it shows
			const left = still => (still > STEPS_PER_SECOND / 2 ? Math.ceil((STILL_STEPS - still) / STEPS_PER_SECOND) : 0);
			const leftNow = after.won || after.spoiled ? 0 : left(after.still ?? 0);

			if (leftNow && leftNow !== left(before.still ?? 0)) sounds.tick(leftNow % 2);
			if ((after.eaten ?? 0) > (before.eaten ?? 0)) sounds.chomp();
			// The score being counted: a blip up for each point gained, a blip down for each one lost
			if (after.tally && before.tally && after.tally.score !== before.tally.score && Date.now() - tallyAt > 40) {
				tallyAt = Date.now();
				sounds.tally(after.tally.score > before.tally.score, after.tally.score);
			}
			if ((after.poofed ?? 0) > (before.poofed ?? 0)) {
				sounds.sizzle();
				sounds.poof();
				party = together(party, fireworks(canvas.width, canvas.height, 2, bangs));
				redraw();
			}
			if ((after.rocks?.length ?? 0) > (before.rocks?.length ?? 0)) {
				sounds.sizzle();
				sounds.boom();
			}
			if ((after.burned ?? 0) > (before.burned ?? 0) && Date.now() - sizzleAt > 150) {
				sizzleAt = Date.now();
				sounds.sizzle();
			}
			if ((after.dissolved ?? 0) > (before.dissolved ?? 0) && Date.now() - fizzAt > 120) {
				fizzAt = Date.now();
				sounds.fizz();
			}
			if ((after.painted ?? 0) > (before.painted ?? 0) && Date.now() - sparkleAt > 150) {
				sparkleAt = Date.now();
				sounds.sparkle();
			}
			if ((after.caught ?? 0) < (before.caught ?? 0) && Date.now() - oopsAt > 200) {
				oopsAt = Date.now();
				sounds.oops();
			}
			if (inCups(after) > inCups(before) && Date.now() - plopAt > 90) {
				plopAt = Date.now();
				sounds.plop();
			}
		};

		let frame;
		const redraw = () => {
			frame ??= requestAnimationFrame(() => {
				frame = undefined;
				draw();
			});
		};

		// Sand frames arrive unevenly over a phone's network; they're queued and shown at the steady pace they were made
		// at, a frame or two behind, and skipped ahead when too many pile up
		const FRAME_MS = 1000 / (STEPS_PER_SECOND / 2);
		const frames = [];
		let showAt = 0;
		let drawnAt = 0;
		let pump;
		const showSand = message => {
			const { sand, cups, spouts, sliders, lavas, rocks, waters, monsters, eaten, poofed, tally, lines, won, spoiled, wait, caught, painted, dissolved, burned, still } = message;

			playSounds(state, message);

			const gemsBefore = gemsInCups(state);

			state = { ...state, grains: unpack(sand), cups, spouts: spouts ?? state.spouts, sliders: sliders ?? state.sliders, lavas: lavas ?? state.lavas, rocks: rocks ?? state.rocks, waters: waters ?? state.waters, monsters: monsters ?? state.monsters, eaten, poofed, tally, lines: lines ?? state.lines, won, spoiled, wait, caught, painted, dissolved, burned, still };
			if (gemsInCups(state) > gemsBefore) sounds.gem();
			best = message.best ?? best;
		};
		const play = now => {
			pump = requestAnimationFrame(play);

			// Stars keep twinkling and wind keeps blowing on screen even while the sand is still
			if (!frames.length || now < showAt) {
				if (now - drawnAt > (state.winds?.length || state.whirls?.length || state.waters?.length || state.lavas?.length || state.monsters?.length ? 33 : 66)) {
					drawnAt = now;
					draw();
				}

				return;
			}
			if (frames.length > 4) frames.splice(0, frames.length - 2);

			showSand(frames.shift());
			showAt = (now - showAt > FRAME_MS * 2 ? now : showAt) + FRAME_MS;
			draw();
		};

		pump = requestAnimationFrame(play);
		draw();
		this.addCleanup('frame', () => {
			cancelAnimationFrame(frame);
			cancelAnimationFrame(pump);
		});
		this.addCleanup(
			'socket',
			onMessage(message => {
				if (message.gameId !== gameId) return;

				if (message.update === 'state') {
					frames.length = 0;
					settling = null;
					if (message.state.wait > 0 && !(state.wait > 0)) sounds.count();
					// A new round: its count of steps starts over (or it's another level)
					const newRound = message.state.level !== state.level || (message.state.steps ?? 0) < (state.steps ?? 0);

					state = { ...message.state, grains: unpack(message.sand) };
					showTools();
					best = message.best ?? best;
					// The score to beat is the best from before the round
					if (newRound) {
						roundBest = best[state.level] ?? 0;
						cheered = false;
						// Every new round starts with the pen in hand
						pick('pen');
					}
					players = message.players ?? players;
					drawTeam();
					reached = message.reached ?? reached;
				}
				else if (message.update === 'sand') {
					frames.push(message);

					return;
				} else return;

				redraw();
			}),
		);
	}
}

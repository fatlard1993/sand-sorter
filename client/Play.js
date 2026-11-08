import { Button, Component, Link, styled } from '@vanilla-bean/components';
import { gameContext, getGame, onMessage, socket } from '@fatlard1993/web-game-framework/client';
import { View } from '@fatlard1993/web-game-framework/ui';

import { STEPS_PER_SECOND, unpack } from '../sand.js';
import { SCALE, drawBoard } from './drawBoard.js';
import { sounds } from './sounds.js';

const Board = styled(
	Component,
	({ space }) => `
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: ${space.md};
		padding: ${space.md};
	`,
);

const Box = styled(
	Component,
	({ colors, radius }) => `
		height: min(64vh, 130vw);
		max-width: 100%;
		aspect-ratio: 80 / 110;
		border-radius: ${radius.lg};
		border: 2px solid ${colors.border};
		touch-action: none;
		cursor: crosshair;
	`,
);

const Buttons = styled(
	Component,
	({ space }) => `
		display: flex;
		gap: ${space.lg};
		font-size: 2.4em;
	`,
);

const Status = styled(
	Component,
	() => `
		font-size: 1.6em;
		min-height: 1.4em;
	`,
);

const dots = { yellow: '🟡', blue: '🔵', red: '🔴', green: '🟢', purple: '🟣', orange: '🟠' };

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
		this._toolbar.options.heading = game.name;

		const { width, height } = game.size;
		const board = new Board({ appendTo: this._body });
		const status = new Status({ appendTo: board });
		const box = new Box({ tag: 'canvas', appendTo: board });
		const canvas = box.elem;
		const pen = canvas.getContext('2d');

		canvas.width = width * SCALE;
		canvas.height = height * SCALE;

		const buttons = new Buttons({ appendTo: board });

		new Button({
			textContent: '🔄',
			appendTo: buttons,
			onPointerPress: () => socket.send({ gameId, playerId, type: 'restart' }),
		});
		const next = new Button({
			textContent: '➡️',
			appendTo: buttons,
			onPointerPress: () => socket.send({ gameId, playerId, type: 'next' }),
		});

		let state = game.state;
		let drawing = null;
		let stroke;
		let tool = 'pen';

		const penButton = new Button({ textContent: '✏️', appendTo: buttons, onPointerPress: () => pick('pen') });
		const spongeButton = new Button({ textContent: '🧽', appendTo: buttons, onPointerPress: () => pick('sponge') });
		const pick = chosen => {
			tool = chosen;
			penButton.elem.style.opacity = tool === 'pen' ? '' : '0.4';
			spongeButton.elem.style.opacity = tool === 'sponge' ? '' : '0.4';
		};

		pick('pen');

		const draw = () => {
			drawBoard(pen, state, drawing);

			const counts = state.cups.map(cup => `${dots[cup.color] ?? '🪣'} ${Math.min(cup.count, cup.need)}/${cup.need}`).join('  ');

			status.elem.textContent = `🏁 ${state.level + 1}   ${state.won ? '🎉' : state.spoiled ? '❌ 🔄' : counts}`;
			next.elem.style.display = state.won ? '' : 'none';
		};

		const toGrid = ({ clientX, clientY }) => {
			const rect = canvas.getBoundingClientRect();

			return [Math.round(((clientX - rect.left) / rect.width) * width), Math.round(((clientY - rect.top) / rect.height) * height)];
		};

		let erasing = false;
		const erase = event => socket.send({ gameId, playerId, type: 'erase', at: toGrid(event) });

		canvas.addEventListener('pointerdown', event => {
			canvas.setPointerCapture(event.pointerId);

			if (tool === 'sponge') {
				erasing = true;
				erase(event);

				return;
			}

			stroke = `${playerId}${Date.now()}`;
			drawing = [toGrid(event)];
			sentAt = Date.now();
			redraw();
		});
		// The line goes to the server a piece at a time as it's drawn, so it catches sand before the finger lifts
		let sentAt = 0;
		const sendPiece = () => {
			if (!drawing || drawing.length < 2) return;

			socket.send({ gameId, playerId, type: 'line', line: drawing, stroke });
			drawing = [drawing.at(-1)];
			sentAt = Date.now();
		};

		canvas.addEventListener('pointermove', event => {
			if (erasing && Date.now() - sentAt > 50) {
				erase(event);
				sentAt = Date.now();
			}

			if (!drawing) return;

			const point = toGrid(event);
			const last = drawing.at(-1);

			if (point[0] !== last[0] || point[1] !== last[1]) drawing.push(point);
			if (Date.now() - sentAt > 80) sendPiece();
			redraw();
		});
		const finish = () => {
			erasing = false;

			if (!drawing) return;

			if (drawing.length === 1) socket.send({ gameId, playerId, type: 'line', line: drawing, stroke });
			else sendPiece();
			drawing = null;
			redraw();
		};

		canvas.addEventListener('pointerup', finish);
		canvas.addEventListener('pointercancel', finish);

		let plopAt = 0;
		const inCups = ({ cups }) => cups.reduce((total, { count }) => total + count, 0);
		const playSounds = (before, after) => {
			const secondsBefore = Math.ceil((before.wait ?? 0) / STEPS_PER_SECOND);
			const secondsAfter = Math.ceil(after.wait / STEPS_PER_SECOND);

			if (secondsAfter !== secondsBefore) secondsAfter ? sounds.count() : sounds.go();
			if (after.won && !before.won) sounds.win();
			if (after.spoiled && !before.spoiled) sounds.spoil();
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

		draw();
		this.addCleanup('frame', () => cancelAnimationFrame(frame));
		this.addCleanup(
			'socket',
			onMessage(message => {
				if (message.gameId !== gameId) return;

				if (message.update === 'state') {
					if (message.state.wait > 0 && !(state.wait > 0)) sounds.count();
					state = { ...message.state, grains: unpack(message.sand) };
				}
				else if (message.update === 'sand') {
					const { sand, cups, won, spoiled, wait, stars } = message;

					playSounds(state, message);
					state = { ...state, grains: unpack(sand), cups, won, spoiled, wait, stars };
				} else return;

				redraw();
			}),
		);
	}
}

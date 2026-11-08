import { Button, Component, Link, styled, theme } from '@vanilla-bean/components';
import { gameContext, getGame, onMessage, socket } from '@fatlard1993/web-game-framework/client';
import { View } from '@fatlard1993/web-game-framework/ui';

import { SPOUT_WIDTH, STEPS_PER_SECOND, unpack } from '../sand.js';
import { sounds } from './sounds.js';

const SCALE = 6;

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
		height: min(72vh, 140vw);
		max-width: 100%;
		aspect-ratio: 80 / 110;
		border-radius: ${radius.md};
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

const colorCache = {};
const color = name => (colorCache[name] ??= theme.colors.light(theme.colors[name]).toHexString());
const shades = [-8, -3, 2, 7];
const sandColor = (name, shade = 0) =>
	(colorCache[`${name}${shade}`] ??= theme.colors.light(theme.colors[name]).lighten(shades[shade]).toHexString());

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

		const strokeLine = (points, style) => {
			if (!points.length) return;

			pen.strokeStyle = style;
			pen.lineWidth = SCALE * 2;
			pen.lineCap = 'round';
			pen.lineJoin = 'round';
			pen.beginPath();
			pen.moveTo((points[0][0] - 0.5) * SCALE, (points[0][1] - 0.5) * SCALE);
			for (const [x, y] of points) pen.lineTo((x - 0.5) * SCALE, (y - 0.5) * SCALE);
			if (points.length === 1) pen.lineTo((points[0][0] - 0.5) * SCALE + 0.1, (points[0][1] - 0.5) * SCALE);
			pen.stroke();
		};

		const draw = () => {
			pen.fillStyle = theme.colors.blackish().toHexString();
			pen.fillRect(0, 0, canvas.width, canvas.height);

			for (const { x, y, width: paintWidth, height: paintHeight, color: name } of state.paints ?? []) {
				pen.fillStyle = theme.colors.alpha(theme.colors[name], 0.45).toRgbString();
				pen.fillRect(x * SCALE, y * SCALE, paintWidth * SCALE, paintHeight * SCALE);
			}

			// Wind: a pale band with arrows the way it blows
			for (const { x, y, width: windWidth, height: windHeight, blow } of state.winds ?? []) {
				pen.fillStyle = theme.colors.alpha(theme.colors.teal, 0.18).toRgbString();
				pen.fillRect(x * SCALE, y * SCALE, windWidth * SCALE, windHeight * SCALE);
				pen.fillStyle = theme.colors.alpha(theme.colors.white, 0.5).toRgbString();
				pen.font = `${windHeight * SCALE * 0.6}px sans-serif`;
				pen.textAlign = 'center';
				pen.textBaseline = 'middle';
				for (let at = x + 8; at < x + windWidth; at += 16)
					pen.fillText(blow > 0 ? '→' : '←', at * SCALE, (y + windHeight / 2) * SCALE);
			}

			for (const cup of state.cups) {
				const { x, y, width: cupWidth, height: cupHeight } = cup;
				const fill = Math.min(1, cup.count / cup.need);

				pen.fillStyle = theme.colors.alpha(theme.colors[cup.color], 0.25).toRgbString();
				pen.fillRect(x * SCALE, (y + cupHeight * (1 - fill)) * SCALE, cupWidth * SCALE, cupHeight * fill * SCALE);
				strokeLine(
					[
						[x + 0.5, y],
						[x + 0.5, y + cupHeight + 0.5],
						[x + cupWidth + 0.5, y + cupHeight + 0.5],
						[x + cupWidth + 0.5, y],
					],
					color('gray'),
				);
			}

			for (const wall of state.walls ?? []) strokeLine(wall.map(([x, y]) => [x + 0.5, y + 0.5]), color('gray'));
			for (const { points } of state.lines)
				strokeLine(points.map(([x, y]) => [x + 0.5, y + 0.5]), theme.colors.white.toHexString());
			if (drawing) strokeLine(drawing, theme.colors.alpha(theme.colors.white, 0.6).toRgbString());

			for (const [x, y, name, , shade] of state.grains) {
				pen.fillStyle = sandColor(name, shade);
				pen.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
			}

			// Where the sand comes from: a little funnel in its color at the top
			for (const { x, color: name } of state.spouts ?? []) {
				const left = (x - (SPOUT_WIDTH >> 1)) * SCALE;
				const right = left + SPOUT_WIDTH * SCALE;

				pen.fillStyle = color(name);
				pen.beginPath();
				pen.moveTo(left - SCALE * 3, 0);
				pen.lineTo(right + SCALE * 3, 0);
				pen.lineTo(right, SCALE * 3);
				pen.lineTo(left, SCALE * 3);
				pen.closePath();
				pen.fill();
			}

			if (state.spoiled) {
				pen.font = `${canvas.width / 4}px sans-serif`;
				pen.textAlign = 'center';
				pen.textBaseline = 'middle';
				pen.fillText('😢', canvas.width / 2, canvas.height / 3);
			}

			if (state.won) {
				pen.fillStyle = color('yellow');
				pen.font = `${canvas.width / 6}px sans-serif`;
				pen.textAlign = 'center';
				pen.textBaseline = 'middle';
				pen.fillText('⭐'.repeat(state.stars) + '☆'.repeat(3 - state.stars), canvas.width / 2, canvas.height / 3);
			}

			if (state.wait > 0) {
				pen.fillStyle = theme.colors.white.toHexString();
				pen.font = `bold ${canvas.height / 4}px sans-serif`;
				pen.textAlign = 'center';
				pen.textBaseline = 'middle';
				pen.fillText(String(Math.ceil(state.wait / STEPS_PER_SECOND)), canvas.width / 2, canvas.height / 2);
			}

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

import { Button, Component, styled } from '@vanilla-bean/components';
import { createGame, getGames, onMessage } from '@fatlard1993/web-game-framework/client';
import { View } from '@fatlard1993/web-game-framework/ui';

import { goIn } from './goIn.js';

const Boxes = styled(
	Component,
	({ space }) => `
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: ${space.lg};
		padding: ${space.lg};
	`,
);

const Box = styled(
	Button,
	({ colors, radius, space }) => `
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: ${space.sm};
		aspect-ratio: 1;
		border-radius: ${radius.lg};
		font-size: 2.6rem;
		background: ${colors.alpha(colors.yellow, 0.25)};
	`,
);

const NewBox = styled(
	Box,
	({ colors }) => `
		background: ${colors.alpha(colors.green, 0.35)};
		font-size: 4rem;
	`,
);

const People = styled(
	Component,
	() => `
		font-size: 1.4rem;
	`,
);

const boxIcons = ['⏳', '🏖️', '🪣', '🌈', '🏜️', '⭐'];

// The lobby: a big plus for a new sand box, and a big tile for each one already going. A tap goes straight in.
export default class Lobby extends View {
	constructor(options, ...children) {
		super({ ...options, toolbar: { heading: '⏳ Sand' } }, ...children);
	}

	build() {
		super.build();
		this._draw();
		this.addCleanup(
			'socket',
			onMessage(({ update }) => ['newGame', 'removedGame', 'addPlayer', 'removePlayer'].includes(update) && this._draw()),
		);
	}

	async _draw() {
		const games = await getGames({ invalidateAfter: 0 });

		this._body.empty();

		const boxes = new Boxes({ appendTo: this._body });

		new NewBox({
			appendTo: boxes,
			textContent: '➕',
			onPointerPress: async () => {
				const name = boxIcons[Math.floor(Math.random() * boxIcons.length)];
				const { body: game } = await createGame({ body: { name } });

				goIn(game.id);
			},
		});

		for (const { id, name, players } of games.body ?? [])
			new Box({
				appendTo: boxes,
				append: [new Component({ textContent: name }), new People({ textContent: `👤 ${players.length}` })],
				onPointerPress: () => goIn(id),
			});
	}
}

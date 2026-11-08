import { joinGame } from '@fatlard1993/web-game-framework/client';

const names = ['🐢', '🦊', '🐸', '🐙', '🦄', '🐝', '🐧', '🦖'];

// Into a game with no form to fill: the same player as last time, or a new one named by an animal
export const goIn = async gameId => {
	const name = localStorage.getItem('lastName') || names[Math.floor(Math.random() * names.length)];
	const join = await joinGame(gameId, { body: { name, playerId: localStorage.getItem(gameId) } });

	if (join.status !== 'success') {
		window.location.href = '#/hub';

		return;
	}

	localStorage.setItem(gameId, join.body.id);
	localStorage.setItem('lastName', join.body.name);
	window.location.href = `#/play/${gameId}`;
};

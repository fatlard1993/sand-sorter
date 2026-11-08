import { Button, Component, Dialog, styled } from '@vanilla-bean/components';

const Grid = styled(
	Component,
	({ space }) => `
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: ${space.md};
		padding: ${space.md};
	`,
);

const Level = styled(
	Button,
	({ space }) => `
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: ${space.xs};
		font-size: 2rem;
		padding: ${space.md};
	`,
);

const Stars = styled(
	Component,
	() => `
		font-size: 0.9rem;
		min-height: 1.2em;
	`,
);

// Every level as a big number with the best stars won on it; a tap goes there
export const pickLevel = ({ count, best, onPick }) => {
	const grid = new Grid();
	const dialog = new Dialog({
		header: '🗺️',
		size: 'fit',
		body: grid,
		buttons: ['❌'],
		onButtonPress: ({ closeDialog }) => closeDialog(),
	});

	for (let level = 0; level < count; level++)
		new Level({
			appendTo: grid,
			append: [
				new Component({ textContent: String(level + 1) }),
				new Stars({ textContent: best[level] ? '⭐'.repeat(best[level]) : '' }),
			],
			onPointerPress: () => {
				onPick(level);
				dialog.close();
			},
		});
};

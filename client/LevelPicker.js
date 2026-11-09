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

// A world's picture across the whole row, starting its group of levels
const World = styled(
	Component,
	({ space }) => `
		grid-column: 1 / -1;
		text-align: center;
		font-size: 2rem;
		padding-top: ${space.sm};
	`,
);

const Stars = styled(
	Component,
	() => `
		font-size: 0.9rem;
		min-height: 1.2em;
	`,
);

// Every level as a big number with the most grains caught on it, grouped by world; a tap goes there. Levels not
// reached yet are locked.
export const pickLevel = ({ count, worlds = [], best, reached, onPick }) => {
	const grid = new Grid();
	const dialog = new Dialog({
		header: '🗺️',
		size: 'fit',
		body: grid,
		buttons: ['❌'],
		onButtonPress: ({ closeDialog }) => closeDialog(),
	});

	const starts = new Map();

	worlds.reduce((first, world) => {
		starts.set(first, world);

		return first + world.count;
	}, 0);

	for (let level = 0; level < count; level++) {
		const locked = level > reached;

		if (starts.has(level)) new World({ appendTo: grid, textContent: starts.get(level).icon });

		new Level({
			appendTo: grid,
			disabled: locked,
			style: locked ? { opacity: 0.4 } : {},
			append: [
				new Component({ textContent: locked ? '🔒' : String(level + 1) }),
				new Stars({ textContent: best[level] ? `⏳ ${best[level]}` : '' }),
			],
			onPointerPress: () => {
				if (locked) return;

				onPick(level);
				dialog.close();
			},
		});
	}
};

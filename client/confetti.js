import { theme } from '@vanilla-bean/components';

const hues = ['yellow', 'blue', 'red', 'green', 'purple', 'pink', 'teal', 'orange'];
const LIFE_MS = 5000;

// Paper bits that burst from the top and flutter down; draw() says whether any are still falling
export const confetti = (width, height) => {
	const started = performance.now();
	const bits = Array.from({ length: 160 }, () => ({
		x: Math.random() * width,
		y: -Math.random() * height * 0.5,
		fall: 2 + Math.random() * 4,
		drift: (Math.random() - 0.5) * 3,
		spin: Math.random() * Math.PI,
		size: 6 + Math.random() * 8,
		color: theme.colors.light(theme.colors[hues[Math.floor(Math.random() * hues.length)]]).toHexString(),
	}));

	return pen => {
		const age = performance.now() - started;

		if (age > LIFE_MS) return false;

		for (const bit of bits) {
			bit.y += bit.fall;
			bit.x += bit.drift + Math.sin(bit.y / 20);
			bit.spin += 0.15;
			pen.save();
			pen.globalAlpha = Math.min(1, (LIFE_MS - age) / 1000);
			pen.translate(bit.x, bit.y);
			pen.rotate(bit.spin);
			pen.fillStyle = bit.color;
			pen.fillRect(-bit.size / 2, -bit.size / 4, bit.size, bit.size / 2);
			pen.restore();
		}

		return true;
	};
};

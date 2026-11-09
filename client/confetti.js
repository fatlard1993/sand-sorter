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

// Rockets that shoot up from the ground and burst into sparks of every color, one after another
export const fireworks = (width, height, count = 6, { onLaunch, onBurst } = {}) => {
	const started = performance.now();
	const rockets = Array.from({ length: count }, (_, at) => ({
		launch: at * 450 + Math.random() * 200,
		x: width * (0.15 + Math.random() * 0.7),
		top: height * (0.15 + Math.random() * 0.3),
		y: height,
		sparks: null,
		color: hues[Math.floor(Math.random() * hues.length)],
	}));

	return pen => {
		const age = performance.now() - started;
		let busy = false;

		for (const rocket of rockets) {
			if (age < rocket.launch) {
				busy = true;
				continue;
			}

			if (!rocket.sparks) {
				if (rocket.y === height) onLaunch?.();
				rocket.y -= height / 45;
				pen.fillStyle = theme.colors.lightest(theme.colors[rocket.color]).toHexString();
				pen.fillRect(rocket.x - 2, rocket.y, 4, 10);
				if (rocket.y <= rocket.top) onBurst?.();
				if (rocket.y <= rocket.top)
					rocket.sparks = Array.from({ length: 50 }, (_, spark) => {
						const angle = (spark / 50) * Math.PI * 2;
						const speed = 2 + Math.random() * 4;

						return { x: rocket.x, y: rocket.y, dx: Math.cos(angle) * speed, dy: Math.sin(angle) * speed, life: 1 };
					});
				busy = true;
				continue;
			}

			for (const spark of rocket.sparks) {
				if (spark.life <= 0) continue;

				spark.x += spark.dx;
				spark.y += spark.dy;
				spark.dy += 0.12;
				spark.dx *= 0.98;
				spark.life -= 0.015;
				pen.save();
				pen.globalAlpha = Math.max(0, spark.life);
				pen.fillStyle = theme.colors.light(theme.colors[rocket.color]).toHexString();
				pen.shadowColor = pen.fillStyle;
				pen.shadowBlur = 8;
				pen.fillRect(spark.x - 2, spark.y - 2, 4, 4);
				pen.restore();
				busy = true;
			}
		}

		return busy;
	};
};

// Several parties at once; still going while any of them is
export const together =
	(...parties) =>
	pen =>
		parties.map(party => party?.(pen)).some(Boolean);

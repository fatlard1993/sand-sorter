import { View } from '@fatlard1993/web-game-framework/ui';

import { goIn } from './goIn.js';

// A shared link to a game lands here, and goes straight in
export default class Enter extends View {
	static schema = { gameId: {} };

	build() {
		super.build();
		goIn(this.options.gameId);
	}
}

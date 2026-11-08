import { Page, Router } from '@vanilla-bean/components';

import '@fatlard1993/web-game-framework/client/socket';
import '@vanilla-bean/components/app/reloadOnBuild';

import Enter from './Enter.js';
import Lobby from './Lobby.js';
import Play from './Play.js';

// No forms: the lobby makes a game or picks one with a tap, and a shared link goes straight in
const views = {
	'/hub': Lobby,
	'/join/:gameId': Enter,
	'/play/:gameId': Play,
};

new Page({ appendTo: document.body, append: new Router({ views, defaultPath: '/hub' }) });

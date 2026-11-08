import { Dialog } from '@vanilla-bean/components';
import { QRCode } from '@fatlard1993/web-game-framework/ui';

// A code a friend's phone can scan to land in this same game
export const invite = gameId =>
	new Dialog({
		header: '👫',
		size: 'fit',
		body: new QRCode({
			src: `${window.location.origin}/#/join/${gameId}`,
			qrCodeConfig: { width: 260, margin: 2 },
			style: { display: 'block', margin: '0 auto' },
		}),
		buttons: ['❌'],
		onButtonPress: ({ closeDialog }) => closeDialog(),
	});

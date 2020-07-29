import { Round } from './round'
import { setReact } from '../mainMessage';
import { removeReactAdd, removeReactRemove, addCommand, removeCommand } from '../command';

export class ReadyRound extends Round {
	numReady = 0;

	onStart(): void {
		this.commissions.updateMessage(
			'Get ready to draw',
			'React to this message when you\'re ready',
		).then(message => {
			setReact(message, '✅', (messageReact, user) => {
				++this.numReady;

				/* everyone in ready */
				if (this.numReady == this.commissions.players.length) {
					this.commissions.nextRound();
				}

			}, (messageReact, user) => {
				--this.numReady;
			});
		});

		/* if the gamemaster needs to bypass the ready system */
		addCommand('force', message => {
			this.commissions.nextRound();
		})
	}

	onEnd(): void {
		if (this.commissions.message) {
			removeReactAdd(this.commissions.message);
			removeReactRemove(this.commissions.message);
		}

		removeCommand('force');
	}
}

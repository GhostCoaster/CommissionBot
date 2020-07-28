import { Round } from './round'
import { updateMessage, setReact } from '../mainMessage';
import { removeReactAdd, removeReactRemove, addCommand, removeCommand } from '../command';

export class ReadyRound extends Round {
	numReady = 0;

	onStart(): void {
		updateMessage(
			'Get ready to draw',
			'React to this message when you\'re ready',
			undefined,
			this.commissions.channel,
			this.commissions.message
		).then(message => {
			this.commissions.message = message;

			setReact(this.commissions.message, '✅', (messageReact, user) => {
				++this.numReady;

				/* everyone in ready */
				if (this.numReady == this.commissions.players.length) {
					this.commissions.nextRound();
				}

			}, (messageReact, user) => {
				--this.numReady;
			});

		}).catch(err => {
			console.log(err);
		});

		/* if the gamemaster need to bypass the ready system */
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

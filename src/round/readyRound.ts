import { Round } from './round'
import { setReact } from '../commissions/mainMessage';
import { removeReactAdd, removeReactRemove, addCommand, removeCommand } from '../command';

export class ReadyRound extends Round {
	numReady = 0;

	onStart(): void {
		this.commissions.updateMessage({
			fields: [{
				name: 'Get ready to draw',
				value: 'React to this message when you\'re ready'
			}]
		}).then(message => {
			setReact(message, '✅', (messageReact, user) => {
				if (this.commissions.filterReact(messageReact, user)) return;

				++this.numReady;

				/* everyone in ready */
				if (this.numReady === this.commissions.players.length) {
					this.commissions.nextRound();
				}

			}, (messageReact, user) => {
				--this.numReady;
			});
		});

		/* if the gamemaster needs to bypass the ready system */
		addCommand(this.commissions.channel, 'force', message => {
			if (this.commissions.isAdmin(message.member))
				this.commissions.nextRound();
		});
	}

	onEnd(): void {
		if (this.commissions.message) {
			removeReactAdd(this.commissions.message);
			removeReactRemove(this.commissions.message);
		}

		removeCommand(this.commissions.channel, 'force');
	}
}

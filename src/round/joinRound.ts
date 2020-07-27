import * as Round from './round'
import { Commissions } from '../commissions';
import { RoundType } from './rounds';
import { updateMessage, setReact } from '../mainMessage';
import { removeReactAdd, removeReactRemove } from '../command';

export class JoinRound extends Round.Round {
	onStart(): void {
		updateMessage(
			'Commissions about to begin',
			'react to this message to join',
			this.commissions.channel,
			this.commissions.message
		).then(message => {
			this.commissions.message = message;
 
			setReact(message, '☑️', (messageReaction, user) => {
				this.commissions.playerJoin(user);
			}, (messageReaction, user) => {
				this.commissions.playerLeave(user);
			});

		}).catch(() => {
			console.log('something went wrong');
		});
	}

	onEnd(): void {
		if (this.commissions.message) {
			removeReactAdd(this.commissions.message)
			removeReactRemove(this.commissions.message)
		}
	}
}

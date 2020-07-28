import * as Round from './round'
import { Commissions } from '../commissions';
import { RoundType } from './rounds';
import { updateMessage, setReact } from '../mainMessage';
import { removeReactAdd, removeReactRemove, addCommand, removeCommand } from '../command';

export class JoinRound extends Round.Round {
	onStart(): void {
		updateMessage(
			'Commissions about to begin',
			'react to this message to join',
			undefined,
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

		addCommand('start', message => {
			if (!this.commissions.isGameMaster(message.author)) return;

			if (this.commissions.players.length < 2)
				return void this.commissions.channel.send('Need at least two people to start a commissions!');

			this.commissions.nextRound();
		});
	}

	onEnd(): void {
		if (this.commissions.message) {
			removeReactAdd(this.commissions.message)
			removeReactRemove(this.commissions.message)
		}

		removeCommand('start');
	}
}

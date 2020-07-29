import * as Round from './round'
import { Commissions } from '../commissions';
import { RoundType } from './rounds';
import { updateMessage, setReact } from '../mainMessage';
import { removeReactAdd, removeReactRemove, addCommand, removeCommand } from '../command';

export class JoinRound extends Round.Round {
	onStart(): void {
		this.commissions.updateMessage(
			'Commissions about to begin',
			'react to this message to join'
		).then(message => {
			setReact(message, '☑️', (messageReaction, user) => {
				this.commissions.playerJoin(user);
			}, (messageReaction, user) => {
				this.commissions.playerLeave(user);
			});
		});

		addCommand(this.commissions.channel, 'start', message => {
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

		removeCommand(this.commissions.channel, 'start');
	}
}

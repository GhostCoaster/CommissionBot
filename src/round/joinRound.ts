import * as Round from './round'
import { Commissions } from '../commissions';
import { RoundType } from './rounds';
import { updateMessage, } from '../mainMessage';
import { addReactAdd, removeReactAdd } from '../command';

export class JoinRound extends Round.Round {
	onStart(): void {
		updateMessage(
			'Commissions about to begin',
			'react to this message to join',
			this.commissions.channel,
			this.commissions.message
		).then(message => {
			this.commissions.message = message;

			message.react('ballot_box_with_check');
			addReactAdd(message, () => {

			});

		}).catch(() => {
			console.log('something went wrong');

			if (this.commissions.message)
				removeReactAdd(this.commissions.message)
		});
	}

	onEnd(): void {

	}
}

import { Round } from './round';
import { updateMessage } from '../mainMessage';
import * as Util from '../util';

export class VoteRound extends Round {
	onStart(): void {
		updateMessage(
			'Voting',
			'React to an image to vote for it',
			undefined,
			this.commissions.channel,
			this.commissions.message
		).then(message => {
			this.commissions.message = message;
		}).catch(err => console.log(err));
	}

	onEnd(): void {
		
	}
}

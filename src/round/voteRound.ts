
import { Round } from './round';
import { updateMessage } from '../mainMessage';
import * as Util from '../util';

export class VoteRound extends Round {
	onStart(): void {
		this.commissions.updateMessage(
			'Voting',
			'React to an image to vote for it'
		);
		
		/* unimplemented */
	}

	onEnd(): void {
		
	}
}

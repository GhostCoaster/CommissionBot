
import { Round } from './round'
import { updateMessage, editMessage } from '../mainMessage';
import { Message } from 'discord.js';
import { Timer } from '../timer';
import * as Util from '../util';
import { RoundType } from './rounds';
import { Commissions } from '../commissions';

export class DrawRound extends Round {
	timer: Timer = undefined as unknown as Timer;

	construct(roundType: RoundType, commissions: Commissions) {
		super.construct(roundType, commissions);

		this.timer = new Timer(this.commissions.drawTime, 5, secondsLeft => {
			this.commissions.editMessage(undefined, undefined, Util.timeDescription(secondsLeft));
		}, () => {
			this.commissions.nextRound();
		});
	}

	onStart(): void {
		console.log(`here >> ${this.commissions.message}`);

		this.commissions.updateMessage(
			'Currently drawing',
			'Submit after time runs out',
			Util.timeDescription(this.timer.getTime())
		);
		
		this.timer.start();
	}
	
	onEnd(): void {
		this.timer.stop();
	}
}

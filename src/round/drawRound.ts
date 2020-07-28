
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
			/* edit the message every 5 seconds */
			if (this.commissions.message) {
				editMessage(
					'Currently drawing',
					'Submit after time runs out',
					Util.generateDescription(secondsLeft),
					this.commissions.message
				);
			}
		}, () => {
			this.commissions.nextRound();
		});
	}

	onStart(): void {
		let description = `Time left: ${Util.timeString(this.timer.getTime())}`;

		updateMessage(
			'Currently drawing',
			'Submit after time runs out',
			Util.generateDescription(this.timer.getTime()),
			this.commissions.channel,
			this.commissions.message
		).then(message => {
			this.commissions.message = message;
		}).catch(err => console.log(err));

		this.timer.start();
	}
	
	onEnd(): void {
		this.timer.stop();
	}
}

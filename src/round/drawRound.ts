
import { Round } from './round'
import { updateMessage, editMessage } from '../mainMessage';
import { Message } from 'discord.js';
import { Timer } from '../timer';
import * as Util from '../util';

export class DrawRound extends Round {
	timer = new Timer(300, 5, secondsLeft => {
		/* edit the message every 5 seconds */
		if (this.commissions.message) {
			editMessage(
				'Currently drawing',
				'Submit after time runs out',
				this.generateDescription(secondsLeft),
				this.commissions.message
			);
		}
	}, () => {
		this.commissions.nextRound();
	});

	generateDescription(secondsLeft: number) {
		let description = `Time left: ${Util.timeString(secondsLeft)}`;

		return `\`\`\`markdown\n${description}${'-'.repeat(description.length)}\`\`\``;
	}

	onStart(): void {
		let description = `Time left: ${Util.timeString(this.timer.getTime())}`;

		updateMessage(
			'Currently drawing',
			'Submit after time runs out',
			this.generateDescription(description.length),
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

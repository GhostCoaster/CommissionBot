
import { Round } from './round'
import { updateMessage, editMessage } from '../commissions/mainMessage';
import { Message } from 'discord.js';
import { Timer } from '../timer';
import * as Util from '../util';
import { RoundType } from './rounds';
import { Commissions } from '../commissions/commissions';
import { addCommand, removeCommand } from '../command';

export class DrawRound extends Round {
	onStart(): void {
		this.timer = new Timer(this.commissions.drawTime, 5, secondsLeft => {
			this.commissions.editMessage({ description: Util.timeDescription(secondsLeft) });
		}, () => {
			this.commissions.nextRound();
		});

		this.timer.start();

		this.commissions.updateMessage({
			description: Util.timeDescription(this.timer.getTime()),
			fields: [{
				name: 'Currently drawing',
				value: 'Submit after time runs out'
			}]
		});

		/* if the gamemaster needs to bypass the ready system */
		addCommand(this.commissions.channel, 'force', message => {
			if (this.commissions.isAdmin(message.member))
				this.commissions.nextRound();
		});
	}
	
	onEnd(): void {
		this.timer.stop();

		removeCommand(this.commissions.channel, 'force');
	}
}

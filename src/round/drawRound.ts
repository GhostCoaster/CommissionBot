
import { Round } from './round'
import { Timer } from '../timer';
import * as Util from '../util';

export class DrawRound extends Round {
	constructor() {
		super([
			{
				keyword: 'force',
				onMessage: message => {
					if (this.commissions.isAdmin(message.member)) {
						this.commissions.nextRound();
					}
				}
			}
		]);
	}

	onMessage(): void {}

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
	}
	
	onEnd(): void {
		this.timer.stop();
	}

	onPlayerLeave(): void {}
}


import { Round } from './round'
import { GuildMember } from 'discord.js';
import { Timer } from '../timer';
import { removeDelete, addDelete, GuildMessage } from '../command';
import * as Util from '../util';
import { Submission } from '../commissions/submission';

export class SubmitRound extends Round {
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

	onMessage(message: GuildMessage): void {
		if (message.attachments.size == 0) return Util.deleteNotBot(message);

		let playerIndex = this.commissions.players.indexOf(message.member);
		if (playerIndex === -1) return Util.deleteNotBot(message);

		/* delete old submission from this player if it exists */
		/* if it doesn't exist then this is the player's first submission */
		let oldSubmission = this.commissions.submittedDrawings[playerIndex];
		if (oldSubmission) {
			removeDelete(oldSubmission.message);
			oldSubmission.message.delete();
		} else {
			/* the first time submitting a submission */
			++this.numSubmissions;
		}

		/* record this as the player's submission */
		this.commissions.submittedDrawings[playerIndex] = new Submission(message);

		/* end submission early if everyone has submitted */
		if (this.numSubmissions === this.commissions.players.length) {
			this.commissions.nextRound();
		}

		/* if they revoke submission */
		addDelete(message, () => {
			--this.numSubmissions;

			this.commissions.submittedDrawings[playerIndex] = undefined;
		});
	}

	numSubmissions = 0;

	onStart(): void {
		this.timer = new Timer(60, 5, secondsLeft => {
			this.commissions.editMessage({ description: Util.timeDescription(secondsLeft) });
		}, () => {
			this.commissions.nextRound();
		});

		this.timer.start();

		this.commissions.updateMessage({
			description: Util.timeDescription(this.timer.getTime()),
			fields: [{
				name: 'Submission Minute',
				value: 'Send your completed commission'
			}]
		});
	}
	
	onEnd(): void {
		this.timer.stop();

		this.commissions.submittedDrawings.forEach(submission => {
			if (submission) removeDelete(submission.message);
		});
	}

	onPlayerLeave(_: GuildMember, index: number) {
		const submission = this.commissions.submittedDrawings[index];

		/* if the leaving player submitted */
		if (submission) {
			removeDelete(submission.message);
			submission.message.delete();
			--this.numSubmissions;
		}

		/* see if now we can continute */
		if (this.numSubmissions === this.commissions.players.length) {
			this.commissions.nextRound();
		}
	}
}


import { Round } from './round'
import { updateMessage, editMessage } from '../commissions/mainMessage';
import { DiscordAPIError, Message, GuildMember } from 'discord.js';
import { Timer } from '../timer';
import { addAnyCommand, removeAnyCommand, removeDelete, addDelete, addCommand, removeCommand } from '../command';
import * as Util from '../util';
import { RoundType } from './rounds';
import { Commissions } from '../commissions/commissions';
import { Submission } from '../commissions/submission';

export class SubmitRound extends Round {
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

		/* if the gamemaster needs to bypass the ready system */
		addCommand(this.commissions.channel, 'force', message => {
			if (this.commissions.isAdmin(message.member))
				this.commissions.nextRound();
		});

		addAnyCommand(this.commissions.channel, message => {
			if (message.attachments.size == 0) return message.delete();

			let playerIndex = this.commissions.players.indexOf(message.member);
			if (playerIndex === -1) return message.delete();

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
			addDelete(message, deleted => {
				--this.numSubmissions;

				this.commissions.submittedDrawings[playerIndex] = undefined;
			});
		});
	}
	
	onEnd(): void {
		this.timer.stop();

		removeAnyCommand(this.commissions.channel);
		removeCommand(this.commissions.channel, 'force');

		this.commissions.submittedDrawings.forEach(submission => {
			if (submission) removeDelete(submission.message);
		});
	}

	onPlayerLeave(member: GuildMember, index: number) {
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

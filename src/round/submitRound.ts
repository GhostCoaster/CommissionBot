
import { Round } from './round'
import { updateMessage, editMessage } from '../mainMessage';
import { DiscordAPIError, Message } from 'discord.js';
import { Timer } from '../timer';
import { addAnyCommand, removeAnyCommand } from '../command';
import * as Util from '../util';
import { RoundType } from './rounds';
import { Commissions } from '../commissions';

export class SubmitRound extends Round {
	numSubmissions = 0;
	timer: Timer = undefined as unknown as Timer;

	construct(roundType: RoundType, commissions: Commissions) {
		super.construct(roundType, commissions);

		this.timer = new Timer(60, 5, secondsLeft => {
			if (this.commissions.message) {
				editMessage(
					'Submission Minute',
					'Send your completed commission',
					Util.generateDescription(secondsLeft),
					this.commissions.message
				);
			}
		}, () => {
			this.commissions.nextRound();
		});
	}

	onStart(): void {
		updateMessage(
			'Submission Minute',
			'Send your completed commission',
			Util.generateDescription(this.timer.getTime()),
			this.commissions.channel,
			this.commissions.message
		).then(message => {
			this.commissions.message = message;
		}).catch(err => console.log(err));

		this.timer.start();

		addAnyCommand(message => {
			if (message.attachments.size == 0) return message.delete();

			let playerIndex = this.commissions.players.indexOf(message.author);
			if (playerIndex === -1) return message.delete();

			/* delete old submission from this player if it exists */
			/* if it doesn't exist then this is the player's first submission */
			let oldSubmission = this.commissions.submittedDrawings[playerIndex];
			if (oldSubmission)
				oldSubmission.delete();
			else
				++this.numSubmissions;

			/* record this as the player's submission */
			this.commissions.submittedDrawings[playerIndex] = message;

			/* end submission early if everyone has submitted */
			if (this.numSubmissions === this.commissions.players.length) {
				this.commissions.nextRound();
			}
		});
	}
	
	onEnd(): void {
		this.timer.stop();

		removeAnyCommand();
	}
}

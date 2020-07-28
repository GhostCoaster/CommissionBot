import { Round } from "./round";
import { updateMessage } from "../mainMessage";
import { addAnyCommand, addCommand, removeCommand, removeAnyCommand } from '../command';
import { User } from "discord.js";

export class ReferenceRound extends Round {
	originalIndex = 0;

	onStart(): void {
		this.originalIndex = this.commissions.playerIndex;
		this.updateReferenceMessage(this.commissions.players[this.originalIndex]);

		addCommand('pass', message => {
			if (!this.commissions.isCurrentPlayer(message.author)) return;
	
			this.commissions.cycleCurrentPlayer();
			
			/* if no one wants to send an image */
			if (this.commissions.playerIndex === this.originalIndex) {
				this.commissions.channel.send('No one has an image so commissions is ending!');
				this.commissions.stop();
			/* or we just need to update the message */
			} else {
				this.updateReferenceMessage(this.commissions.players[this.commissions.playerIndex]);
			}
		});

		addAnyCommand(message => {
			console.log('here');
			if (!this.commissions.isCurrentPlayer(message.author)) return;

			console.log('now');

			/* could potentially put an actual image check here */
			if (message.attachments.size === 0) {
				this.commissions.channel.send('Please attach an image!');
				return;
			}

			this.commissions.nextRound();
		});

		/* now that we know all the players make the submission array */
		this.commissions.submittedDrawings = new Array(this.commissions.players.length);
	}

	onEnd(): void {
		removeCommand('pass');
		removeAnyCommand();
	}

	updateReferenceMessage(player: User) {
		console.log('updating reference message...');

		updateMessage(
			'Selecting image to draw',
			`<@${player.id}> is selecting`,
			undefined,
			this.commissions.channel,
			this.commissions.message
		).then(message => {
			this.commissions.message = message;
		}).catch(err => {
			console.log(`something went wrong ${err}`);
		});
	}
}

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
				this.commissions.stop();
			/* or we just need to update the message */
			} else {
				this.updateReferenceMessage(this.commissions.players[this.originalIndex]);
			}
		});

		addAnyCommand(message => {
			if (!this.commissions.isCurrentPlayer(message.author)) return;

			message.attachments.forEach(attachment => {
				attachment.
			});
		});
	}

	onEnd(): void {
		removeCommand('pass');
		removeAnyCommand();
	}

	updateReferenceMessage(player: User) {
		updateMessage(
			'Selecting image to draw',
			`<@${player.id}> is selecting`,
			this.commissions.channel,
			this.commissions.message
		).catch(() => {
			console.log('something went wrong');
		});
	}
}

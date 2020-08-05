
import { Round } from "./round";
import { updateMessage } from "../commissions/mainMessage";
import { addAnyCommand, addCommand, removeCommand, removeAnyCommand } from '../command';
import { User, ReactionUserManager, GuildMember } from "discord.js";

export class ReferenceRound extends Round {
	originalIndex = 0;

	onStart(): void {
		this.originalIndex = this.commissions.playerIndex;
		this.updateReferenceMessage(this.commissions.players[this.originalIndex]);

		addCommand(this.commissions.channel, 'pass', message => {
			if (!this.commissions.isCurrentPlayer(message.member)) return;
	
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

		/* if the gamemaster doesn't like someone */
		addCommand(this.commissions.channel, 'skip', message => {
			if (!this.commissions.isAdmin(message.member)) return;
			
			this.commissions.cycleCurrentPlayer();
			this.updateReferenceMessage(this.commissions.players[this.commissions.playerIndex]);
		});

		addAnyCommand(this.commissions.channel, message => {
			if (!this.commissions.isCurrentPlayer(message.member)) return;

			/* could potentially put an actual image check here */
			if (message.attachments.size === 0) {
				this.commissions.channel.send('Please attach an image!');
				return;
			}

			this.commissions.cycleCurrentPlayer();
			this.commissions.nextRound();
		});

		/* now that we know all the players make the submission array */
		this.commissions.submittedDrawings = new Array(this.commissions.players.length);
	}

	onEnd(): void {
		removeCommand(this.commissions.channel, 'pass');
		removeAnyCommand(this.commissions.channel);
	}

	updateReferenceMessage(player: GuildMember) {
		this.commissions.updateMessage({
			fields: [{
				name:'Selecting image to draw',
				value: `<@${player.id}> is selecting`
			}]
		});
	}
}


import { Round } from "./round";
import { addAnyCommand, addCommand, removeCommand, removeAnyCommand } from '../command';
import { GuildMember } from "discord.js";

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

			const attachment = message.attachments.first();

			/* could potentially put an actual image check here */
			if (!attachment)
				return void this.commissions.channel.send('Please attach an image!');

			this.commissions.referenceMessage = message;

			this.commissions.cycleCurrentPlayer();
			this.commissions.nextRound();
		});
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

	onPlayerLeave(member: GuildMember, index: number): void {
		if (this.commissions.playerIndex === index) {
			this.commissions.playerIndex = 0;
			this.updateReferenceMessage(this.commissions.players[this.commissions.playerIndex]);
		}
	}
}

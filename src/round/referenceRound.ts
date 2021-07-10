
import { Round } from "./round";
import { GuildMessage } from '../command';
import { GuildMember } from "discord.js";

export class ReferenceRound extends Round {
	constructor() {
		super([
			{
				keyword: 'pass',
				onMessage: message => {
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
				}
			},
			{
				keyword: 'skip',
				onMessage: message => {
					if (!this.commissions.isAdmin(message.member)) return;
			
					this.commissions.cycleCurrentPlayer();
					this.updateReferenceMessage(this.commissions.players[this.commissions.playerIndex]);
				}
			}
		])
	};

	onMessage(message: GuildMessage): void {
		if (!this.commissions.isCurrentPlayer(message.member)) return;

		const attachment = message.attachments.first();

		/* could potentially put an actual image check here */
		if (!attachment)
			return void this.commissions.channel.send('Please attach an image!');

		this.commissions.referenceMessage = message;

		this.commissions.cycleCurrentPlayer();
		this.commissions.nextRound();
	}

	originalIndex = 0;

	onStart(): void {
		this.originalIndex = this.commissions.playerIndex;
		this.updateReferenceMessage(this.commissions.players[this.originalIndex]);
	}

	onEnd(): void {}

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

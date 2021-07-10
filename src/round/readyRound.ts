import { Round } from './round'
import { setReact } from '../commissions/mainMessage';
import { removeReactAdd, removeReactRemove } from '../command';
import * as Discord from 'discord.js';

export class ReadyRound extends Round {
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

	numReady = 0;

	onStart(): void {
		/* get url of the reference message to re send */
		const referenceMessage = this.commissions.referenceMessage
		let url = '';

		if (referenceMessage) {
			const attachment = referenceMessage.attachments.first();
			if (attachment) {
				url = attachment.url;
			}
		}

		this.commissions.updateMessage({
			fields: [{
				name: 'Get ready to draw',
				value: 'React to this message when you\'re ready'
			}],
			image: url
		}).then(message => {
			setReact(message, '✅', (messageReact, user) => {
				if (this.commissions.filterReact(messageReact, user)) return;

				++this.numReady;

				/* everyone in ready */
				if (this.numReady === this.commissions.players.length) {
					this.commissions.nextRound();
				}

			}, () => {
				--this.numReady;
			});
		});
	}

	onEnd(): void {
		if (this.commissions.message) {
			removeReactAdd(this.commissions.message);
			removeReactRemove(this.commissions.message);
		}
	}

	onPlayerLeave(member: Discord.GuildMember, index: number): void {
		const message = this.commissions.message;
		if (!message) return;

		const reactions = message.reactions.cache;
		const reaction = reactions.first();
		if (!reaction) return;

		/* if the leaver has already reacted */
		if (reaction.users.cache.has(member.id)) {
			/* remove their reaction */
			reaction.users.remove(member);
			--this.numReady;
		}

		/* player removal means all remaining players are ready */
		if (this.numReady === this.commissions.players.length) {
			this.commissions.nextRound();
		}
	}
}

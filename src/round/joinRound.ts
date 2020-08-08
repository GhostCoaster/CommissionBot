
import { Round } from './round'
import { Commissions } from '../commissions/commissions';
import { RoundType } from './rounds';
import { updateMessage, setReact } from '../commissions/mainMessage';
import { removeReactAdd, removeReactRemove, addCommand, removeCommand } from '../command';
import * as Discord from 'discord.js';

export class JoinRound extends Round {
	onStart(): void {
		this.commissions.updateMessage({
			fields: [{
				name: 'Commissions about to begin',
				value: 'react to this message to join'
			}]
		}).then(message => {
			setReact(message, '☑️', (_, user) => {
				const member = this.commissions.getMember(user);
				if (member) this.commissions.playerJoin(member);
			}, (_, user) => {
				const member = this.commissions.getMember(user);
				if (member) this.commissions.playerLeave(member);
			});
		});

		addCommand(this.commissions.channel, 'start', message => {
			if (!message.member) return;
			if (!this.commissions.isAdmin(message.member)) return;

			if (this.commissions.players.length < 2)
				return void this.commissions.channel.send('Need at least two people to start a commissions!');

			this.commissions.nextRound();
		});
	}

	onEnd(): void {
		if (this.commissions.message) {
			removeReactAdd(this.commissions.message)
			removeReactRemove(this.commissions.message)
		}

		removeCommand(this.commissions.channel, 'start');
	}

	onPlayerLeave(member: Discord.GuildMember, index: number): void {
		/* remove the leaver's reaction */
		const message = this.commissions.message;
		if (!message) return;

		const reactions = message.reactions.cache;
		const reaction = reactions.first();

		if (!reaction) return;

		if (reaction.users.cache.has(member.id)) {
			reaction.users.remove(member);
		}
	}
}

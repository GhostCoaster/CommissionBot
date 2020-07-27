
import * as Discord from 'discord.js'
import { Round } from './round/round'
import { rounds, RoundIndex, createRound } from './round/rounds'
import { JoinRound } from './round/joinRound';
import * as RoleManager from './roleManager'

/**
 * represents a game of commissions happening
 */
export class Commissions {
	gameMaster: Discord.User;
	channel: Discord.TextChannel;
	guild: Discord.Guild;

	message: undefined | Discord.Message;

	players: Array<Discord.User>;

	currentRound: Round;

	constructor(gameMaster: Discord.User, channel: Discord.TextChannel) {
		this.gameMaster = gameMaster;
		this.channel = channel;
		this.guild = channel.guild;

		this.players = [this.gameMaster];
		this.currentRound = createRound(this, RoundIndex.JOIN);
		this.currentRound.onStart();
	}

	nextRound() {
		this.currentRound = createRound(this, this.currentRound.roundType.next);
		this.currentRound.onStart();
	}

	stop() {
		this.currentRound.onEnd();
	}

	playerJoin(user: Discord.User) {
		this.players.push(user);

		/* get member from user */
		this.guild.members.fetch({ user: user }).then(member => {
			member.roles.add(RoleManager.getRole());
		}).catch(() => {
			console.log('could not find user in guild??');
		});
	}

	playerLeave(user: Discord.User) {
		let index = this.players.indexOf(user);
		if (index === -1) return;

		this.players.splice(index, 1);

		/* get member from user */
		this.guild.members.fetch({ user: user }).then(member => {
			member.roles.remove(RoleManager.getRole());
		}).catch(() => {
			console.log('could not find user in guild??');
		});
	}
}
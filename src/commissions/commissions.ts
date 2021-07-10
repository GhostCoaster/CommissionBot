
import * as Discord from 'discord.js'
import { Round } from '../round/round'
import * as fs from 'fs'
import { removeCommissions, findCommissions } from './commissionsList';
import * as MainMessage from './mainMessage';
import { Submission } from './submission';
import { CommandDefinition } from '../command';
import { isAdmin, timeString } from '../util';
import * as https from 'https';
import { createRound, RoundIndex } from '../round/rounds';

interface MemberReturn {
	member: Discord.GuildMember;
	index: number;
};

/**
 * represents a game of commissions happening
 */
export class Commissions {
	gameMaster: Discord.GuildMember;
	channel: Discord.TextChannel;
	guild: Discord.Guild;

	message: undefined | Discord.Message;
	referenceMessage: undefined | Discord.Message;
	
	players: Discord.GuildMember[];
	playerIndex: number;

	currentRound: Round;
	drawTime: number;

	submittedDrawings: (Submission | undefined)[];
	ranked: boolean;

	commands: CommandDefinition[] = [
		{
			keyword: 'kick',
			onMessage: message => {
				if (!this.isAdmin(message.member)) return;

				const mentions = message.mentions.members;
				if (!mentions || mentions.size !== 1) return void message.channel.send('mention 1 player');
	
				const player = mentions.first();
				if (!player) return;
	
				const playerIndex = this.players.indexOf(player);
				if (playerIndex === -1) return void message.channel.send(`<@${player.id}> is not playing`);
	
				this.playerLeave(player, playerIndex);
	
				message.channel.send(`<@${player.id}> removed from this commissions`);
			}
		},
		{
			keyword: 'list',
			onMessage: message => {
				let str = '```\n'

				this.players.forEach(player => {
					str += `${player.displayName}\n`
				});
	
				message.channel.send(`${str}\`\`\``);
			}
		},
		{
			keyword: 'time',
			onMessage: message => {
				let parts = message.content.split(' ');
				if (parts.length < 2) return void message.channel.send('Need a parameter');

				let totalTime = 0;

				for (let p = 1; p < parts.length; ++p) {
					let timePart = parts[p];
					let lastIndex = 0;

					for (let i = 0; i < timePart.length; ++i) {
						if (timePart.charAt(i) === 's') {
							let numberStr = timePart.substr(lastIndex, i - lastIndex);
							totalTime += +numberStr;

							lastIndex = i + 1;
						} else if (timePart.charAt(i) === 'm') {
							let numberStr = timePart.substr(lastIndex, i - lastIndex);
							totalTime += (+numberStr * 60);

							lastIndex = i + 1;
						}
					}
				}

				totalTime = Math.floor(totalTime);

				if (isNaN(totalTime)) return void message.channel.send('Incorrect number format\nTry for example: `5m30s` (5 minutes 30 seconds)');
				if (totalTime < 1) return void message.channel.send('Time needs to be at least 1 second');
				
				this.drawTime = totalTime;
			
				message.channel.send(`Commissions draw time set to ${timeString(totalTime)}`);
			}
		}
	];

	constructor(gameMaster: Discord.GuildMember, channel: Discord.TextChannel, ranked: boolean) {
		this.gameMaster = gameMaster;
		this.channel = channel;
		this.guild = channel.guild;

		this.players = [];
		this.submittedDrawings = [];
		this.playerIndex = 0;

		this.drawTime = 5 * 60;

		this.message = undefined;
		
		this.ranked = ranked;

		this.currentRound = createRound(this, RoundIndex.JOIN);
	}

	nextRound() {
		this.currentRound.onEnd();
		this.currentRound = createRound(this, this.currentRound.roundType.next);
	}

	stop() {
		/* handle internal resetting */
		this.currentRound.onEnd();

		/* handle global commissions removal */
		let thisIndex = findCommissions(this.channel);
		if (thisIndex !== -1) removeCommissions(thisIndex);
	}

	playerJoin(member: Discord.GuildMember) {
		this.players.push(member);
		this.submittedDrawings.push(undefined);
	}

	playerLeave(member: Discord.GuildMember, index?: number) {
		if (!index || index === -1) {
			index = this.players.indexOf(member);
			if (index === -1) return;
		}

		/* custom leaving before actually removing from array */
		this.currentRound.onPlayerLeave(member, index);

		this.players.splice(index, 1);
		this.submittedDrawings.splice(index, 1);

		/* put the current player back in good range */
		this.playerIndex %= this.players.length;

		/* attempt to close this game if not enough people remain */
		if (this.currentRound.roundType.id !== RoundIndex.JOIN) {
			if (this.players.length < 2) {
				this.stop();
				this.channel.send('Not enough players to keep going, commissions stopped!');
			}
		}
	}

	/**
	 * call this instead of updateMessage() in mainMessage.ts
	 * this manages the internal commissions message automatically
	 * 
	 * has no catch because this should never reasonably fail
	 * and if it does we have no system to recover it
	 */
	updateMessage(options: MainMessage.EmbedOptions) {
		return new Promise<Discord.Message>(accept => {
			MainMessage.updateMessage(options, this.channel, this.message).then(message => {
				this.message = message;
				accept(message);
			}).catch(err => console.log('something went wrong: ' + err));
		});
	}

	/**
	 * call this instead of editMessage() in mainMessage.ts
	 */
	editMessage(options: MainMessage.EmbedOptions) {
		return new Promise<Discord.Message>((accept, reject) => {
			if (!this.message) return void reject('message does not exist');

			MainMessage.editMessage(options, this.message)
				.then(message => accept(message))
				.catch(err => console.log('$omething went wrong: ' + err));
		});
	}

	/* UTIL */
	
	getMember(user: Discord.User) {
		return this.guild.members.cache.find(member => member.user === user);
	}

	isCurrentPlayer(member: Discord.GuildMember) {
		return member === this.players[this.playerIndex];
	}

	cycleCurrentPlayer() {
		this.playerIndex = (this.playerIndex + 1) % this.players.length;
	}

	isAdmin(member: Discord.GuildMember) {
		return member === this.gameMaster || isAdmin(member);
	}

	isPlayer(user: Discord.GuildMember | Discord.User) {
		const id = user.id;

		return !this.players.every(player => {
			player.id !== id;
		});
	}

	shouldDiscard(message: Discord.Message): boolean {
		if (message.member === null) return true;
		if (message.member.user.bot) return false;
		if (message.member === this.gameMaster) return false;
		
		return !this.players.includes(message.member);
	}

	/**
	 * returns whether this reaction should be discarded
	 * return from original function if true
	 * 
	 * @param messsageReaction 
	 */
	filterReact(messsageReact: Discord.MessageReaction, user: Discord.User, selfProhibit: boolean = false): boolean {
		if (!this.isPlayer(user) || (selfProhibit && messsageReact.message.author === user)) {
			messsageReact.users.remove(user);
			return true;
		}

		return false;
	}
}

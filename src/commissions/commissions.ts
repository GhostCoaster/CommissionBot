
import * as Discord from 'discord.js'
import { Round } from '../round/round'
import { rounds, RoundIndex, createRound } from '../round/rounds'
import { JoinRound } from '../round/joinRound';
import * as fs from 'fs'
import * as https from 'https'
import { cpus } from 'os';
import { removeCommissions, findCommissions } from './commissionsList';
import * as MainMessage from './mainMessage';
import { Submission } from './submission';
import { addCommand, removeCommand } from '../command';
import { isAdmin } from '../util';

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
	
	players: Array<Discord.GuildMember>;
	playerIndex: number;

	currentRound: Round;
	drawTime: number;

	submittedDrawings: Array<Submission | undefined>;
	ranked: boolean;

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

		addCommand(this.channel, 'kick', message => {
			if (!this.isAdmin(message.member)) return;

			const mentions = message.mentions.members;
			if (!mentions || mentions.size !== 1) return void message.channel.send('mention 1 player');

			const player = mentions.first();
			if (!player) return;

			const playerIndex = this.players.indexOf(player);
			if (playerIndex === -1) return void message.channel.send(`<@${player.id}> is not playing`);

			this.playerLeave(player, playerIndex);

			message.channel.send(`<@${player.id}> removed from this commissions`);
		});

		addCommand(this.channel, 'list', message => {
			let str = '```\n'

			this.players.forEach(player => {
				str += `${player.displayName}\n`
			});

			message.channel.send(`${str}\`\`\``);
		});

		this.currentRound = createRound(this, RoundIndex.JOIN);
		this.currentRound.onStart();
	}

	nextRound() {
		this.currentRound.onEnd();

		this.currentRound = createRound(this, this.currentRound.roundType.next);
		this.currentRound.onStart();
	}

	stop() {
		/* handle internal resetting */
		this.currentRound.onEnd();

		removeCommand(this.channel, 'kick');
		removeCommand(this.channel, 'list');

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
		++this.playerIndex;
		this.playerIndex %= this.players.length;
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

	/* unfinished */
	getAttachmentImage(attachment: Discord.MessageAttachment) {
		return new Promise<Buffer>((accept, reject) => {
			const options = {
				port: 80,
				path: attachment.url,
				method: 'GET'
			};

			let request = https.request(options, res => {
				res.on('data', data => {
					accept(data);
				});
			})

			request.on('error', err => {
				reject(err);
			});

			request.end();
		});
	}

	/* unfinished */
	saveImage(name: string, data: Buffer) {
		if (!fs.existsSync('./data')) {
			fs.mkdirSync('./data');
		}

		fs.writeFileSync(`./data/${name}`, data);
	}
}

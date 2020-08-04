
import * as Discord from 'discord.js'
import { Round } from '../round/round'
import { rounds, RoundIndex, createRound } from '../round/rounds'
import { JoinRound } from '../round/joinRound';
import * as RoleManager from '../roleManager'
import * as fs from 'fs'
import * as https from 'https'
import { cpus } from 'os';
import { removeCommissions, findCommissions } from './commissionsList';
import * as MainMessage from './mainMessage';
import { Submission } from './submission';

/**
 * represents a game of commissions happening
 */
export class Commissions {
	gameMaster: Discord.User;
	channel: Discord.TextChannel;
	guild: Discord.Guild;

	message: undefined | Discord.Message;

	players: Array<Discord.User>;
	playerIndex: number;

	currentRound: Round;
	drawTime: number;

	submittedDrawings: Array<Submission | undefined>;
	
	constructor(gameMaster: Discord.User, channel: Discord.TextChannel) {
		this.gameMaster = gameMaster;
		this.channel = channel;
		this.guild = channel.guild;

		this.players = [];
		this.submittedDrawings = [];
		this.playerIndex = 0;

		this.drawTime = 5 * 60;

		this.message = undefined;
		
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

		/* un-role all players */
		while (this.players.length > 0) {
			this.playerLeave(this.players[0]);
		}

		/* handle global commissions removal */
		let thisIndex = findCommissions(this.channel);
		if (thisIndex !== -1) removeCommissions(thisIndex);
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

	isCurrentPlayer(user: Discord.User) {
		return user === this.players[this.playerIndex]
	}

	cycleCurrentPlayer() {
		++this.playerIndex;
		this.playerIndex %= this.players.length;
	}

	isGameMaster(user: Discord.User) {
		return user === this.gameMaster;
	}

	isPlayer(user: Discord.User) {
		return !this.players.every(player => {
			player !== user;
		});
	}

	shouldDiscard(message: Discord.Message): boolean {
		if (message.member === null) return true;

		if (message.author === this.gameMaster) return false;
		
		if (!message.member.roles.cache.has(RoleManager.getRole().id)) {
			return true;
		}

		return false;
	}

	/**
	 * returns whether this reaction should be discarded
	 * return from original function if true
	 * 
	 * @param messsageReaction 
	 */
	filterReact(messsageReact: Discord.MessageReaction, user: Discord.User): boolean {
		if (!this.isPlayer(user)) {
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

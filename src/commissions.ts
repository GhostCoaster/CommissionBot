
import * as Discord from 'discord.js'
import { Round } from './round/round'
import { rounds, RoundIndex, createRound } from './round/rounds'
import { JoinRound } from './round/joinRound';
import * as RoleManager from './roleManager'
import * as fs from 'fs'
import * as https from 'https'
import { cpus } from 'os';
import { removeCommissions, findCommissions } from './commissionsList';

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

	submittedDrawings: Array<Discord.Message | undefined>;

	constructor(gameMaster: Discord.User, channel: Discord.TextChannel) {
		this.gameMaster = gameMaster;
		this.channel = channel;
		this.guild = channel.guild;

		this.players = [];
		this.submittedDrawings = [];
		this.playerIndex = 0;

		this.drawTime = 5 * 60;

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
		let thisIndex = findCommissions(this.guild);
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

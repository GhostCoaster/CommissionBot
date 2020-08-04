import * as Discord from 'discord.js'
import * as Login from './login'
import * as Commmand from './command'
import * as CommissionsList from './commissions/commissionsList'
import * as RoleManager from './roleManager'
import { Commissions } from './commissions/commissions'
import { brotliCompressSync } from 'zlib';
import * as Util from './util';
import { userInfo } from 'os';
import * as MainMessage from './commissions/mainMessage';

let data = require('../data.json');

const bot = new Discord.Client();

bot.on('ready', () => {
	console.log('commissions bot online');
	
	/* setup roles in all guilds */
	bot.guilds.cache.forEach(guild => {
		RoleManager.init(guild);
		RoleManager.purge(guild);
	});

	MainMessage.init();
});

Commmand.addGlobalCommand('commiss', message => {
	/* only admins can start it */
	if (!message.member) return;
	if (!Util.isAdmin(message.member)) return;
	
	let errMessage = CommissionsList.addCommissions(message.author, message.channel);
	if (errMessage) message.channel.send(errMessage);
});

Commmand.addGlobalCommand('stop', message => {
	if (message.guild === null) return;
	if (message.channel.type !== 'text') return;

	let index = CommissionsList.findCommissions(message.channel);
	if (index === -1) return void message.channel.send('No commissions going on in this channel!');

	/* only the game master can stop it */
	let commissions = CommissionsList.activeCommissions[index];
	if (!commissions.isGameMaster(message.author)) return;

	CommissionsList.activeCommissions[index].stop();

	message.channel.send('Commiss stopped!');
});

Commmand.addGlobalCommand('time', message => {
	if (message.guild === null) return;
	if (message.channel.type !== 'text') return;

	let index = CommissionsList.findCommissions(message.channel);
	if (index === -1) return void message.channel.send('No commissions going on in this channel!');
	let commissions = CommissionsList.activeCommissions[index];

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

	if (isNaN(totalTime)) return void message.channel.send('Incorrect number format');
	if (totalTime < 1) return void message.channel.send('Time needs to be at least 1 second');
	
	commissions.drawTime = totalTime;

	message.channel.send(`Commissions draw time set to ${Util.timeString(totalTime)}`);
});

bot.on('message', message => {
	Commmand.handleCommand(bot, message);

	if (bot.user === null) return;
	if (message.author.id === bot.user.id) return;
	if (message.guild === null) return;
	if (message.channel.type !== 'text') return;

	const index = CommissionsList.findCommissions(message.channel);
	if (index === -1) return;

	if (CommissionsList.activeCommissions[index].shouldDiscard(message))
		message.delete();
});

bot.on('messageReactionAdd', (messageReaction, user) => {
	Commmand.handleReactAdd(bot, messageReaction, user);
});

bot.on('messageReactionRemove', (messageReaction, user) => {
	Commmand.handleReactRemove(bot, messageReaction, user);
});

Login.getToken().then(token => {
	bot.login(token);
}).catch(() => {
	console.log('could not find token locally');
});

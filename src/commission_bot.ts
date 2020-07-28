
import * as Discord from 'discord.js'
import * as Login from './login'
import * as Commmand from './command'
import * as CommissionsList from './commissionsList'
import * as RoleManager from './roleManager'
import { Commissions } from './commissions'
import { brotliCompressSync } from 'zlib';
import * as Util from './util';

const bot = new Discord.Client();
const activeCommissions = Array<Commissions>();

bot.on('ready', () => {
	console.log('commissions bot online');
	
	/* setup roles in all guilds */
	bot.guilds.cache.forEach(guild => {
		RoleManager.init(guild);
	});
});

Commmand.addCommand('commiss', message => {
	/* only admins can start it */
	if (!message.member) return;
	if (!Util.isAdmin(message.member)) return;
	
	let errMessage = CommissionsList.addCommissions(message.author, message.channel);
	if (errMessage) message.channel.send(errMessage);
});

Commmand.addCommand('stop', message => {
	if (message.guild === null) return;

	let index = CommissionsList.findCommissions(message.guild);
	if (index === -1) return message.channel.send('No commissions going on in this server!');

	/* only the game master can stop it */
	let commissions = CommissionsList.activeCommissions[index];
	if (!commissions.isGameMaster(message.author)) return;

	CommissionsList.activeCommissions[index].stop();

	message.channel.send('Commiss stopped!');
});

bot.on('message', message => {
	Commmand.handleCommand(bot, message);
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

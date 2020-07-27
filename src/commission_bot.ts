
import * as Discord from 'discord.js'
import * as Login from './login'
import * as Commmand from './command'
import * as CommissionsList from './commissionsList'
import { Commissions } from './commissions'

const bot = new Discord.Client();
const activeCommissions = Array<Commissions>();

bot.on('ready', () => {
	console.log('commissions bot online')
});

Commmand.addCommand('start', message => {
	let errMessage = CommissionsList.addCommissions(message.author, message.channel);
	if (errMessage) message.channel.send(errMessage)
});

Commmand.addCommand('stop', message => {
	let errMessage = CommissionsList.removeCommissions(message.channel);
	if (errMessage) message.channel.send(errMessage)
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

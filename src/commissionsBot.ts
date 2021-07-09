
import * as Discord from 'discord.js'
import * as Login from './login'
import * as Commmand from './command'
import * as CommissionsList from './commissions/commissionsList'
import * as RoleManager from './role/roleManager'
import * as Util from './util';
import * as MainMessage from './commissions/mainMessage';
import * as Scores from './scores';

const bot = new Discord.Client();

bot.on('ready', () => {
	console.log('commissions bot online');
	
	Scores.init();

	Promise.all([
		RoleManager.loadHosterRoles(bot),
		Promise.resolve(MainMessage.init())
	]).then(() => {
		console.log('setup complete!');

	}).catch(err => {
		console.error('setup failed!');
		console.error(err);
	});
});

Commmand.addGlobalCommand('commiss', message => {
	/* only admins can start it */
	if (!Util.isAdmin(message.member)) return;
	
	let errMessage = CommissionsList.addCommissions(message.member, message.channel, true);
	if (errMessage) message.channel.send(errMessage);
});

Commmand.addGlobalCommand('casual', message => {
	/* only admins can start it */
	if (!Util.isAdmin(message.member)) return;
	
	let errMessage = CommissionsList.addCommissions(message.member, message.channel, false);
	if (errMessage) message.channel.send(errMessage);
});

Commmand.addGlobalCommand('stop', message => {
	let index = CommissionsList.findCommissions(message.channel);
	if (index === -1) return void message.channel.send('No commissions going on in this channel!');

	/* only the game master can stop it */
	let commissions = CommissionsList.activeCommissions[index];

	if (!commissions.isAdmin(message.member)) return;

	CommissionsList.activeCommissions[index].stop();

	message.channel.send('Commiss stopped!');
});

Commmand.addGlobalCommand('time', message => {
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

Commmand.addGlobalCommand('score', message => {
	const mentions = message.mentions;

	/* when you just want to see your own score */
	if (mentions.users.size === 0) {
		const id = message.author.id;
		const score = Scores.getScore(id);

		message.channel.send(`<@${id}>, your commissions score is ${score}`);

	/* seeing someone else's score */
	} else {
		const user = mentions.users.first();
		if (!user) return;

		const id = user.id;
		const score = Scores.getScore(id);

		message.channel.send(`<@${id}>'s commissions score is ${score}`);
	}
});

Commmand.addGlobalCommand('setHosterRole', message => {
	if (!Util.isAdmin(message.member)) return;

	const roles = message.mentions.roles;
	const role = roles.first();
	if (!role || roles.size != 1) return message.channel.send('Please mention 1 role');

	RoleManager.assignHosterRole(message.guild.id, role.id).then(() => {
		message.channel.send(`<@&${role.id}> set to hoster role`);
	}).catch(err => {
		message.channel.send(`Something went wrong: ${err}`);
	});
});

Commmand.addGlobalCommand('help', message => {
	message.channel.send(`
\`\`\`Commands\`\`\`
**commiss** - Prepare a commissions with scoring
**casual** - Prepare a commissions without scoring
**start** - Start the commissions after people have joined
**stop** - Stop a commissions
**time [time]** - Set the drawing time for this commissions *(format: 5m2s = 5 minutes 2 seconds)*
**score** - Displays your own score
**score [@user]** - Displays the score for this user
**setHosterRole [@role]** - Sets the special hoster role for this server
**force** - Move on to the next round immediately
**skip** - Prevent a player from submitting
**pass** - Let the next player submit an image
**list** - Get everyone playing in this commissions
**kick** - Remove a player from this commissions
	`);
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

bot.on('messageDelete', (message) => {
	Commmand.handleMessageDelete(message);
});

Login.getToken().then(token => {
	bot.login(token);
}).catch(() => {
	console.log('could not find token locally');
});

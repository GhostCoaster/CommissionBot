
import { Commissions } from './commissions'
import * as Discord from 'discord.js'

const activeCommissions = Array<Commissions>();

/**
 * @returns a string if there was an error adding this commissions
 */
export let addCommissions = (user: Discord.User, channel: Discord.TextChannel | Discord.DMChannel | Discord.NewsChannel): string | undefined => {
	if (channel.type !== 'text') return 'Can\'t make a commissions in this channel!';
	let guild = channel.guild;

	let available = activeCommissions.every(commissions => {
		return commissions.guild !== guild;
	});

	if (available) {
		activeCommissions.push(new Commissions(user, channel));

		return undefined;
	} else {
		return 'A commissions is already happening in this server!';
	}
}

/**
 * @returns a string if a commissions couldn't be removed
 */
export let removeCommissions = (channel: Discord.TextChannel | Discord.DMChannel | Discord.NewsChannel): string | undefined => {
	if (channel.type !== 'text') return 'What the hell is this channel!';
	let guild = channel.guild;

	let index = activeCommissions.findIndex(Commissions => {
		return Commissions.guild === guild;
	});

	if (index === -1) {
		return 'No commissions going on in this server!';	
	} else {
		activeCommissions[index].stop();
		activeCommissions.splice(index, 1);

		return undefined;
	}
}

export let getCommissions = (guild: Discord.Guild): Commissions | undefined => {
	return activeCommissions.find(commissions => {
		return guild === commissions.guild;
	});
}

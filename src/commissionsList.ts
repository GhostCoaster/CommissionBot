
import { Commissions } from './commissions'
import * as Discord from 'discord.js'

export const activeCommissions = Array<Commissions>();

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

export let findCommissions = (guild: Discord.Guild): number => {
	let index = activeCommissions.findIndex(Commissions => {
		return Commissions.guild === guild;
	});

	return index;
}

export let removeCommissions = (index: number) => {
	activeCommissions.splice(index, 1);
}

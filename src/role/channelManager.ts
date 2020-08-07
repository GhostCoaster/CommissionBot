import { TextChannel, RoleManager, Channel } from "discord.js";
import { getRole, Roles } from "./roleManager";

export const manageChannel = (channel: TextChannel) => {
	return new Promise((accept, reject) => {
		const commissionerRole = getRole(channel.guild, Roles.COMMISSIONER);
		const hosterRole = getRole(channel.guild, Roles.HOSTER);

		if (!commissionerRole || !hosterRole) return void console.log(`roles missing on server ${channel.guild.name}`);

		channel.overwritePermissions([{
			id: channel.guild.roles.everyone,
			deny: ['SEND_MESSAGES', 'ADD_REACTIONS', 'ATTACH_FILES', 'USE_EXTERNAL_EMOJIS']
		}, {
			id: commissionerRole,
			allow: ['SEND_MESSAGES', 'ATTACH_FILES']
		}, {
			id: hosterRole,
			allow: ['SEND_MESSAGES', 'ATTACH_FILES']
		}], 'Commissions bot managing channel').then(accept).catch(err => reject(err));
	});
}

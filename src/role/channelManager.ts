import { TextChannel, RoleManager, Channel, OverwriteResolvable, Guild } from "discord.js";
import { getRole, Roles, getCustomRole } from "./roleManager";

export const manageChannel = (channel: TextChannel) => {
	return new Promise((accept, reject) => {
		const commissionerRole = getRole(channel.guild, Roles.COMMISSIONER);
		const hosterRole = getRole(channel.guild, Roles.HOSTER);

		if (!commissionerRole || !hosterRole) return void console.log(`roles missing on server ${channel.guild.name}`);

		const roleOverwrites = [{
			id: commissionerRole,
			allow: ['SEND_MESSAGES', 'ATTACH_FILES']
		}, {
			id: hosterRole,
			allow: ['SEND_MESSAGES', 'ATTACH_FILES']
		}] as OverwriteResolvable[];

		const customRole = getCustomRole(channel.guild);

		if (customRole) {
			/* only custom roles can see the channel */
			roleOverwrites.push({
				id: customRole,
				allow: ['READ_MESSAGE_HISTORY', 'VIEW_CHANNEL']
			});

			/* everyone can't */
			roleOverwrites.push({
				id: channel.guild.roles.everyone,
				deny: ['SEND_MESSAGES', 'ADD_REACTIONS', 'ATTACH_FILES', 'USE_EXTERNAL_EMOJIS', 'READ_MESSAGE_HISTORY', 'VIEW_CHANNEL']
			});
		} else {
			roleOverwrites.push({
				id: channel.guild.roles.everyone,
				deny: ['SEND_MESSAGES', 'ADD_REACTIONS', 'ATTACH_FILES', 'USE_EXTERNAL_EMOJIS']
			});
		}

		channel.overwritePermissions(roleOverwrites, 'Commissions bot managing channel').then(accept).catch(err => reject(err));
	});
}

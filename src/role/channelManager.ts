import { TextChannel, RoleManager, Channel } from "discord.js";
import { getRole, Roles } from "./roleManager";

export const manageChannel = (channel: TextChannel) => {
	return new Promise((accept, reject) => {
		channel.overwritePermissions([{
			id: channel.guild.roles.everyone,
			deny: ['SEND_MESSAGES', 'ADD_REACTIONS', 'ATTACH_FILES', 'USE_EXTERNAL_EMOJIS']
		}, {
			id: getRole(Roles.COMMISSIONER),
			allow: ['SEND_MESSAGES', 'ATTACH_FILES']
		}, {
			id: getRole(Roles.HOSTER),
			allow: ['SEND_MESSAGES', 'ATTACH_FILES']
		}], 'Commissions bot managing channel').then(accept).catch(err => reject(err));
	});
}

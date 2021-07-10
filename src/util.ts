import * as discord from "discord.js";
import { getHosterRoleId } from "./role/roleManager";

export const isAdmin = (member: discord.GuildMember) => {
	if (member.permissions.has(0x8)) return true;

	const hosterRole = getHosterRoleId(member.guild.id);
	if (!hosterRole) return false;

	return member.roles.cache.has(hosterRole);
}

export const sleep = (millis: number) =>
	new Promise(accept => {
		setTimeout(accept, millis);
	});

export const timeString = (time: number) => {
	const minutes = Math.floor(time / 60);
	const seconds = time % 60;

	const minutesPart = (minutes == 0) ? '' :
		`${minutes} minute${minutes == 1 ? '' : 's'}`;

	const secondsPart = (seconds == 0) ? '' :
		`${seconds} second${seconds == 1 ? '' : 's'}`;

	return `${minutesPart}${minutes == 0 ? '' : ' '}${secondsPart}`;
}

export const timeDescription = (secondsLeft: number) => {
	const description = secondsLeft === -1 ? `Time left: ${timeString(secondsLeft)}` : 'Complete';

	return `\`\`\`markdown\n${description}\n${'-'.repeat(description.length)}\`\`\``;
}

export const deleteNotBot = (message: discord.Message) => {
	if (!message.author.bot) message.delete();
}

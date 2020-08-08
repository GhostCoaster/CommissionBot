import * as discord from "discord.js";
import { getRole, Roles } from "./role/roleManager";

export let isAdmin = (member: discord.GuildMember) => {
	const guild = member.guild;
	const role = getRole(guild, Roles.HOSTER);

	return (role && member.roles.cache.has(role.id)) || member.permissions.has(0x8);
}

export let sleep = (millis: number) =>{
	return new Promise((accept) => {
		setTimeout(accept, millis);
	});
}

export let timeString = (time: number) => {
	let minutes = Math.floor(time / 60);
	let seconds = time % 60;

	var minutesPart = (minutes == 0) ? '' :
		`${minutes} minute${minutes == 1 ? '' : 's'}`;

	var secondsPart = (seconds == 0) ? '' :
		`${seconds} second${seconds == 1 ? '' : 's'}`;

	return `${minutesPart}${minutes == 0 ? '' : ' '}${secondsPart}`;
}

export let timeDescription = (secondsLeft: number) => {
	let description = `Time left: ${timeString(secondsLeft)}`;

	return `\`\`\`markdown\n${description}\n${'-'.repeat(description.length)}\`\`\``;
}

export let favoredName = (member: discord.GuildMember) => {
	return member.nickname ? member.nickname : member.user.username;
}

import * as discord from "discord.js";

export let isAdmin = (member: discord.GuildMember) => {
	return member.permissions.has(0x8);
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

	return `${minutesPart} ${secondsPart}`;
}

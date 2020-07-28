import * as discord from "discord.js";

export let isAdmin = (member: discord.GuildMember) => {
	return member.permissions.has(0x8);
}


import * as Discord from "discord.js";
import { access } from "fs";

const ROLE_NAME = 'commiޤޤioner';
let internalRole = undefined as Discord.Role | undefined;

export let init = (guild: Discord.Guild) => {
	return new Promise<Discord.Role>((accept, reject) => {
		let foundRole = guild.roles.cache.find((role, key, collection) => {
			console.log(`checking role ${role.name} against ${ROLE_NAME}`);
			return role.name === ROLE_NAME;
		});
	
		if (foundRole) {
			foundRole.delete('cleaning up internal roles').then(() => {
				createRole(guild).then(created => {
					internalRole = created;
				}).catch(reject);
			}).catch(reject);

		} else {
			createRole(guild).then(created => {
				internalRole = created;
			}).catch(reject);
		}
	});
}

let createRole = (guild: Discord.Guild) => {
	return new Promise<Discord.Role>((accept, reject) => {
		guild.roles.create({
			data: {
				color: 0x773ac7,
				hoist: false,
				mentionable: false,
				position: 0,
				name: ROLE_NAME,
				permissions: 0
			},
			reason: 'commissions bot needs this role'
		}).then(role => accept(role)).catch(reject);
	});
}

export let getRole = () => {
	return internalRole as Discord.Role
}

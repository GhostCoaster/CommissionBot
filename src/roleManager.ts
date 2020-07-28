
import * as Discord from "discord.js";
import { access } from "fs";
import { totalmem } from "os";

const ROLE_NAME = 'commiޤޤioner';
let internalRole = undefined as Discord.Role | undefined;

export let init = (guild: Discord.Guild) => {
	return new Promise<Discord.Role>((accept, reject) => {
		let foundRole = guild.roles.cache.find((role, key, collection) => {
			console.log(`checking role ${role.name} against ${ROLE_NAME}`);
			return role.name === ROLE_NAME;
		});
	
		if (foundRole) {
			if (checkRole(foundRole)) {
				console.log('all good!');
				internalRole = foundRole;
				accept(foundRole);

			} else {
				foundRole.delete('cleaning up internal roles').then(() => {
					createRole(guild).then(created => {
						internalRole = created;
						accept(created);

					}).catch(reject);
				}).catch(reject);
			}

		} else {
			createRole(guild).then(created => {
				internalRole = created;
				accept(created);

			}).catch(reject);
		}
	});
}

let checkRole = (role: Discord.Role) => {
	return role.color === 0x773ac7 &&
		role.hoist === false &&
		role.mentionable === false &&
		role.name === ROLE_NAME &&
		!role.permissions.any(0x7FFFFFFF, true);
}

let createRole = (guild: Discord.Guild) => {
	return new Promise<Discord.Role>((accept, reject) => {
		guild.roles.create({
			data: {
				color: 0x773ac7,
				hoist: false,
				mentionable: false,
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

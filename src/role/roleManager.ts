
import * as Discord from "discord.js";
import * as fs from 'fs';
import { isArray } from "util";

interface RoleTemplate {
	color: number;
	name: string;
};

const customRolesFile = './customRoles.json';

const roleTemplates = [
	{ color: 0x773ac7, name: 'commiޤޤioner' },
	{ color: 0x2647f1, name: 'ԨՕՏԎҼЯ' }
] as RoleTemplate[];

const roleImplementations = new Map<string, Discord.Role[]>();
const customRoles = new Map<string, Discord.Role>();

export enum Roles {
	COMMISSIONER,
	HOSTER
};

export let init = (guild: Discord.Guild) => {
	return new Promise((accept, reject) => {
		const roleArray = [] as Discord.Role[];

		/* only exit the function when all roles have been found */
		const acceptor = () => {
			if (roleArray.length === roleTemplates.length) {

				/* finally store the roleArray associated with this guild */
				roleImplementations.set(guild.id, roleArray);

				accept();
			}
		};
	
		roleTemplates.forEach(roleTemplate => {
			/* see if role has been created by this bot before on this server */
			const foundRole = guild.roles.cache.find((role, key, collection) => {
				return role.name === roleTemplate.name;
			});
	
			if (foundRole) {
				if (checkRole(foundRole, roleTemplate)) {
					roleArray.push(foundRole);

					acceptor();

				} else {
					foundRole.delete('cleaning up internal roles').catch(err => reject(err));
	
					createRole(guild, roleTemplate).then(created => {
						roleArray.push(created);

						acceptor();

					}).catch(err => reject(err));
				}
	
			} else {
				createRole(guild, roleTemplate).then(created => {
					roleArray.push(created);
	
					acceptor();

				}).catch(err => reject(err));
			}
		});
	});
}

const checkRole = (role: Discord.Role, roleTemplate: RoleTemplate) => {
	return role.color === roleTemplate.color &&
		role.hoist === false &&
		role.mentionable === false &&
		role.name === roleTemplate.name &&
		!role.permissions.any(0x7FFFFFFF, true);
}

const createRole = (guild: Discord.Guild, roleTemplate: RoleTemplate) => {
	return new Promise<Discord.Role>((accept, reject) => {
		guild.roles.create({
			data: {
				color: roleTemplate.color,
				hoist: false,
				mentionable: false,
				name: roleTemplate.name,
				permissions: 0
			},
			reason: 'commissions bot needs this role'
		}).then(role => accept(role)).catch(reject);
	});
}

/* custom role managemenmt */

interface CustomRoleStorage {
	guildID: string,
	roleID: string
};

export const initCustomRoles = (bot: Discord.Client) => {
	return new Promise((accept, reject) => {
		if (!fs.existsSync(customRolesFile)) {
			/* we have no custom roles stored so make a storage file */
			fs.writeFile(customRolesFile, '', err => {
				if (err) reject(err); else accept();
			});
		} else {
			/* we have a storage file so read from it */
			fs.readFile(customRolesFile, (err, data) => {
				if (err) return void reject(err);

				const storage = JSON.parse(data.toString()) as CustomRoleStorage[];
				/* just ignore incorrectly formatted data */
				if (!isArray(storage)) return void accept();

				storage.forEach(roleStorage => {
					const guildID = roleStorage.guildID;

					const guild = bot.guilds.cache.get(guildID);
					if (!guild) return; /* skip this guild, doesn't exist anymore */

					const role = guild.roles.cache.get(roleStorage.roleID);
					if (!role) return; /* likewise this role */

					customRoles.set(guildID, role);
				});

				accept();
			});
		}
	});
}

const saveCustomRoles = () => {
	return new Promise((accept, reject) => {
		/* need to convert the map to an array for saving */
		const saveArr = [] as CustomRoleStorage[];

		const keys = customRoles.keys();
		const values = customRoles.values();
		let key = { done: false, value: '' } as IteratorResult<string>;

		while (!(key = keys.next()).done) {
			saveArr.push({ guildID: key.value, roleID: values.next().value.id });
		}

		fs.writeFile(customRolesFile, JSON.stringify(saveArr), err => {
			if (err) reject(err); else accept();
		});
	});
}

export const addCustomRole = (guild: Discord.Guild, role: Discord.Role) => {
	return new Promise((accept, reject) => {
		customRoles.set(guild.id, role);

		saveCustomRoles().then(accept).catch(err => reject(err));
	});
}

/* role getters */

export const getRole = (guild: Discord.Guild | undefined | null, roleType: Roles) => {
	if (!guild) return;
	
	const roleArray = roleImplementations.get(guild.id);
	if (!roleArray) return;

	return roleArray[roleType];
}

export const getCustomRole = (guild: Discord.Guild | undefined | null) => {
	if (!guild) return;

	return customRoles.get(guild.id);	
}

/**
 * cleans up any residual commissioner roles
 * from a pervious session
 * 
 * should only be called on startup
 * 
 * call per guild
 */
export let purge = (guild: Discord.Guild) => {
	guild.members.cache.forEach(member => {
		const role = getRole(guild, Roles.COMMISSIONER);
		if (!role) return;

		if (member.roles.cache.has(role.id))
			member.roles.remove(role);
	});
}

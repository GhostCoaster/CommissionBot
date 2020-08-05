
import * as Discord from "discord.js";

interface RoleTemplate {
	color: number;
	name: string;
};

const roleTemplates = [
	{ color: 0x773ac7, name: 'commiޤޤioner' },
	{ color: 0x2647f1, name: 'ԨՕՏԎҼЯ' }
] as RoleTemplate[];

const roleImplementations = [] as Discord.Role[];

export enum Roles {
	COMMISSIONER,
	HOSTER
};

export let init = (guild: Discord.Guild) => {
	return new Promise((accept, reject) => {
		/* only exit the function when all roles have been found */
		const acceptor = () => {
			if (roleImplementations.length === roleTemplates.length)
				accept();
		};
	
		roleTemplates.forEach(roleTemplate => {
			/* see if role has been created by this bot before on this server */
			const foundRole = guild.roles.cache.find((role, key, collection) => {
				return role.name === roleTemplate.name;
			});
	
			if (foundRole) {
				if (checkRole(foundRole, roleTemplate)) {
					console.log('all good!');
					roleImplementations.push(foundRole);

					acceptor();

				} else {
					foundRole.delete('cleaning up internal roles').catch(err => reject(err));
	
					createRole(guild, roleTemplate).then(created => {
						roleImplementations.push(created);

						acceptor();

					}).catch(err => reject(err));
				}
	
			} else {
				createRole(guild, roleTemplate).then(created => {
					roleImplementations.push(created);
	
					acceptor();

				}).catch(err => reject(err));
			}
		});
	});
}

let checkRole = (role: Discord.Role, roleTemplate: RoleTemplate) => {
	return role.color === roleTemplate.color &&
		role.hoist === false &&
		role.mentionable === false &&
		role.name === roleTemplate.name &&
		!role.permissions.any(0x7FFFFFFF, true);
}

let createRole = (guild: Discord.Guild, roleTemplate: RoleTemplate) => {
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

export let getRole = (roleType: Roles) => {
	return roleImplementations[roleType];
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
	const role = Roles.COMMISSIONER;

	guild.members.cache.forEach(member => {
		if (member.roles.cache.has(getRole(role).id))
			member.roles.remove(getRole(role));
	});
}

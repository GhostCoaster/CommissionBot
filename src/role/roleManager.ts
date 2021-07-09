
import * as Discord from "discord.js";
import * as fs from 'fs';

const hosterRolesFilename = './hosterRoles.json';
const hosterRoles = new Map<string, string>();

/* custom role managemenmt */

type RoleStorage = {
	guildId: string,
	hosterRoleId: string
};

export const loadHosterRoles = (bot: Discord.Client) => {
	hosterRoles.clear();

	return new Promise<void>((accept, reject) => {
		if (!fs.existsSync(hosterRolesFilename)) {
			/* create dummy storage file */
			fs.writeFile(hosterRolesFilename, '[]', err => {
				err ? reject(err) : accept();
			});

		} else {
			fs.readFile(hosterRolesFilename, (err, data) => {
				if (err) return void reject(err);

				const roleStorageList = JSON.parse(data.toString()) as RoleStorage[];
				/* just ignore incorrectly formatted data */
				if (!Array.isArray(roleStorageList)) return void accept();

				roleStorageList.forEach(roleStorage => {
					const guildId = roleStorage.guildId;
					const hosterRoleId = roleStorage.hosterRoleId;

					if (guildId && hosterRoleId) {
						hosterRoles.set(guildId, hosterRoleId);
					} else {
						console.error(`Incorrect formatting for loaded role storage: ${roleStorage}`);
					}
				});

				accept();
			});
		}
	});
}

const saveCustomRoles = () => {
	return new Promise<void>((accept, reject) => {
		const saveArray = [] as RoleStorage[];

		hosterRoles.forEach((hosterRoleId, guildId) => {
			saveArray.push({ guildId, hosterRoleId });
		});

		fs.writeFile(hosterRolesFilename, JSON.stringify(saveArray), err => {
			err ? reject(err) : accept();
		});
	});
}

export const assignHosterRole = (guild: string, role: string) => {
	hosterRoles.set(guild, role);
	return saveCustomRoles();
}

/* role getters */

export const getHosterRole = (guild: Discord.Guild | undefined | null) => {
	if (!guild) return Promise.reject();
	
	const roleId = hosterRoles.get(guild.id);
	if (!roleId) return Promise.reject();

	return guild.roles.fetch(roleId);
}

export const getHosterRoleId = (guildId: string | undefined) => {
	if (!guildId) return undefined;

	return hosterRoles.get(guildId);
}

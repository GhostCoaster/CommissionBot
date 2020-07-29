
import * as Discord from 'discord.js'

export interface OnMessage {
	(message: Discord.Message): void;
};

export interface OnReact {
	(reaction: Discord.MessageReaction, user: Discord.User): void;
};

interface CommandDefinition {
	channel?: Discord.TextChannel;
	keyword?: string;
	onMessage: OnMessage;
};

interface ReactDefinition {
	message: Discord.Message;
	onReact: OnReact;
};

const delimiter = '^';

let commands = Array<CommandDefinition>();
let reactAdds = Array<ReactDefinition>();
let reactRemoves = Array<ReactDefinition>();

/* util */
let removeFromArray = <T>(array: Array<T>, find: (member: T) => boolean) => {
	let removeIndex = array.findIndex(find);
	if (removeIndex === -1) return;

	array.splice(removeIndex, 1);
}

export const addCommand = (channel: Discord.TextChannel, keyword: string, onMessage: OnMessage) => {
	commands.push({channel, keyword, onMessage});
}
export const addAnyCommand = (channel: Discord.TextChannel, onMessage: OnMessage) => {
	commands.push({channel, onMessage});
}
export const addGlobalCommand = (keyword: string, onMessage: OnMessage) => {
	commands.push({keyword, onMessage});
}

export const removeCommand = (channel: Discord.TextChannel | undefined, keyword: string | undefined) => {
	removeFromArray(commands, command => command.keyword === keyword && command.channel === channel);
}
export const removeAnyCommand = (channel: Discord.TextChannel) => {
	removeFromArray(commands, command => command.channel === channel && !command.keyword);
}
export const removeGlobalCommand = (keyword: string) => {
	removeFromArray(commands, command => command.keyword === keyword && !command.channel);
}

export let handleCommand = (bot: Discord.Client, message: Discord.Message) => {
	/* bot will not respond to own message */
	if (bot.user && message.author.id === bot.user.id) return;

	let text = message.content;

	commands.every(command => {
		if (
			(
				command.channel === undefined ||
				command.channel === message.channel
			) && (
				command.keyword === undefined ||
				text.startsWith(delimiter + command.keyword)
			)
		) {
			command.onMessage(message);
			return false;
		}

		return true;
	});
}

export let addReactAdd = (message: Discord.Message, onAdd: OnReact) => {
	reactAdds.push({message: message, onReact: onAdd});
}
export let removeReactAdd = (message: Discord.Message) => {
	removeFromArray(reactAdds, reactAdd => reactAdd.message === message);
}

export let addReactRemove = (message: Discord.Message, onRemove: OnReact) => {
	reactRemoves.push({message: message, onReact: onRemove});
}
export let removeReactRemove = (message: Discord.Message) => {
	removeFromArray(reactRemoves, reactRemove => reactRemove.message === message);
}

export let handleReactAdd = (bot: Discord.Client, messageReaction: Discord.MessageReaction, user: Discord.User | Discord.PartialUser) => {
	if (user.partial) return;
	if (bot.user && user.id === bot.user.id) return;

	reactAdds.every(reactAdd => {
		if (reactAdd.message === messageReaction.message) {
			reactAdd.onReact(messageReaction, user as Discord.User);

			return false;
		}

		return true;
	});
}

export let handleReactRemove = (bot: Discord.Client, messageReaction: Discord.MessageReaction, user: Discord.User | Discord.PartialUser) => {
	if (user.partial) return;
	if (bot.user && user.id === bot.user.id) return;

	reactRemoves.every(reactRemove => {
		if (reactRemove.message === messageReaction.message) {
			reactRemove.onReact(messageReaction, user as Discord.User);

			return false;
		}

		return true;
	});
}

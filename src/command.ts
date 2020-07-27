import * as Discord from 'discord.js'
import { Duplex } from 'stream';

export interface OnMessage {
	(message: Discord.Message): void;
};

export interface OnReact {
	(reaction: Discord.MessageReaction, user: Discord.User): void;
};

interface CommandPair {
	keyword: string;
	onMessage: OnMessage;
};

interface ReactPair {
	message: Discord.Message;
	onReact: OnReact;
};

const delimiter = '^';

let commands = Array<CommandPair>();
let reactAdds = Array<ReactPair>();
let reactRemoves = Array<ReactPair>();

export let addAnyCommand = (onMessage: OnMessage) => {
	commands.push({keyword: '', onMessage})
}

export let addCommand = (keyword: string, onMessage: OnMessage) => {
	commands.push({keyword, onMessage})
}

export let handleCommand = (bot: Discord.Client, message: Discord.Message) => {
	/* bot will not respond to own message */
	if (bot.user && message.author.id === bot.user.id) return;

	let text = message.content;

	if (text.startsWith(delimiter)) {
		let restText = text.slice(1);

		commands.every(command => {
			if (command.keyword === '' || restText.startsWith(command.keyword)) {
				command.onMessage(message);
				return false;
			}

			return true;
		});
	}
}

export let addReactAdd = (message: Discord.Message, onAdd: OnReact) => {
	reactAdds.push({message: message, onReact: onAdd});
}

export let removeReactAdd = (message: Discord.Message) => {
	let removeIndex = reactAdds.findIndex(reactAdd => reactAdd.message === message);
	if (removeIndex === -1) return;

	reactAdds.splice(removeIndex, 1);
}

export let addReactRemove = (message: Discord.Message, onRemove: OnReact) => {
	reactRemoves.push({message: message, onReact: onRemove});
}

export let removeReactRemove = (message: Discord.Message) => {
	let removeIndex = reactRemoves.findIndex(reactRemove => reactRemove.message === message);
	if (removeIndex === -1) return;

	reactRemoves.splice(removeIndex, 1);
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

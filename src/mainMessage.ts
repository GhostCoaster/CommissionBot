
import * as Discord from 'discord.js'
import { OnReact, removeReactAdd, removeReactRemove, addReactAdd, addReactRemove } from './command'

let createEmbed = (bigText: string, smallText: string, description: string | undefined) => {
	let attachment = new Discord.MessageAttachment('./res/paint.png', 'paint.png');

	let embed = new Discord.MessageEmbed()
	.setColor(0xffff00)
	.setTitle('Commissions')
	.setDescription(description || '')
	.attachFiles([attachment])
	.setThumbnail('attachment://paint.png')
	.addField(bigText, smallText);

	return embed;
}

let createMessage = (bigText: string, smallText: string, description: string | undefined, channel: Discord.TextChannel) => {
	return new Promise<Discord.Message>((accept, reject) => {
		channel.send(createEmbed(bigText, smallText, description)).then(message => accept(message)).catch(reason => reject(reason));
	});
}

export let editMessage = (bigText: string, smallText: string, description: string | undefined, message: Discord.Message) => {
	return new Promise<Discord.Message>((accept, reject) => {
		message.edit(createEmbed(bigText, smallText, description)).then(message => accept(message)).catch(reason => reject(reason));
	});
}

export let updateMessage = (bigText: string, smallText: string, description: string | undefined, channel: Discord.TextChannel, message: Discord.Message | undefined = undefined) => {
	return new Promise<Discord.Message>((accept, reject) => {
		if (message) {
			message.delete().catch(() => console.log('msg COULD not DELET!~'));
		}

		createMessage(bigText, smallText, description, channel).then(message => accept(message)).catch(reason => reject(reason));
	});
}

export let setReact = (message: Discord.Message, emoji: string, onAdd: OnReact, onRemove: OnReact) => {
	message.react(emoji);
	
	addReactAdd(message, onAdd);
	addReactRemove(message, onRemove);
}

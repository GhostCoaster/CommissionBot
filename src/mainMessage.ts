
import * as Discord from 'discord.js'
import { OnReact, removeReactAdd, removeReactRemove, addReactAdd, addReactRemove } from './command'

let createMessage = (bigText: string, smallText: string, channel: Discord.TextChannel) => {
	return new Promise<Discord.Message>((accept, reject) => {
		let attachment = new Discord.MessageAttachment('./res/paint.png', 'paint.png');

		let embed = new Discord.MessageEmbed()
		.setColor(0xffff00)
		.setTitle('Commissions')
		.attachFiles([attachment])
		.setThumbnail('attachment://paint.png')
		.addField(bigText, smallText);

		channel.send(embed).then(message => accept(message)).catch(reason => reject(reason));
	});
}

export let updateMessage = (bigText: string, smallText: string, channel: Discord.TextChannel, message: Discord.Message | undefined = undefined) => {
	return new Promise<Discord.Message>((accept, reject) => {
		if (message) {
			message.delete().catch(() => console.log('msg COULD not DELET!~'));
		}

		createMessage(bigText, smallText, channel).then(message => accept(message)).catch(reason => reject(reason));
	});
}

export let setReact = (message: Discord.Message, emoji: string, onAdd: OnReact, onRemove: OnReact) => {
	message.react(emoji);
	
	addReactAdd(message, onAdd);
	addReactRemove(message, onRemove);
}

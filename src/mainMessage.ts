
import * as Discord from 'discord.js'

let createMessage = (bigText: string, smallText: string, channel: Discord.TextChannel) => {
	return new Promise<Discord.Message>((accept, reject) => {
		let embed = new Discord.MessageEmbed();

		embed.fields.push({
			name: bigText,
			value: smallText,
			inline: false
		});
	
		embed.color = 0xffff00;
		embed.thumbnail = { url: 'res/paint.png' };
	
		channel.send(embed).then(message => accept(message)).catch(reject);
	})
}

export let updateMessage = (bigText: string, smallText: string, channel: Discord.TextChannel, message: Discord.Message | undefined = undefined) => {
	return new Promise<Discord.Message>((accept, reject) => {
		if (message) message.delete();

		createMessage(bigText, smallText, channel).then(message => accept(message)).catch(reject);
	});
}

export let addReactions = (message: Discord.Message, emoji: string, onAdd: (user: Discord.User) => void, onRemove: (user: Discord.User) => void) => {
	message.react(emoji);
}

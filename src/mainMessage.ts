
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
	
		console.log(`help ${embed}`);

		channel.send(embed).then(message => {
			console.log('it worked to send');
			accept(message);
		}).catch(reason => {
			console.log('it did not work to send');
			console.log(reason);
			reject(reason);
		});
	})
}

export let updateMessage = (bigText: string, smallText: string, channel: Discord.TextChannel, message: Discord.Message | undefined = undefined) => {
	console.log('StArT');

	return new Promise<Discord.Message>((accept, reject) => {
		if (message) {
			console.log('messssssssaaa');

			removeReactAdd(message);
			removeReactRemove(message);

			message.delete();
		}

		console.log('bout to creat');

		createMessage(bigText, smallText, channel).then(message => accept(message)).catch(reason => {
			console.log(`vaaaaaaaaaauuus ${reason}`);
			reject(reason);
		});
	});
}

export let setReact = (message: Discord.Message, emoji: string, onAdd: OnReact, onRemove: OnReact) => {
	message.react(emoji);
	
	addReactAdd(message, onAdd);
	addReactRemove(message, onRemove);
}

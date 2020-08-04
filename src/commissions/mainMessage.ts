
import * as Discord from 'discord.js'
import { OnReact, addReactAdd, addReactRemove } from '../command'

let attachment: Discord.MessageAttachment;

const DEFAULT_COLOR = 0x99d9ea;
const INACTIVE_COLOR = 0x2e2e2e;

export const init = () => {
	attachment = new Discord.MessageAttachment('./res/paint.png', 'paint.png');
}

const createEmbed = (bigText: string, smallText: string, description: string, color = DEFAULT_COLOR) => {
	const embed = new Discord.MessageEmbed()
	.setColor(color)
	.setTitle('Commissions')
	.setDescription(description)
	.attachFiles([attachment])
	.setThumbnail('attachment://paint.png')
	.addField(bigText, smallText);

	return embed;
}

export const editMessage = (bigText: string | undefined, smallText: string | undefined, description: string | undefined, message: Discord.Message) => {
	return new Promise<Discord.Message>((accept, reject) => {
		const oldEmbed = message.embeds[0];
		const usingBigText = bigText || oldEmbed.fields[0].name;
		const usingSmallText = smallText || oldEmbed.fields[0].value;
		const usingDescription = description || oldEmbed.description;

		message.edit(createEmbed(usingBigText, usingSmallText, usingDescription || '')).then(message => accept(message)).catch(reason => reject(reason));
	});
}

export const updateMessage = (bigText: string, smallText: string, description: string | undefined, channel: Discord.TextChannel, message: Discord.Message | undefined = undefined) => {
	return new Promise<Discord.Message>((accept, reject) => {
		/* make the previous message dead */
		if (message) {
			message.reactions.removeAll();
			message.attachments.clear();

			if (message.embeds.length > 0) {
				const oldEmbed = message.embeds[0];
				message.edit(createEmbed(oldEmbed.fields[0].name, oldEmbed.fields[0].value, oldEmbed.description || '', INACTIVE_COLOR));	
			}
		}

		/* send new message */
		channel.send(createEmbed(bigText, smallText, description || '')).then(message => accept(message)).catch(reason => reject(reason));
	});
}

export const setReact = (message: Discord.Message, emoji: string, onAdd: OnReact, onRemove: OnReact) => {
	message.react(emoji);
	
	addReactAdd(message, onAdd);
	addReactRemove(message, onRemove);
}

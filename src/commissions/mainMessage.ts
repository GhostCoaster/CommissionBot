
import * as Discord from 'discord.js'
import { OnReact, addReactAdd, addReactRemove } from '../command'

let attachment: Discord.MessageAttachment;

const DEFAULT_COLOR = 0x99d9ea; /* paint default light blue color */
const INACTIVE_COLOR = 0x2e2e2e; /* a dark gray drab color */

export const init = () => {
	attachment = new Discord.MessageAttachment('./res/paint.png', 'paint.png');
}

export interface EmbedOptions {
	color?: number;
	description?: string | null;
	fields?: Discord.EmbedFieldData[];
	image?: string;
}

const createEmbed = (options: EmbedOptions) => {
	const embed = new Discord.MessageEmbed()
	.setColor(options.color || DEFAULT_COLOR)
	.setTitle('Commissions')
	.setDescription(options.description || '')
	.attachFiles([attachment])
	.setThumbnail('attachment://paint.png')
	.addFields(options.fields || [])
	.setImage(options.image || '');

	return embed;
}

export const editMessage = (options: EmbedOptions, message: Discord.Message) => {
	return new Promise<Discord.Message>((accept, reject) => {
		const oldEmbed = message.embeds[0];

		/* if no description or field is provided use old values */
		if (!options.description) options.description = oldEmbed.description;
		if (!options.fields) options.fields = oldEmbed.fields;

		message.edit(createEmbed(options)).then(message => accept(message)).catch(reason => reject(reason));
	});
}

/**
 * do not pass in an argument for message if the commissions
 * does not have a message associated with it yet
 * 
 * this will create the main message if applicable
 * 
 * @param options 
 * @param channel 
 * @param message 
 */
export const updateMessage = (options: EmbedOptions, channel: Discord.TextChannel, message?: Discord.Message) => {
	return new Promise<Discord.Message>((accept, reject) => {
		/* make the previous message dead */
		if (message) {
			if (message.embeds.length > 0) {
				const oldEmbed = message.embeds[0];

				message.edit(createEmbed({
					color: INACTIVE_COLOR,
					description: oldEmbed.description,
					fields: oldEmbed.fields,
					image: oldEmbed.image ? oldEmbed.image.url : ''
				}));	
			}
		}

		/* send new message */
		channel.send(createEmbed(options)).then(message => accept(message)).catch(reason => reject(reason));
	});
}

export const setReact = (message: Discord.Message, emoji: string, onAdd: OnReact, onRemove: OnReact) => {
	message.react(emoji);
	
	addReactAdd(message, onAdd);
	addReactRemove(message, onRemove);
}

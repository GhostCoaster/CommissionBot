import * as Discord from "discord.js";

export class Submission {
	message: Discord.Message;
	rating: number;

	constructor(message: Discord.Message) {
		this.message = message;
		this.rating = 0;
	}
}

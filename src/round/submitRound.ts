
import { Round } from './round'
import { updateMessage } from '../mainMessage';
import { DiscordAPIError, Message } from 'discord.js';

export class SubmitRound extends Round {
	onStart(): void {
		this.commissions.channel.send('end of timer lol');
	}
	
	onEnd(): void {
		
	}
}

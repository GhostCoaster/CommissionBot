import { Round } from './round'

export class ReadyRound extends Round {
	onStart(): void
	{
		this.commissions.channel.send('not implemented yet lol');
	}

	onEnd(): void
	{
		
	}
}

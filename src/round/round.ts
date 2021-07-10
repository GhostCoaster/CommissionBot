import { Commissions } from "../commissions/commissions";
import { RoundType, rounds } from "./rounds";
import { Timer } from "../timer";
import { GuildMember, Message } from "discord.js";
import { CommandDefinition } from "../command";

export abstract class Round {
	/* default values */
	/* should never be in this state */
	roundType: RoundType = rounds[0]
	commissions: Commissions = null as unknown as Commissions;
	timer: Timer = new Timer();
	commands: [CommandDefinition];

	constructor(commands: [CommandDefinition]) {
		this.commands = commands;
	}

	abstract onMessage(message: Message): void;

	abstract onStart(): void;
	abstract onEnd(): void;

	abstract onPlayerLeave(member: GuildMember, index: number): void;
}

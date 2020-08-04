import { Commissions } from "../commissions/commissions";
import { RoundType, rounds } from "./rounds";
import { Timer } from "../timer";

export abstract class Round {
	/* default values */
	/* should never be in this state */
	roundType: RoundType = rounds[0]
	commissions: Commissions = null as unknown as Commissions;
	timer: Timer = new Timer();

	inject(roundType: RoundType, commissions: Commissions) {
		this.roundType = roundType;
		this.commissions = commissions;
	}

	abstract onStart(): void;

	abstract onEnd(): void;
}

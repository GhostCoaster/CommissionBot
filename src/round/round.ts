import { Commissions } from "../commissions/commissions";
import { RoundType, rounds } from "./rounds";

export abstract class Round {
	/* default values */
	/* should never be in this state */
	roundType: RoundType = rounds[0]
	commissions: Commissions = null as unknown as Commissions;

	construct(roundType: RoundType, commissions: Commissions) {
		this.roundType = roundType;
		this.commissions = commissions;
	}

	abstract onStart(): void;

	abstract onEnd(): void;
}

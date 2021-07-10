
import { Round } from './round'
import { Commissions } from '../commissions/commissions'

import { JoinRound } from './joinRound'
import { ReferenceRound } from './referenceRound'
import { ReadyRound } from './readyRound'
import { DrawRound } from './drawRound'
import { SubmitRound } from './submitRound'
import { VoteRound } from './voteRound'

export interface RoundType {
	id?: number;
	create: () => Round;
	next: number;
};

export enum RoundIndex {
	JOIN,
	REFERENCE,
	READY,
	DRAW,
	SUBMIT,
	VOTE
}

export let rounds: RoundType[] = [
	{ create: () => new JoinRound(),      next: RoundIndex.REFERENCE },
	{ create: () => new ReferenceRound(), next: RoundIndex.READY     },
	{ create: () => new ReadyRound(),     next: RoundIndex.DRAW      },
	{ create: () => new DrawRound(),      next: RoundIndex.SUBMIT    },
	{ create: () => new SubmitRound(),    next: RoundIndex.VOTE      },
	{ create: () => new VoteRound(),      next: RoundIndex.REFERENCE }
];

/* init rounds by setting ids programattically */
rounds.forEach((roundType, i) => { roundType.id = i });

export let createRound = (commissions: Commissions, index: number) => {
	let roundType = rounds[index];

	let round = roundType.create();
	round.roundType = roundType;
	round.commissions = commissions;

	round.onStart();
	
	return round;
}


import { Round } from './round'
import { Commissions } from '../commissions'
import { JoinRound } from './joinRound'

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
	VOTE,
	FINAL
}

export let rounds: RoundType[] = [
	{create: () => new JoinRound(), next: RoundIndex.REFERENCE},
	{create: () => new JoinRound(), next: RoundIndex.READY},
	{create: () => new JoinRound(), next: RoundIndex.DRAW},
	{create: () => new JoinRound(), next: RoundIndex.SUBMIT},
	{create: () => new JoinRound(), next: RoundIndex.VOTE},
	{create: () => new JoinRound(), next: RoundIndex.FINAL},
	{create: () => new JoinRound(), next: RoundIndex.REFERENCE}
];

/* init rounds by setting ids programattically */
rounds.forEach((roundType, i) => { roundType.id = i });

export let createRound = (commissions: Commissions, index: number) => {
	let roundType = rounds[index];

	let round = roundType.create();
	round.construct(roundType, commissions);

	return round;
}

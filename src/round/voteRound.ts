
import { Round } from './round';
import * as Util from '../util';
import { addReactAdd, addReactRemove, removeReactAdd, removeReactRemove, addDelete, GuildMessage } from '../command';
import * as Discord from 'discord.js';
import { Timer } from '../timer';
import { Submission } from '../commissions/submission';
import { changeScore } from '../scores';

const UPVOTE = '⬆️';
const DOWNVOTE = '⬇️';

export class VoteRound extends Round {
	constructor() {
		super([
			{
				keyword: 'force',
				onMessage: message => {
					if (this.commissions.isAdmin(message.member)) {
						this.commissions.nextRound();
					}
				}
			}
		]);
	}

	onMessage(message: GuildMessage): void {
		const member = message.member;
		const playerIndex = this.commissions.players.indexOf(member);

		/* don't allow non submitted players to speak */
		/* or mainly to try and submit */
		if (playerIndex === -1 || !this.commissions.submittedDrawings[playerIndex]) {
			return Util.deleteNotBot(message)
		}
	}

	checkForceEnd() {
		/* don't do anything if there were no submissions */
		/* or if there was only 1 (which will be the winner) */
		if (this.commissions.submittedDrawings.filter(el => el !== undefined).length <= 1) {
			this.commissions.nextRound();
			return true;
		}

		return false;
	}

	removeSubmission(message: Discord.Message, index: number) {
		removeReactAdd(message);
		removeReactRemove(message);

		this.commissions.submittedDrawings[index] = undefined;

		this.checkForceEnd();
	}

	onStart(): void {
		if (this.checkForceEnd()) return;

		/* no voting in casual mode */
		if (!this.commissions.ranked) return void this.commissions.nextRound();

		/* actually set up voting round */

		this.timer = new Timer(60, 5, secondsLeft => {
			this.commissions.editMessage({ description: Util.timeDescription(secondsLeft) });
		}, () => this.commissions.nextRound());

		this.timer.start();

		const embedFields = [{
			name: 'Voting',
			value: 'The submission with the highest score will win'
		}, {
			name: UPVOTE,
			value: 'upvote',
			inline: true
		}, {
			name: DOWNVOTE,
			value: 'downvote',
			inline: true
		}];

		/* find out who didn't submit */
		const notSubmitString = this.commissions.submittedDrawings.map((submission, i) => {
			if (submission !== undefined) {
				`${this.commissions.players[i].displayName}`
			} else {
				undefined
			}
		}).filter(str => str !== undefined).join(', ');

		if (notSubmitString !== '') {
			embedFields.push({
				name: 'Did not submit:',
				value: notSubmitString
			});
		}

		this.commissions.updateMessage({
			description: Util.timeDescription(this.timer.getTime()),
			fields: embedFields
		});

		this.commissions.submittedDrawings.forEach((submission, index) => {
			if (!submission) return;

			const message = submission.message

			message.react(UPVOTE);
			message.react(DOWNVOTE);

			const removeOpposing = (message: Discord.Message, user: Discord.User, emojiName: string, onRemove: () => void) => {
				message.reactions.cache.some(messageReaction =>
					messageReaction.emoji.name === emojiName && messageReaction.users.cache.some(cacheUser => {
						if (cacheUser === user) {
							messageReaction.users.remove(user);
							onRemove();
							return true;
						}
						return false;
					})
				);
			}

			addReactAdd(message, (messageReact, user) => {
				if (this.commissions.filterReact(messageReact, user, true)) return;

				/* upvote */
				if (messageReact.emoji.name === UPVOTE) {
					++submission.rating;

					removeOpposing(message, user, DOWNVOTE, () => ++submission.rating)

				/* downvote */
				} else if (messageReact.emoji.name === DOWNVOTE) {
					--submission.rating;

					removeOpposing(message, user, UPVOTE, () => --submission.rating)
				}
			});

			addReactRemove(message, messageReact => {
				/* upvote */
				if (messageReact.emoji.name === '📤') {
					--submission.rating;
				/* downvote */
				} else if (messageReact.emoji.name === '📥') {
					++submission.rating;
				}
			});

			/* if a player revokes their submission */
			addDelete(message, () => {
				this.removeSubmission(message, index);
			});
		});
	}

	onEnd(): void {
		this.timer.stop();

		this.commissions.submittedDrawings.forEach(submission => {
			if (!submission) return;

			removeReactAdd(submission.message);
			removeReactRemove(submission.message);
		});

		/* tell who won */

		if (!this.commissions.ranked) {
			this.commissions.updateMessage({
				fields: [{
					name: 'Round Ended',
					value: 'Everyone wins! (casual mode)'
				}]
			})

		} else if (this.commissions.ranked) {
			/* determine every message with the highest score */
			var highestScore = -Infinity;
			var contenders = [] as Submission[];
	
			this.commissions.submittedDrawings.forEach(submission => {
				if (!submission) return;
	
				if (submission.rating > highestScore) {
					highestScore = submission.rating;
					contenders = [submission];
	
				} else if (submission.rating === highestScore) {
					contenders.push(submission);
				}
			});
	
			if (contenders.length === 0) {
				this.commissions.updateMessage({
					fields: [{
						name: 'Round Ended',
						value: 'No one wins?'
					}]
				});

			} else {
				/* pick a random winner from all the submissions with the highest score */
				const winningSubmission = contenders[Math.floor(Math.random() * contenders.length)];
	
				const url = winningSubmission.message.attachments.first()?.url;
				const winner = winningSubmission.message.member;

				if (!winner) return;
		
				const newScore = changeScore(winner.id, 1);
				
				this.commissions.updateMessage({
					fields: [{
						name: 'Round Ended',
						value: `<@${winner.id}> has won!`
					}],
					description: `${winner.displayName}'s score: ${newScore}`,
					image: url
				});
			}
		}
	}

	onPlayerLeave(_: Discord.GuildMember, index: number) {
		/* delete the leaver's submission if they have one */
		const submission = this.commissions.submittedDrawings[index];
		
		if (submission) {
			this.removeSubmission(submission.message, index);
		}
	}
}

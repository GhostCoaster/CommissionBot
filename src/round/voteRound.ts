
import { Round } from './round';
import * as Util from '../util';
import { addReactAdd, addReactRemove, removeReactAdd, removeReactRemove, addCommand, removeCommand, addDelete, addAnyCommand, removeAnyCommand } from '../command';
import * as Discord from 'discord.js';
import { Timer } from '../timer';
import { Submission } from '../commissions/submission';
import { changeScore } from '../scores';

export class VoteRound extends Round {
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
			name: '📤',
			value: 'upvote',
			inline: true
		}, {
			name: '📥',
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

		addCommand(this.commissions.channel, 'force', message => {
			this.commissions.nextRound();
		});

		addAnyCommand(this.commissions.channel, message => {
			const member = message.member;
			const playerIndex = this.commissions.players.indexOf(member);

			if (playerIndex === -1) return void message.delete();

			/* don't allow non submitted players to speak */
			/* or mainly to try and submit */
			if (!this.commissions.submittedDrawings[playerIndex])
				return void message.delete();
		});

		this.commissions.submittedDrawings.forEach((submission, index) => {
			if (!submission) return;

			const message = submission.message

			message.react('📤');
			message.react('📥');

			const removeOpposing = (message: Discord.Message, user: Discord.User, emojiName: string, onRemove: () => void) => {
				message.reactions.cache.every(messageReaction =>
					messageReaction.emoji.name !== emojiName
					|| messageReaction.users.cache.every(cacheUser => {
						if (cacheUser === user) {
							messageReaction.users.remove(user);
							onRemove();
							return false;
						}

						return true;
					})
				);
			}

			addReactAdd(message, (messageReact, user) => {
				if (this.commissions.filterReact(messageReact, user, true)) return;

				/* upvote */
				if (messageReact.emoji.name === '📤') {
					++submission.rating;

					removeOpposing(message, user, '📥', () => ++submission.rating)

				/* downvote */
				} else if (messageReact.emoji.name === '📥') {
					--submission.rating;

					removeOpposing(message, user, '📤', () => --submission.rating)
				}
			});

			addReactRemove(message, (messageReact, user) => {
				/* upvote */
				if (messageReact.emoji.name === '📤') {
					--submission.rating;
				/* downvote */
				} else if (messageReact.emoji.name === '📥') {
					++submission.rating;
				}
			});

			/* if a player revokes their submission */
			addDelete(message, deleted => {
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

		removeCommand(this.commissions.channel, 'force');

		removeAnyCommand(this.commissions.channel);

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

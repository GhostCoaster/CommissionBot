
import { Round } from './round';
import { updateMessage, setReact } from '../commissions/mainMessage';
import * as Util from '../util';
import { addReactAdd, addReactRemove, removeReactAdd, removeReactRemove, addCommand, removeCommand, addDelete, addAnyCommand, removeAnyCommand } from '../command';
import Collection from '@discordjs/collection';
import * as Discord from 'discord.js';
import { Timer } from '../timer';
import { Submission } from '../commissions/submission';

export class VoteRound extends Round {
	onStart(): void {
		/**
		 * ends this round if applicable
		 * 
		 * @returns if this round was force ended
		 */
		const checkForceEnd = () => {
			/* don't do anything if there were no submissions */
			/* or if there was only 1 (which will be the winner) */
			let numSubmissions = 0;

			/* foreach counts all non undefined submissions */
			this.commissions.submittedDrawings.forEach(() => ++numSubmissions);

			if (numSubmissions < 2) {
				this.commissions.nextRound();

				return true;
			}

			return false;
		}
		
		if (checkForceEnd()) return;

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
		let notSubmitString = '';
		const submitArray = this.commissions.submittedDrawings;
		for (let i = 0; i < submitArray.length; ++i) {
			const submission = this.commissions.submittedDrawings[i];

			if (!submission) notSubmitString += `${Util.favoredName(this.commissions.players[i])} `;
		}

		/* if at least one person didn't submit */
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
				if (this.commissions.filterReact(messageReact, user)) return;

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
				removeReactAdd(message);
				removeReactRemove(message);

				this.commissions.submittedDrawings[index] = undefined;

				checkForceEnd();
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
	}
}


import { Round } from './round';
import { updateMessage, setReact } from '../commissions/mainMessage';
import * as Util from '../util';
import { addReactAdd, addReactRemove, removeReactAdd, removeReactRemove, addCommand, removeCommand, addDelete } from '../command';
import Collection from '@discordjs/collection';
import * as Discord from 'discord.js';
import { Timer } from '../timer';

export class VoteRound extends Round {
	onStart(): void {
		const checkForceEnd = () => {
			/* don't do anything if there were no submissions */
			/* or if there was only 1 (which will be the winner) */
			let numSubmissions = 0;

			this.commissions.submittedDrawings.forEach(submission => {
				if (submission !== undefined) ++numSubmissions;
			})

			if (numSubmissions < 2) {
				this.timer.stop();
				return void this.commissions.nextRound();
			}
		}
		
		checkForceEnd();

		/* no voting in casual mode */
		if (!this.commissions.ranked) return void this.commissions.nextRound();

		/* actually set up voting round */
		this.timer = new Timer(60, 5, secondsLeft => {
			this.commissions.editMessage({ description: Util.timeDescription(secondsLeft) });
		}, () => this.commissions.nextRound());

		this.timer.start();

		this.commissions.updateMessage({
			description: Util.timeDescription(this.timer.getTime()),
			fields: [{
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
			}]
		});

		addCommand(this.commissions.channel, 'force', message => {
			this.commissions.nextRound();
		});

		this.commissions.submittedDrawings.forEach((submission, index) => {
			/* if this player actually submitted */
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
		this.commissions.submittedDrawings.forEach(submission => {
			if (!submission) return;

			removeReactAdd(submission.message);
			removeReactRemove(submission.message);
		});

		removeCommand(this.commissions.channel, 'force');
	}
}

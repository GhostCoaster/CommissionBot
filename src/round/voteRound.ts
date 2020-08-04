
import { Round } from './round';
import { updateMessage, setReact } from '../commissions/mainMessage';
import * as Util from '../util';
import { addReactAdd, addReactRemove, removeReactAdd, removeReactRemove, addCommand, removeCommand } from '../command';
import Collection from '@discordjs/collection';
import * as Discord from 'discord.js';
import { Timer } from '../timer';

export class VoteRound extends Round {
	onStart(): void {
		this.timer = new Timer(30, 5, secondsLeft => {
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

		this.commissions.submittedDrawings.forEach(submission => {
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

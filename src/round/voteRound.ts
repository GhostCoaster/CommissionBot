
import { Round } from './round';
import { updateMessage, setReact } from '../commissions/mainMessage';
import * as Util from '../util';
import { addReactAdd, addReactRemove, removeReactAdd, removeReactRemove, addCommand, removeCommand } from '../command';
import Collection from '@discordjs/collection';
import * as Discord from 'discord.js';
import { Timer } from '../timer';

export class VoteRound extends Round {
	timer: Timer = undefined as unknown as Timer

	onStart(): void {
		this.timer = new Timer(30, 5, secondsLeft => {
			this.commissions.editMessage(undefined, undefined, Util.timeDescription(secondsLeft));
		}, () => this.commissions.nextRound());

		this.timer.start();

		this.commissions.updateMessage(
			'Voting',
			'React with 📤 to upvote, React with 📥 to downvote',
			Util.timeDescription(this.timer.getTime())
		);

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

			addReactAdd(message, (messageReaction, user) => {
				/* upvote */
				if (messageReaction.emoji.name === '📤') {
					++submission.rating;

					removeOpposing(message, user, '📥', () => ++submission.rating)

				/* downvote */
				} else if (messageReaction.emoji.name === '📥') {
					--submission.rating;

					removeOpposing(message, user, '📤', () => --submission.rating)
				}
			});

			addReactRemove(message, (messageReaction, user) => {
				/* upvote */
				if (messageReaction.emoji.name === '📤') {
					--submission.rating;
				/* downvote */
				} else if (messageReaction.emoji.name === '📥') {
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


import { Round } from './round';
import { updateMessage, setReact } from '../commissions/mainMessage';
import * as Util from '../util';
import { addReactAdd, addReactRemove, removeReactAdd, removeReactRemove, addCommand, removeCommand } from '../command';
import Collection from '@discordjs/collection';
import * as Discord from 'discord.js';
import { Timer } from '../timer';
import { Submission } from '../commissions/submission';

export class FinalRound extends Round {
	onStart(): void {
		var highestScore = 0;
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
			const winningSubmission = contenders[Math.floor(Math.random() * contenders.length)];

			const winningAttachment = winningSubmission.message.attachments.first();
			const url = winningAttachment ? winningAttachment.url : '';

			this.commissions.updateMessage({
				fields: [{
					name: 'Round Ended',
					value: `<@${winningSubmission.message.author.id}> has won!`
				}],
				image: url
			});
		}

		addCommand(this.commissions.channel, 'next', message => {
			if (this.commissions.isAdmin(message.member))
				this.commissions.nextRound();
		});
	}

	onEnd(): void {
		removeCommand(this.commissions.channel, 'next');
	}
}


import { Round } from './round';
import { updateMessage, setReact } from '../commissions/mainMessage';
import * as Util from '../util';
import { addReactAdd, addReactRemove, removeReactAdd, removeReactRemove, addCommand, removeCommand } from '../command';
import Collection from '@discordjs/collection';
import * as Discord from 'discord.js';
import { Timer } from '../timer';
import { Submission } from '../commissions/submission';
import * as Storage from '../storage';

export class FinalRound extends Round {
	onStart(): void {
		if (this.commissions.ranked) {
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
				//DEBUG
				contenders.forEach(contender => {
					console.log(`contender: ${contender.message.id} | ${contender.message.author.username}`);
				});
				//DEBUG

				const winningIndex = Math.floor(Math.random() * contenders.length);
				const winningSubmission = contenders[winningIndex];
	
				const winningAttachment = winningSubmission.message.attachments.first();
				const url = winningAttachment ? winningAttachment.url : '';
	
				const winner = winningSubmission.message.member;
				if (!winner) return;
				const winnerName = winner.nickname ? winner.nickname : winner.user.username;
	
				Storage.changeScore(winner.id, 1).then(score => {
					this.commissions.updateMessage({
						fields: [{
							name: 'Round Ended',
							value: `<@${winner.id}> has won!`
						}],
						description: `${winnerName}'s score: ${score}`,
						image: url
					});
				}).catch(err => console.log(err));
			}
		} else {
			this.commissions.updateMessage({
				fields: [{
					name: 'Round Ended',
					value: 'Everyone wins! (casual mode)'
				}]
			})
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

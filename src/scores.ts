
import * as fs from 'fs'

interface PlayerScore {
	id: string;
	score: number;
}

const DATA_PATH = './scores.json';

export let scores = [] as PlayerScore[];

const readData = () => {
	return new Promise<PlayerScore[]>((accept, reject) => {
		if (!fs.existsSync(DATA_PATH)) {
			fs.writeFile(DATA_PATH, '[]', err => {
				if (err) return void reject(err);

				accept([]);
			});

			return;
		}

		fs.readFile(DATA_PATH, (err, data) => {
			if (err) return void reject(err);

			accept(JSON.parse(data.toString()));
		});
	});
}

const writeData = (scores: PlayerScore[]) => {
	return new Promise<void>((accept, reject) => {
		fs.writeFile(DATA_PATH, JSON.stringify(scores), err => {
			if (err) return void reject(err);

			accept();
		});
	});
}

/**
 * call when bot is initializing
 * 
 * caches the current state of the scores
 * from a previous session
 */
export const init = () => {
	return new Promise<void>((accept, reject) => {
		readData().then(read => {
			scores = read;

			accept();

		}).catch(err => reject(err));
	});
}

/**
 * if the player does not exist in storage it will create a new entry
 * 
 * @param id id of the user cached in storage associated with a score
 * @param modifier relative offset for score, usually in increments of 1
 * 
 * @returns the new score
 */
export const changeScore = (id: string, modifier: number) => {
	const score = scores.find(score => score.id === id);
	let finalScore: number;

	if (!score) {
		scores.push({ id: id, score: modifier });
		finalScore = modifier;
		
	} else {
		score.score += modifier;
		finalScore = score.score;
	}

	writeData(scores);

	return finalScore;
}

/**
 * @param id id of the user cached in storage associated with a score
 * 
 * @return 0 if the player does not have a score, will not attempt to cache
 */
export const getScore = (id: string) => {
	const score = scores.find(score => score.id === id);

	if (!score) return 0;

	return score.score;
}

import * as fs from 'fs'

export const DEFAULT_TOKEN_FILE = 'token.txt'

export let getToken = (filepath = DEFAULT_TOKEN_FILE): Promise<string> => {
	return new Promise((accept, reject) => {
		fs.readFile(filepath, (err, data) => {
			if (err) return reject()

			accept(data.toString())
		})	
	})
}

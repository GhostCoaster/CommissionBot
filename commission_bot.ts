import * as Discord from 'discord.js'

import * as Login from './login'

const bot = new Discord.Client()

bot.on('ready', () => {
	console.log('HELLLLLO WOIRLD')
})

bot.on('message', () => {

})

Login.getToken().then(token => {
	bot.login(token)
}).catch(() => {
	console.log('could not find token locally')
})

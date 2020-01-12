/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
/* Glitch Wake */
/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
const http = require('http');  
const express = require('express');
const app = express();
app.get("/", (request, response) => {
  console.log(Date.now() + " Ping Received");
  response.sendStatus(200);
});
app.listen(process.env.PORT);
setInterval(() => {
  http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 280000);
/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

const Discord = require('discord.js');
const bot = new Discord.Client();

const [ token ] = process.argv.slice(2);
bot
  .login(process.env.TOKEN || token)
  .catch(console.error);

bot.on('ready', () =>
{
  console.log('Oks na pre.');
});

bot.on('message', message =>
{
  new CommandHandler(message);
});

// bot.on('voiceStateUpdate', (old, current) => 
// {
//   console.log(old.voiceChannel? old.voiceChannel.name : 'joined');
//   console.log(current.voiceChannel? current.voiceChannel.name : 'left');
// });

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
/* Commands */
/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

class CommandHandler
{
  /** @param {import('discord.js').Message} message */
  constructor(message)
  {
    this.message = message;

    this.checkIfMoveToVC();
  }
  
  async checkIfMoveToVC()
  {
    const botMention = this.message.mentions.users.get(bot.user.id);
    if(!botMention)
      return;

    this.message.content = this.message.content
      .replace(Discord.MessageMentions.USERS_PATTERN, '')
      .trim();

    if(this.message.content.length === 0)
      return;

    const voiceChannels = this.message.guild.channels
      .filter(({ type }) => type === 'voice');
    const matchingVC = voiceChannels.find(({ name }) =>
      name.toLowerCase().includes(this.message.content.toLowerCase()));
    if(!matchingVC)
      return this.message.reply('walang ganyang vc sir');

    const currentVC = this.message.member.voiceChannel;
    if(currentVC.id === matchingVC.id)
      return this.message.reply("nandiyan ka na pre.");

    const usersInVC = currentVC.members;
    const allMoved = usersInVC.reduce((allMoved, { id }) =>
    {
      allMoved[id] = true;
      return allMoved;
    }, {});

    for(const user of usersInVC.array())
    {
      await user.setVoiceChannel(matchingVC)
        .catch(error =>
        {
          console.error(error);
          allMoved[user.id] = false;
        });
    }
    
    /** @type {import('discord.js').GuildMember[]} */
    const cannotMove = Object.keys(allMoved)
      .filter(id => !allMoved[id])
      .map(id => this.message.guild.member(id));
      
    if(Object.values(allMoved).length === cannotMove.length)
      return this.message.channel.send('di ako pwede magmove diyan');
    
    if(cannotMove.length !== 0)
      return this.message.channel.send('di ko mamove sila '
        + cannotMove.map(member => member.displayName).join(', '));

    this.message.channel.send('oks na');
  }
}

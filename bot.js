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
const fetch = require('node-fetch');
const bot = new Discord.Client();

const config = require('./config');
const
{
  nico,
  bee,
  snyk,
  levin,
} = config;

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

    const text = message.content
      .replace(Discord.MessageMentions.USERS_PATTERN, '')
      .toLowerCase()
      .trim();
    const sender = message.author.id;

    // Nico commands
    if(sender === nico.discordID)
    {
      if(text.includes(nico.catKeyword))
        this.randomCat();
    }

    // Bee commands
    if(sender === bee.discordID)
    {
      if(text.includes(bee.linksKeyword))
        this.beeLinks();
    }

    // Snyk commands
    if(sender === snyk.discordID)
    {
      if(text.includes(snyk.goatKeyword))
        this.goatSound();
    }

    // Levin commands
    if(sender === levin.discordID)
    {
      if
      (
        message.mentions.users.get(bot.user.id) !== undefined &&
        text === levin.recipeKeyword
      )
        this.getRandomRecipe();
    }
      
    // Moving to another vc
    this.checkIfMoveToVC();
  }

  /* Nico Commands */
  async randomCat()
  {
    const response = await request(
      config.catAPI,
      this.message,
      'uh i cant get cat sorry'
    );

    if(!response)
      return;

    const cat = response.file;
    const embed = new Discord.RichEmbed()
      .setColor('#36393f')
      .setImage(cat);

    this.message.channel.send(embed);
  }

  /* Bee Commands */
  beeLinks()
  {
    this.message.channel.send(bee.links
      .map(link => `<${link}>`)
      .join('\n'));
  }

  /* Snyk Commands */
  async goatSound()
  {
    const currentVC = this.message.member.voiceChannel;
    currentVC.join()
      .then(voiceConnection =>
      {
        if(!voiceConnection)
          return;
  
        voiceConnection.playFile(snyk.goatSound);
        voiceConnection.dispatcher.on('end', () =>
          voiceConnection.disconnect());        
      })
      .catch(error =>
      {
        console.error(error);
        this.message.channel.send('ayaw gumana ng kambing');
      });
  }

  /* Levin Commands */
  async getRandomRecipe()
  {
    const apiKey = process.env.FOOD_API_KEY ||
      require('./others/secrets.js').foodAPIKey;
      
    const response = await request(
      `${levin.recipeAPI}?apiKey=${apiKey}&number=1`,
      this.message,
      'sorry paps di na ako makakuha ng chibog'
    );

    if(!response)
      return;

    let [ recipe ] = response.recipes;
    recipe = recipe.sourceUrl;
    this.message.reply(`eto paps masarap daw to\n${recipe}`);
  }
  
  /* General Commands */
  async checkIfMoveToVC()
  {
    if(!this.message.member.roles.get(config.royalBee))
      return;

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
    if(!currentVC)
      return this.message.reply('wala ka sa vc');
    
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

/* Helpers */
/**
 * @param {string} url 
 * @param {import('discord.js').Message} message 
 */
function request(url, message, reply)
{
  return fetch(url)
    .then(response => response.json())
    .catch(error =>
    {
      console.error(error);
      message.channel.send(reply);
    });
}

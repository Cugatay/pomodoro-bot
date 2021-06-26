import Discord from 'discord.js';
// import ChannelModel from '../models/ChannelModel';

const Ptbasla = (msg : Discord.Message) => {
  msg.reply('baslayalimm');
  // console.log('000000000000000');
  // console.log(msg.channel.id);
  // console.log(msg.author);
  // console.log('000000000000000');
  const denemeInterval = setInterval(() => {
    msg.reply('again?');
  }, 1000);

  setTimeout(() => {
    clearInterval(denemeInterval);
  }, 10000);
};

module.exports = Ptbasla;

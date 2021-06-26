/* eslint-disable no-console */
import Discord from 'discord.js';
import mongoose from 'mongoose';
// import moment from 'moment';
// import { clearInterval } from 'timers';

import ChannelModel from './models/ChannelModel';

// Functions
// const StartTimer = require('./functions/StartTimer');

const client = new Discord.Client();

require('dotenv').config();

// const PREFIX = '!pt';
const { TOKEN, PREFIX, MONGO_DB_URL } = process.env;

mongoose.connect(MONGO_DB_URL!, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}, (err) => {
  if (err) throw err;

  console.log('Mongoose connected successfully!');
});

client.on('ready', () => {
  console.info(`Giriş Yapıldı: ${client.user?.tag}`);
});

client.on('message', async (msg) => {
  if (msg.author.bot) return;
  if (msg.content.startsWith(PREFIX!)) {
    const [command] = msg.content /* , ...args */
      .trim()
      .substring(PREFIX!.length)
      .split(/\s+/);

    // const Interval = (channel: any) => {
    //   const interval = setInterval(() => {
    //     const timer = channel?.timers[channel.timers.length - 1];

    //     if (timer!.status.code === 'pomodoro') {
    //       timer!.pomodoroCount = timer!.pomodoroCount + 1;
    //     } else {
    //       timer!.breakCount = timer!.breakCount + 1;
    //     }

    //     timer!.status.code = timer!.status.code === 'pomodoro' ? 'break' : 'pomodoro';
    //     timer!.status.startedAt = new Date();

    //     channel?.save();
    //     msg.channel.send('Ara zamanı');

    //     setTimeout(() => {
    //       if (timer!.status.code === 'pomodoro') {
    //       timer!.pomodoroCount = timer!.pomodoroCount + 1;
    //       } else {
    //       timer!.breakCount = timer!.breakCount + 1;
    //       }

    //     timer!.status.code = timer!.status.code === 'pomodoro' ? 'break' : 'pomodoro';
    //     timer!.status.startedAt = new Date();

    //     channel?.save();
    //     msg.channel.send('Ders zamanı');
    //     }, 5000);
    //   }, 15000);

    //   const clear = () => clearInterval(interval);

    //   return { interval, clear };
    // };

    // ALL COMMANDS
    if (command === 'basla') { // StartTimer(msg);
      let channel = await ChannelModel.findOne({ channel_id: msg.channel.id });
      console.log(channel);

      const newTimer = {
        startedAt: new Date(),
        pauses: [],
        pomodoroCount: 0,
        breakCount: 0,
        status: {
          code: 'pomodoro',
          startedAt: new Date(),
        },
      };

      if (channel) {
        channel.timers.push(newTimer);

        await channel.save();
      }

      if (!channel) {
        const newChannel = new ChannelModel({
          channel_id: msg.channel.id,
          timers: [newTimer],
        });
        await newChannel.save();
        channel = newChannel;
      }

      // const deneme = await msg.channel.send('selam');
      msg.reply('okeyy');
      // (await deneme).edit('naber');
      // setTimeout(() => {
      // }, 1000);

      const inter = setInterval(async () => {
        const timer = channel?.timers[channel.timers.length - 1];

        const channelData = await ChannelModel.findOne({ channel_id: msg.channel.id });

        const isFinished = !!channelData?.timers[channelData.timers.length - 1].finishedAt;

        console.log(isFinished);
        if (isFinished) {
          clearInterval(inter);
        } else {
          if (timer!.status.code === 'pomodoro') {
          timer!.pomodoroCount = timer!.pomodoroCount + 1;
          } else {
          timer!.breakCount = timer!.breakCount + 1;
          }

        timer!.status.code = timer!.status.code === 'pomodoro' ? 'break' : 'pomodoro';
        timer!.status.startedAt = new Date();

        await channel?.save();
        msg.channel.send('Ara zamanı');

        setTimeout(async () => {
          const channelData = await ChannelModel.findOne({ channel_id: msg.channel.id });
          const isFinished = !!channelData?.timers[channelData.timers.length - 1].finishedAt;
          if (!isFinished) {
            if (timer!.status.code === 'pomodoro') {
            timer!.pomodoroCount = timer!.pomodoroCount + 1;
            } else {
            timer!.breakCount = timer!.breakCount + 1;
            }

            timer!.status.code = timer!.status.code === 'pomodoro' ? 'break' : 'pomodoro';
            timer!.status.startedAt = new Date();

            channel?.save();
            msg.channel.send('Ders zamanı');
          }
        }, 5000);
        }
      }, 15000);

      // setTimeout(async () => {
      //   const m = moment(newTimer.startedAt).add(25, 'minutes').locale('tr');
      //   const counter = await msg.channel.send(`${m.fromNow()} pomodoro bitecek`);

      //   const editInterval = setInterval(async () => {
      //     const channelData = await ChannelModel.findOne({ channel_id: msg.channel.id });

      //     const isFinished = !!channelData?.timers[channelData.timers.length - 1].finishedAt;

      //     if (!isFinished) {
      //       counter.edit(`${m.fromNow()} pomodoro bitecek`);
      //     } else {
      //       clearInterval(editInterval);
      //     }
      //   });
      // }, 5000);
    } else if (command === 'bitir') {
      const channel = await ChannelModel.findOne({ channel_id: msg.channel.id });
      const timer = channel?.timers[channel.timers.length - 1];
      timer!.finishedAt = new Date();
      channel?.save();
      // Interval(channel).clear();

      msg.reply('ok');
    }
  }
});

client.login(TOKEN);
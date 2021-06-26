/* eslint-disable no-use-before-define */
/* eslint-disable no-console */
import Discord from 'discord.js';
import moment from 'moment';
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

      // const takeLongBreak = () => {
      //   const longBreakInterval =  setTimeout(() => {

      //   }, 10000);
      // }

      // while (true) {
      // }

      const mainIntervalFunction = async () => {
        const timer = channel?.timers[channel.timers.length - 1];

        const channelData = await ChannelModel.findOne({ channel_id: msg.channel.id });

        const isFinished = !!channelData?.timers[channelData.timers.length - 1].finishedAt;

        if (isFinished) {
          channel = channelData;
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

        if (timer!.pomodoroCount % 4 === 0) {
          msg.channel.send('Uzun Ara zamanı');

          setTimeout(async () => {
            clearInterval(inter);
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
            // msg.channel.send('Ders zamanı');
            msg.channel.send(`${timer!.pomodoroCount + 1}. Pomodoroya Başlama Zamanı`);
            inter = setInterval(mainIntervalFunction, 15000);
            } else {
              channel = channelData;
            }
          }, 10000);
        } else {
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
            // msg.channel.send('Ders zamanı');
            msg.channel.send(`${timer!.pomodoroCount + 1}. Pomodoroya Başlama Zamanı`);
            }
          }, 5000);
        }
        }
      };
      let inter = setInterval(mainIntervalFunction, 15000);

      const counterMessage = await msg.channel.send('Pomodoro 25:00');
      let willFinish = moment(channel.timers[channel.timers.length - 1].status.startedAt).add(25, 'minutes').toDate().getTime();
      let mode = channel?.timers[channel.timers.length - 1].status.code;

      const counterInterval = setInterval(() => {
        const isFinished = !!channel?.timers[channel?.timers.length - 1].finishedAt;

        if (!isFinished) {
          if (mode !== channel?.timers[channel.timers.length - 1].status.code) {
            mode = channel?.timers[channel.timers.length - 1].status.code!;
            willFinish = moment(channel?.timers[channel?.timers.length - 1].status.startedAt).add(mode === 'pomodoro' ? 25 : 5, 'minutes').toDate().getTime();
          }
          const remaining = willFinish - Date.now();
          counterMessage.edit(`${mode} ${moment(remaining).minute()}:${moment(remaining).second()}`);
        } else {
          clearInterval(counterInterval);
        }
      }, 3000);
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

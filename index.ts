/* eslint-disable no-nested-ternary */
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

    // const studyTime = Number(args[0]) || 25;
    // console.log('sttime', studyTime);

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

      msg.reply('okeyy');

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
        const remainder = channel?.timers[channel.timers.length - 1].pomodoroCount! !== 0
        && channel?.timers[channel.timers.length - 1].pomodoroCount! % 4 === 0;
        console.log('remainder: ', remainder);
        console.log('pomodoro count: ', channel?.timers[channel.timers.length - 1].pomodoroCount);

        if (!isFinished) {
          if (mode !== channel?.timers[channel.timers.length - 1].status.code) {
            mode = channel?.timers[channel.timers.length - 1].status.code!;
            willFinish = moment(channel?.timers[channel?.timers.length - 1].status.startedAt).add(mode === 'pomodoro' ? 25 : remainder ? 15 : 5, 'minutes').toDate().getTime();
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

      msg.reply('ok');
    } else if (command === 'kalan') {
      const channel = await ChannelModel.findOne({ channel_id: msg.channel.id });

      if (!channel) {
        msg.reply('Henüz hiç pomodoro başlatılmamış. !ptbasla diyerek ilk pomodorona başlayabilirsin!');
        return;
      }

      const timer = channel?.timers[channel.timers.length - 1];
      if (!timer || timer.finishedAt) {
        msg.reply('Henüz başlatılmış bir pomodoro yok. !ptbasla diyerek yeni bir pomodoroya başlayabilirsin!');
        return;
      }

      const mode = timer.status.code;

      const remainder = timer.pomodoroCount! !== 0
      && channel?.timers[channel.timers.length - 1].pomodoroCount! % 4 === 0;

      const willFinish = moment(timer.status.startedAt).add(mode === 'pomodoro' ? 25 : remainder ? 15 : 5, 'minutes').toDate().getTime();
      const remaining = willFinish - Date.now();
      const m = moment(remaining);

      msg.reply(`${mode === 'pomodoro' ? "Pomodoro'nun" : 'Molanın'} bitmesine ${m.minute()} dakika ${m.second()} saniye var`);
    } else if (command === 'gecen') {
      const channel = await ChannelModel.findOne({ channel_id: msg.channel.id });

      if (!channel) {
        msg.reply('Henüz hiç pomodoro başlatılmamış. !ptbasla diyerek ilk pomodorona başlayabilirsin!');
        return;
      }

      const timer = channel?.timers[channel.timers.length - 1];
      if (!timer || timer.finishedAt) {
        msg.reply('Henüz başlatılmış bir pomodoro yok. !ptbasla diyerek yeni bir pomodoroya başlayabilirsin!');
        return;
      }

      const mode = timer.status.code;
      const elapsed = Date.now() - timer.status.startedAt.getTime();
      const m = moment(elapsed);

      msg.reply(`${mode === 'pomodoro' ? 'Pomodoro' : 'Mola'} başlayalı ${m.minute()} dakika ${m.second()} saniye geçmiş!`);
      // msg.reply(timer.startedAt.getTime());

      // const remainder = timer.pomodoroCount! !== 0
      // && channel?.timers[channel.timers.length - 1].pomodoroCount! % 4 === 0;
    }
  }
});

client.login(TOKEN);

/* eslint-disable max-len */
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

  console.info('Mongoose connected successfully!');
});

client.on('ready', () => {
  console.info(`Giriş Yapıldı: ${client.user?.tag}`);
});

client.on('message', async (msg) => {
  if (msg.author.bot) return;
  if (msg.content.startsWith(PREFIX!)) {
    const [command] = msg.content
      .trim()
      .substring(PREFIX!.length)
      .split(/\s+/);

    // ALL COMMANDS
    if (command === 'basla') {
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

      const counterMessage = await msg.channel.send('Pomodoro Başladı! `25:00`');
      let willFinish = moment(channel.timers[channel.timers.length - 1].status.startedAt).add(25, 'minutes').toDate().getTime();
      let mode = channel?.timers[channel.timers.length - 1].status.code;

      const counterInterval = setInterval(() => {
        const isFinished = !!channel?.timers[channel?.timers.length - 1].finishedAt;
        const remainder = channel?.timers[channel.timers.length - 1].pomodoroCount! !== 0
        && channel?.timers[channel.timers.length - 1].pomodoroCount! % 4 === 0;

        if (!isFinished) {
          if (mode !== channel?.timers[channel.timers.length - 1].status.code) {
            mode = channel?.timers[channel.timers.length - 1].status.code!;
            willFinish = moment(channel?.timers[channel?.timers.length - 1].status.startedAt).add(mode === 'pomodoro' ? 25 : remainder ? 15 : 5, 'minutes').toDate().getTime();
          }
          const remaining = willFinish - Date.now();
          counterMessage.edit(`${mode === 'pomodoro' ? 'Pomodoro Başladı!' : 'Mola Başladı!'} \`${moment(remaining).minute()}:${moment(remaining).second()}\``);
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
    } else if (command === 'duraklat') {
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
    } else if (command === 'yardim') {
      // \`!ptduraklat:\` Çalışan zamanlayıcıyı duraklat
      // \`!ptdevam:\` Duraklamış zamanlayıcıyı devam ettir
      // \`!ptstat:\` Bugün, bu hafta ve hatta bu ay ne kadar çalıştığını gör! Eğer devam eden bir zamanlayıcı varsa kaç saattir çalıştığını, kaç pomodoro bitirdiğini, ne kadar ara verdiğini görebilirsin!

      const embedMessage = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setAuthor('PT Bot', 'https://i.imgur.com/wSTFkRM.png')
        .setTitle('İşte Bütün Komutlar')
        .setDescription(`
\`!ptbasla :\`  Yeni bir sayaç başlat
\`!ptbitir :\`  Devam eden sayacı bitir
\`!ptkalan :\`  Kaç dakika kaldığına bak (Zaten otomatik olarak bunu bildiriyoruz)
\`!ptgecen :\`  Kaç dakika geçtiğine bak
\`!ptyardim:\`  Bence bunun ne olduğunu zaten biliyorsun :)
        `);
      msg.channel.send(embedMessage);
    } else if (command === 'stat') {
      const channel = await ChannelModel.findOne({ channel_id: msg.channel.id });

      if (!channel) {
        msg.channel.send('Henüz başlatılmış bir pomodoro yok. !ptbasla diyerek yeni bir pomodoroya başlayabilirsin!');
        return;
      }

      const lastTimer = channel.timers[channel.timers.length - 1];

      if (!lastTimer) {
        msg.channel.send('Henüz başlatılmış bir pomodoro yok. !ptbasla diyerek yeni bir pomodoroya başlayabilirsin!');
        return;
      }

      interface Times {
        day: number;
        week: number;
        month: number;
      }

      const pomodoroTime: Times = {
        day: 0,
        week: 0,
        month: 0,
      };
      const breakTime: Times = {
        day: 0,
        week: 0,
        month: 0,
      };

      const todayDate = new Date();
      for (let i = 0; i < channel.timers.length; i++) {
        const timer = channel.timers[i];

        const isToday = moment(timer.startedAt).isSame(todayDate, 'day');
        const isWeek = moment(timer.startedAt).isSame(todayDate, 'week');
        const isMonth = moment(timer.startedAt).isSame(todayDate, 'month');

        const ptime = timer.pomodoroCount * 25;
        const btime = ((timer.breakCount - Math.trunc(timer.breakCount / 4)) * 5) + (Math.trunc(timer.breakCount / 4)) * 15;

        if (isToday) {
          pomodoroTime.day += ptime;
          breakTime.day += btime;
        }
        if (isWeek) {
          pomodoroTime.week += ptime;
          breakTime.week += btime;
        }
        if (isMonth) {
          pomodoroTime.month += ptime;
          breakTime.month += btime;
        }
      }

      const todayStudy = lastTimer.finishedAt ? null : {
        pomodoroTime: lastTimer.pomodoroCount * 25,
        breakTime: ((lastTimer.breakCount - Math.trunc(lastTimer.breakCount / 4)) * 5) + (Math.trunc(lastTimer.breakCount / 4)) * 15,
      };

      msg.channel.send(`
${todayStudy ? todayStudy.pomodoroTime !== 0 ? `
**-** Şuan Hala Çalışıyorsun ve \`${lastTimer.pomodoroCount} Set Pomodoro\` Bitirdin!
      -> \`${todayStudy.pomodoroTime} Dakika\` Pomodoro Yaptın -- \`${lastTimer.pomodoroCount} Pomodoro\`
      -> \`${todayStudy.breakTime} Dakika\` Mola Verdin -- \`${lastTimer.breakCount} Mola\`
**-> Toplamda ${todayStudy.pomodoroTime + todayStudy.breakTime} Saattir Çalışıyorsun! <-**
` : `
**-** \`Şuan Hala Çalışıyorsun, İlk Pomodoronu Bitirince Ne Kadar Çalıştığını Buradan Görebileceksin! Böyle Devam!\`
` : ''}
${pomodoroTime.day ? `
**-** Bugün **${pomodoroTime.day + breakTime.day}** Saat Çalıştın
      -> \`${pomodoroTime.day}\` Saat pomodoro
      -> \`${breakTime.day}\` Saat mola
` : ''}
${pomodoroTime.week ? `
**-** Bu Hafta **${pomodoroTime.week + breakTime.week}** Saat Çalıştın
      -> \`${pomodoroTime.week}\` Saat pomodoro
      -> \`${breakTime.week}\` Saat mola
` : ''}
${pomodoroTime.month ? `
**-** Bu Ay **${pomodoroTime.month + breakTime.month}** Saat Çalıştın
      -> \`${pomodoroTime.month}\` Saat Pomodoro
      -> \`${breakTime.month}\` Saat Mola
` : ''}
      `);
    } else {
      msg.channel.send('Yanlış bir komut girdin. Eğer kaybolmuş hissediyorsan `!ptyardim` yazarak yardım alabilirsin!');
    }
  }
});

client.login(TOKEN);

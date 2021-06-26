/* eslint-disable camelcase */
import { Schema, model } from 'mongoose';

interface Pause {
    pausedAt?: Date;
    startedAt?: Date;
}

interface Timer {
    startedAt: Date;
    pauses: never[] | [Pause];
    finishedAt?: Date;

    pomodoroCount: number;
    breakCount: number;
    status: {
        code: string;
        startedAt: Date;
    };
}

interface Channel {
    channel_id: string;
    timers: Timer[]
}

const ChannelSchema = new Schema<Channel>({
  channel_id: String,
  timers: [
    {
      startedAt: Date,
      pauses: [
        {
          pausedAt: Date,
          continuedAt: Date,
        },
      ],
      finishedAt: Date,

      pomodoroCount: Number,
      breakCount: Number,
      status: {
        code: String,
        startedAt: Date,
      },
    },
  ],
});

const ChannelModel = model<Channel>('Channel', ChannelSchema);

export default ChannelModel;

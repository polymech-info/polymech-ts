import { FfprobeData } from 'fluent-ffmpeg'

const FfmpegCommand = require('fluent-ffmpeg')

export const meta = async (src: string): Promise<FfprobeData> => {
    return new Promise((resolve, reject) => {
      const ff = new FfmpegCommand(src)
      ff.ffprobe(src, (err, metadata) => {
        if (err) {
          //logger.error('Error retrieving metadata:', err)
          reject(err);
        } else {
          //logger.info('Successfully retrieved metadata.');
          resolve(metadata)
        }
      })
    })
  }
"use strict";

var crypto = require('crypto')
,path = require('path')
;

class VideoFile {
  constructor(ffmpegRawInfo) {
    var values = ffmpegRawInfo.split('\n');
    var reg = new RegExp('^(.*)=(.*)$','i');
    var prefix = '';

    for(var i = 0; i < values.length; ++i) {
      if (values[i] == '[STREAM]' && prefix != 'video_') {
        prefix = 'video_'
      } else if (values[i] == '[STREAM]' && prefix != 'audio_') {
        prefix = 'audio_'
      } else if (values[i] == '[FORMAT]') {
        prefix = ''
      }
      var pair = reg.exec(values[i])
      if (pair === null || pair.length < 3) continue;
      this[prefix + pair[1].replace(':','_')] = pair[2];
    }
    var filename  = path.basename(this.filename);
    var sha1 = crypto.createHash('sha1');
    sha1.update(filename + '-' + this.size + '-' + this.bit_rate + '-' + this.duration);

    this.id = sha1.digest('hex');
    this.path2thumbs =  '/tmp/' + this.id;
    this.name = path.basename(filename, path.extname(filename));
    this.outputfilename = this.name + '-' + this.id;

  }
}


exports = module.exports

exports.createVideoFile = function(ffmpegRawInfo) {
  return new VideoFile(ffmpegRawInfo);
}

"use strict";

const EventEmitter = require('events');

var cp = require('child_process')
  ,spawn = cp.spawn
  ,fs = require('fs')
  ,path = require('path')
  ,videofile = require('./videofile')
  ,colour = require('colour')
;


class FFMPEG {

  static writeInformation(video, target, callback) {
    target = path.normalize(target);
    var json = JSON.stringify(video, null , 2);

    fs.writeFile(target, json, function(err) {
      if (err) return;
      console.log(('Information saved at ' + target).white);
      callback();
    });
  }

  static readVideo(file, callback) {
    console.log(('Reading: ' + file).white);

    function stats(file, clbkStats) {
      var ffmpeg_info = spawn('ffprobe', [ '-i' , file,  '-show_format', '-show_streams',  '-hide_banner']);
      var result = '';
      var errorOutput = '';

      ffmpeg_info.stdout.on('data', function(data) {
        result += data.toString();
      });

      ffmpeg_info.stderr.on('data', function(data) {
        errorOutput += data.toString();
      });

      ffmpeg_info.on('close', function(code) {
        if(code == 0) {
          clbkStats(result);
        } else {
          console.log(errorOutput.red);
          clbkStats();
        }

      });
    }

    stats(file, function(rawInfo) {
      console.log(('End reading ' + file).white);
      callback(rawInfo ? videofile.createVideoFile(rawInfo) : null);
    });
  }

  static thumbnailize(video, amountOfPictures, onEnd) {
    console.log(('Thumbnailize: ' + video.filename).white);

    function createThumb(video, path2tmp, amountOfPictures, onEnd) {
      var dt = (new Date()).getTime();
      var duration = Math.ceil(video.duration * 1);
      var step = Math.ceil((duration - 4) / (amountOfPictures));
      //var select1 = 'select=\'not(mod(n,100))\',scale=320:-1' //,fps=1/' + step
      var select = 'select=\'eq(pict_type,PICT_TYPE_I)\',scale=320:-1,fps=1/' + step
      var thumbnailizer = spawn('ffmpeg', [ '-ss', '00:00:02' , '-i' , video.filename, '-vf', select, video.path2thumbs + '/img%03d.jpg']);
      var result = '';
      thumbnailizer.stdout.on('data', function(data) {
        console.log(data.toString().red);
      });
      thumbnailizer.stderr.on('data', function(data) {
        //console.log('stderr: ' + data);
      });
      thumbnailizer.on('close', function(code) {
        var elapsed = ( (new Date()).getTime() - dt ) / 1000
        console.log(('Thumbnailized in ' + elapsed + 's').white);
        onEnd();
      });
    }

    fs.access(video.path2thumbs, fs.F_OK, function (err) {
      if (err) {
        fs.mkdir(video.path2thumbs, function(){
          createThumb(video, video.path2thumbs, amountOfPictures, onEnd);
        });
      } else {
        createThumb(video, video.path2thumbs, amountOfPictures, onEnd);
      }
    })
  }
}

exports = module.exports = FFMPEG

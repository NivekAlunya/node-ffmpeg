"use strict";

const EventEmitter = require('events');

var ffmpeg = require('./nodeffmpeg')
,videocaps = require('./videocaps')
,myutils = require('kl-utils')
;
class TaskVideoFile extends EventEmitter {

  constructor(options) {
    super();
    this.options = options
    this.tasks = [];

    var thumbnailize = function(video) {

      ffmpeg.thumbnailize(video
        , this.options.numberOfCols * this.options.numberOfRows
        , function() {
          this.next(video);
        }.bind(this)
      );

    }.bind(this)

    var cap = function(video) {
      var _this = this;

      myutils.getFilesFromDirectory(video.path2thumbs, null, function(err, files) {

        if (err) {
          console.log('SKIP ' + video.path2thumbs);
          _this.emit('stop');
          return;
        }

        var vc = videocaps.createVideoCaps(files, video.path2thumbs
          , _this.options.numberOfCols, _this.options.numberOfRows);
        vc.on('save', function() {
          vc.deleteTemporaryFiles();
        })
        vc.on('clean', function(){
          _this.next(video);
        });
        vc.on('make', function() {
          vc.save(_this.options.outputDirectory + '/' + video.outputfilename + '.jpg');
        });
        vc.make();

      });

    }.bind(this)

    var write = function(video) {
      var path2file = this.options.outputDirectory + '/' + video.outputfilename + '.json';
      ffmpeg.writeInformation(video, path2file, function() {
        this.next(video);
      }.bind(this));
    }.bind(this);

    this.callstack = [];

    if (this.options.booWriteInformation) this.callstack.push(write);
    if (this.options.booExtractImage) this.callstack.push(thumbnailize);
    if (this.options.booBuildVideocap) this.callstack.push(cap);
    this.callstackpointer = 0;
  }

  execute(file) {

    var overwrite = this.options.force;
    var outputDirectory = this.options.outputDirectory;

    this.callstackpointer = 0;
    this.emit('start');

    ffmpeg.readVideo(file, function(video) {

      if (video == null) {
        return;
      }
      if (!overwrite) {

        var videofile = outputDirectory + '/' + video.outputfilename + '.jpg';
        var jsonfile = outputDirectory + '/' + video.outputfilename + '.json';

        myutils.filesExist([videofile, jsonfile], function(exists, notExists) {
          if (notExists.length > 0) {
            this.next(video);
          } else {
            console.log('Skipping ' + video.filename);
            this.emit('stop');
          }
        }.bind(this));

      } else {
        this.next(video);
      }

    }.bind(this));

  }

  next(video) {
    if (this.callstackpointer >= this.callstack.length) {
      this.emit('stop');
      return;
    }
    this.callstack[this.callstackpointer](video);
    ++this.callstackpointer;
  }
}

exports = module.exports = {
  createTaskVideoFile: function(options) {
    return new TaskVideoFile(options);
  }
}

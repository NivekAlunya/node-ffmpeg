"use strict";

const EventEmitter = require('events');

var fs = require('fs')
, Canvas = require('canvas')
, Image = Canvas.Image
,cp = require('child_process')
,spawn = cp.spawn
,path = require('path')
,myutils = require('kl-utils')
;

class VideoCaps extends EventEmitter {

  constructor(files, col, row, path2thumbs) {
    super();
    this.files = files;
    this.row = row;
    this.col = col;
    this.path2thumbs = path2thumbs;
    this.output = this.path2thumbs + '/out.jpg';
  }

  save(target) {
    var _this = this;
    target = path.normalize(target);
    var mv = spawn('mv', [this.output, target]);
    mv.stdout.on('data', function(data){
      console.log(data);
    });
    mv.stderr.on('data', function(data){
      console.log(data.toString());
    });

    mv.on('close', function(code){
      if (code > 0) {
        this.emit('error');
        return;
      }
      console.log('Saved to ' + target);
      _this.emit('save');
    });
  }

  deleteTemporaryFiles() {
    var _this = this;
    fs.readdir(this.path2thumbs, function(err, files) {
      function deleteFile() {
        var file = _this.path2thumbs + '/' + files.shift();
        fs.unlink(file, function(err) {
          if(err) {
            console.log(err);
            return;
          }
          if (files.length > 0) {
            deleteFile();
            return;
          }
          deleteRoot();
        });
      }
      function deleteRoot() {
        fs.rmdir(_this.path2thumbs, function(err){
          if(err) {
            console.log(err);
            _this.emit('error');
            return;
          }
          _this.emit('clean');
        });
      }
      deleteFile();
    });
  }

  make() {
    var _files = this.files.copy();
    var canvas = null, ctx = null;
    var count = 0;
    var _this = this;
    function save() {
      if (canvas !== null) {
        var out = fs.createWriteStream(_this.output)
          , stream = canvas.jpegStream({
            bufsize: 4096 // output buffer size in bytes, default: 4096
          , quality: 90 // JPEG quality (0-100) default: 75
          , progressive: true // true for progressive compression, default: false
        });

        stream.on('data', function(chunk){
          out.write(chunk);
        });

        stream.on('end', function(){
          console.log('saved jpg');
          _this.emit('make');
        });
      }
    }
    function processFile(file, onFileProcessed) {
      fs.readFile(file, function(err, data) {
        if (err) throw err;

        var spacing = 4;
        if (err) throw err;
        var img = new Image;
        img.dataMode = Image.MODE_IMAGE; // Only image data tracked
        img.src = data;
        if (canvas === null) {
          canvas = new Canvas((img.width + spacing) * _this.col + spacing, (img.height + spacing) * _this.row + spacing, 'jpg');
          ctx = canvas.getContext('2d');
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        var x = (img.width + spacing) * (count % _this.col);
        var y = (img.height + spacing) * Math.floor(count / _this.col);
        ctx.drawImage(img, x + spacing , y + spacing, img.width, img.height);
        ++count;

        onFileProcessed();
      });
    }

    function build() {
      if (_files.length < 1) {
        //save file
        save();
        return;
      }
      var file = _files.shift();
      processFile(file, function(){
        build();
      });
    }
    build();
  }
}

module.exports = {
  createVideoCaps: function(files, path2thumbs, col, row) {
    return new VideoCaps(files, col, row, path2thumbs)
  }
}

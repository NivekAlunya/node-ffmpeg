"use strict";

const EventEmitter = require('events');

var taskVideoFile = require('./taskvideofile');

class BatchFiles extends EventEmitter {
  /**
  * files - Array
  * options - {}
  **/
  constructor(files, options) {
    super();
    this.files = files;
    this.options = options;
    this.task = taskVideoFile.createTaskVideoFile(options);
    this.file = null;
  }

  start() {
    this.emit('start');
    var processed = 0;
    var nb2process = this.files.length ;
    function processTask() {
      if (this.files.length <= 0) {
        this.emit('stop');
        return;
      }
      this.file = this.files.shift();
      this.task.execute(this.file);
    };

    this.task.on('start', function() {
      console.log('----------------------------');
      console.log('Start task [' + (++processed) + '/' + nb2process + '] for ' + this.file);
    }.bind(this));

    this.task.on('stop', function() {
      console.log('-End task for ' + this.file);
      console.log();
      processTask.bind(this)();
    }.bind(this));

    processTask.bind(this)();
  }
}

exports = module.exports = {
  createBatch: function(files, options) {
    return new BatchFiles(files, options);
  }
};

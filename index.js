var program = require('commander')
,batch = require('./batchfiles')
,myutils = require('kl-utils')
;

program
.usage('[options] <file ...>')
.option('-d --directory <name>', 'Directory')
.option('-o --output-directory <name>', 'Output Directory')
.option('-e --extract-image', 'Extracting picture from video file')
.option('-b --build-videocaps', 'Building videocaps from picture')
.option('-i --information-file', 'Writing file for information')
.option('-f --force', 'Overwreite file')
.option('-r --rows <value>', 'Number of columns for videocaps')
.option('-c --cols <value>', 'Number of rows for videocaps')
.parse(process.argv);


if (program.rawArgs.length < 3) program.help();

if (program.args.length > 0) {
  launch(program.args.copy());

} else if (program.directory && program.directory.length > 0) {
  myutils.getFilesFromDirectory(program.directory, null, function(err, files) {
    if (err) { console.log(err); return; }
    launch(files);
  });
} else {
  return;
}


function launch(files) {
console.log(files);
  var options = {
    outputDirectory: program.outputDirectory,
    booWriteInformation: program.informationFile,
    booExtractImage: program.extractImage,
    booBuildVideocap: program.buildVideocaps,
    numberOfRows: program.rows,
    numberOfCols: program.cols,
    overwrite: program.force,
  };
  var myBatch = batch.createBatch(files, options);
  var dt;
  myBatch.on('start', function(){
    console.log('start...');
    dt = (new Date()).getTime();
  });

  myBatch.on('stop', function(){
    console.log('stop...');
    var elapsed =  ((new Date()).getTime() - dt) / 1000;
    console.log('Batch processed in ' + elapsed + 's');
  });

  myBatch.on('error', function(err){

  });

  myBatch.start();
}

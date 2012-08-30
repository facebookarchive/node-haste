/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
var inherits = require('util').inherits;
var childProcess = require('child_process');
var fs = require('fs');

var ResourceLoader = require('./ResourceLoader');
var ImageResource = require('../resource/Image');


/**
 * @class Loads and parses __mocks__ / *.js files
 *
 * @extends {ResourceLoader}
 */
function ImageLoader(options) {
  this.options = options = options || {};
  this.identifyPath = options.identifyPath || 'identify';
  this.maxIdentifyThreads = options.maxIdentifyThreads || 1;
  this.networkSize = options.networkSize;
}
inherits(ImageLoader, ResourceLoader);


ImageLoader.prototype.getResourceTypes = function() {
  return [ImageResource];
};

ImageLoader.prototype.getExtensions = function() {
  return ['.jpg', '.png', '.gif'];
};


/**
 * Creates a new resource for a given path.
 *
 * @protected
 * @param {String}               path      resource being built
 * @param {ProjectConfiguration} configuration configuration for the path
 * @param {Function}             callback
 */
ImageLoader.prototype.loadFromPath =
  function(path, configuration, callback) {

  var image = new ImageResource(path);
  image.id = path;
  if (this.networkSize) {
    fs.readFile(path, function(err, buffer) {
      image.networkSize = buffer.length;
      callback(null, image);
    });
  } else {
    process.nextTick(function() {
      callback(null, image);
    });
  }
};

var lineRe = /^r:(\S+) (\d+)x(\d+)/;
// Parsing images one by one using GraphicsMagick is super slow (minutes)
// Wait till the end of processing and batch parse them together in a single
// identify call
ImageLoader.prototype.postProcess = function(map, resources, callback) {
  var pathMap = {};
  var paths = [];
  var buckets = resources.length > 30 ? this.maxIdentifyThreads : 1;
  for (var i = 0; i < buckets; i++) {
    paths[i] = [];
  }
  resources.forEach(function(r, i) {
    paths[i % buckets].push(r.path);
    pathMap[r.path] = r;
  });

  var waiting = buckets;
  paths.forEach(function(bucket) {
    var child = childProcess.exec(
      this.identifyPath + '  -format "r:%i %wx%h\n" `cat`');
    var lines = '';
    child.stdout.setEncoding('utf-8');
    child.stdout.on('data', function(d) {
      lines += d;
    });
    child.on('exit', function() {
      lines.split('\n').forEach(function(line) {
        var match = line.match(lineRe);
        if (match) {
          pathMap[match[1]].width = match[2]*1;
          pathMap[match[1]].height = match[3]*1;
        }
      });
      if (--waiting === 0) {
        callback();
      }
    });
    child.stdin.end(bucket.join(' '), 'utf-8');
  }, this);
};

var re = /\.(jpg|gif|png)$/;
/**
 * Only match __mocks__ / *.js files
 * @static
 * @param  {String} filePath
 * @return {Bollean}
 */
ImageLoader.prototype.matchPath = function(filePath) {
  return re.test(filePath);
};


module.exports = ImageLoader;

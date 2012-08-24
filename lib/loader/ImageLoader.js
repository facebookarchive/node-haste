/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
var inherits = require('util').inherits;
var childProcess = require('child_process');

var ResourceLoader = require('./ResourceLoader');
var Image = require('../resource/Image');


/**
 * @class Loads and parses __mocks__ / *.js files
 *
 * @extends {ResourceLoader}
 */
function ImageLoader(options) {
  this.options = options = options || {};
  this.identifyPath = options.identifyPath || 'identify';
  this.maxThreads = options.maxThreads || 8;
}
inherits(ImageLoader, ResourceLoader);


ImageLoader.prototype.getResourceTypes = function() {
  return [Image];
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

  var image = new Image(path);
  image.id = path;
  process.nextTick(function() {
    callback(image);
  });
};

var lineRe = /^r:(\S+) (\d+)x(\d+)/;
// Parsing images one by one using GraphicsMagick is super slow (minutes)
// Wait till the end of processing and batch parse them together in a single
// identify call
ImageLoader.prototype.postProcess = function(map, resources, callback) {
  var map = {};
  var paths = [];
  var buckets = resources.length > 30 ? this.maxThreads : 1;
  for (var i = 0; i < buckets; i++) {
    paths[i] = [];
  }
  resources.forEach(function(r, i) {
    paths[i % buckets].push(r.path);
    map[r.path] = r;
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
          map[match[1]].width = match[2]*1;
          map[match[1]].height = match[3]*1;
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

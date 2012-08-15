/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
/*jslint proto:true*/

var inherits = require('util').inherits;
var path = require('path');
var Resource = require('./Resource');
var childProcess = require('child_process');


/**
 * Resource for *.png, *.jpg, *.gif files
 * @extends {Resource}
 * @class
 * @param {String} path path of the resource
 */
function Image(path) {
  this.path = path;
  this.id = null;
  this.width = 0;
  this.height = 0;
}
inherits(Image, Resource);
Image.__proto__ = Resource;

Image.prototype.type = 'Image';
Image.prototype.version = '0.1';


var re = /\.(jpg|gif|png)$/;
/**
 * Only match *.js files
 * @static
 * @param  {String} filePath
 * @return {Bollean}
 */
Image.matchPath = function(filePath) {
  return re.test(filePath);
};

/**
 * node.js does not have inbuilt image library
 * To extract image sizes node-haste need graphicsmagick installed. Specify
 * Image.identifyPath to use custom path for identify command
 * @type {String}
 */
Image.identifyPath = 'identify';
Image.postProcessMaxThreads = 8;
var lineRe = /^r:(\S+) (\d+)x(\d+)$/;

// Parsing images one by one using GraphicsMagick is super slow (minutes)
// Wait till the end of processing and batch parse them together in a single
// gm call
Image.postProcess = function(resources, callback) {
  var map = {};
  var paths = [];
  var buckets = resources.length > 30 ? Image.postProcessMaxThreads : 1;
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
      Image.identifyPath + '  -format "r:%i %wx%h\n" `cat`');
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
  });
};

/**
 * Creates a new resource for a given path
 *
 * @static
 * @param  {ProjectConfiguration} configuration
 * @param  {String}   path
 * @param  {Function} callback
 */
Image.loadFromPath = function(configuration, path, callback) {
  var image = new Image(path);
  image.id = path;
  process.nextTick(function() {
    callback(image);
  });
};


module.exports = Image;

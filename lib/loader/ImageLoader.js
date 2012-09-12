/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
var inherits = require('util').inherits;
var childProcess = require('child_process');
var fs = require('fs');

var ResourceLoader = require('./ResourceLoader');
var ImageResource = require('../resource/Image');
var MessageList = require('../MessageList');
var getImageSize = require('../parse/getImageSize');


/**
 * @class Loads and parses __mocks__ / *.js files
 *
 * @extends {ResourceLoader}
 */
function ImageLoader(options) {
  this.options = options = options || {};
}
inherits(ImageLoader, ResourceLoader);
ImageLoader.prototype.path = __filename;

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
  var messages = MessageList.create();
  image.id = path;
  fs.readFile(path, function(err, buffer) {
    image.networkSize = buffer.length;
    var size = getImageSize(buffer);
    if (size) {
      image.width = size.width;
      image.height = size.height;
    }
    callback(messages, image);
  });
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

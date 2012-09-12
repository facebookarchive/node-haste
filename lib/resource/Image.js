/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
/*jslint proto:true*/

var inherits = require('util').inherits;
var Resource = require('./Resource');


/**
 * Resource for *.png, *.jpg, *.gif files
 * @extends {Resource}
 * @class
 * @param {String} path path of the resource
 */
function Image(path) {
  this.path = path;
  this.id = null;
}
inherits(Image, Resource);
Image.__proto__ = Resource;

Image.prototype.width = 0;
Image.prototype.height = 0;
Image.prototype.type = 'Image';
Image.prototype.version = '0.1';

Image.fromObject = function(obj) {
  var image = new Image(obj.path);
  image.path = obj.path;
  image.width = obj.width || 0;
  image.height = obj.height || 0;
  image.mtime = obj.mtime;
  return image;
};

Image.prototype.toObject = function() {
  var obj = {
    path: this.path,
    id: this.id,
    type: this.type,
    mtime: this.mtime
  };
  if (this.width) {
    obj.width = this.width;
  }
  if (this.height) {
    obj.height = this.height;
  }
  return obj;
};


module.exports = Image;

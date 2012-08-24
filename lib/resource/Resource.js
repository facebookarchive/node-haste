/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
/*jslint proto:true*/

var inherits = require('util').inherits;

/**
 * Base class for all Resource types
 * Resource is a value object that holds the information about a particular
 * resource. See properties.
 *
 * @abstract
 * @class
 * @param {String} path path of the resource
 */
function Resource(path) {
  this.path = path;
  this.id = path;
}

Resource.prototype.mtime = 0;
Resource.prototype.type = 'Resource';

/**
 * Converts Resource to serializable object
 * @return {Object}
 */
Resource.prototype.toObject = function() {
  var object = {};
  for (var i in this) {
    if (this.hasOwnProperty(i)) {
      object[i] = this[i];
    }
  }
  return object;
};

/**
 * Creates a new resource from object
 * @static
 * @param  {Object} object
 * @return {Resource}
 */
Resource.fromObject = function(object) {
  var type = this;
  var instance = new type(object.path);
  for (var i in object) {
    instance[i] = object[i];
  }
  return instance;
};


module.exports = Resource;

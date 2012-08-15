/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
/*jslint proto:true*/

var inherits = require('util').inherits;
var fs = require('fs');

/**
 * Base class for all Resource types
 * Resource has 2 parts:
 * - Resource instance. It's a value object that holds the information about
 *   a particular resource. See properties.
 * - Resource loader for the given type of Resource. See loadFromPath,
 *   updateFromPath, fromObject, etc
 *
 * Parts can be separated for more complex cases. Currently for simplicity
 * reasons the class object is used as a loader
 *
 * as a loader now
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
Resource.prototype.version = '0.1';

/**
 * Converts Resource to serializable object
 * @return {Object}
 */
Resource.prototype.toObject = function() {
  var object = {};
  for (var i in this) {
    object[i] = this[i];
  }
  return object;
};

/**
 * Creates a new resource for a given path. Can be overridden in a sublcass
 * to perform different loading
 *
 * @static
 * @param  {ProjectConfiguration} configuration
 * @param  {String}   path
 * @param  {Function} callback
 */
Resource.loadFromPath = function(configuration, path, callback) {
  var Klass = this;
  fs.readFile(path, 'utf-8', function(err, sourceCode) {
    var resource = new Klass(path);
    Klass.initFromSource(resource, configuration, sourceCode || '', callback);
  });
};

Resource.initFromSource = function(r, configuration, sourceCode, callback) {
  setTimeout(function() {
    callback(r);
  }, 10);
};

/**
 * Creates a new resource for a given path. Gets an old version of the same
 * resource as a parameter. Old resource can be used to optimize the operation.
 * Can just return the old resource if nothing changed.
 * By default just loads the new the resource.
 *
 * @static
 * @param  {ProjectConfiguration} configuration
 * @param  {String}   path
 * @param  {Resource} oldResource
 * @param  {Function} callback
 */
Resource.updateFromPath = function(configuration, path, oldResource, callback) {
  this.loadFromPath(configuration, path, callback);
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

/**
 * Checks if resource can parse the given path. Map builder will match
 * all available resource types to find the one that can parse the given path
 * Base resource always returns true, since it can potentially parse any file,
 * though without much value
 * @static
 *
 * @param  {String} path
 * @return {Boolean}
 */
Resource.matchPath = function(path) {
  return true;
};


module.exports = Resource;

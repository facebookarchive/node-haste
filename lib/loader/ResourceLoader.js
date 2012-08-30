/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
var fs = require('fs');
var Resource = require('../resource/Resource');
var MessageList = require('../MessageList');

/**
 * @class Base ResourceLoader. ResourceLoader works together with
 * MapUpdateTask to analyze different resource type. Each loader type can load
 * one or more resource types. Each loader can accept a number of options
 * to configure loading process. By default loader will read the file's code
 * and parse it to extract useful information.
 */
function ResourceLoader() {}

ResourceLoader.prototype.getResourceTypes = function() {
  return [Resource];
};

ResourceLoader.prototype.getExtensions = function() {
  return [];
};

/**
 * Creates a new resource for a given path. Can be overridden in a sublcass
 * to perform different loading
 *
 * @static
 * @param  {String}   path
 * @param  {ProjectConfiguration} configuration
 * @param  {Function} callback
 */
ResourceLoader.prototype.loadFromPath =
  function(path, configuration, callback) {
  var me = this;
  var messages = MessageList.create();
  fs.readFile(path, 'utf-8', function(err, sourceCode) {
    if (err) {
      messages.addClowntownError(this.path, 'resource', err.toString());
      callback(messages, null);
    } else {
      me.loadFromSource(
        path,
        configuration,
        sourceCode || '',
        messages,
        callback);
    }
  });
};

/**
 * Initialize a resource with the source code and configuration
 * Loader can parse, gzip, minify the source code to build the resulting
 * Resource value object
 *
 * @protected
 * @param {String}               path      resource being built
 * @param {ProjectConfiguration} configuration configuration for the path
 * @param {String}               sourceCode
 * @param {MessageList}          messages
 * @param {Function}             callback
 */
ResourceLoader.prototype.loadFromSource =
  function(path, configuration, sourceCode, messages, callback) {
  var resource = new Resource(path);
  process.nextTick(function() { callback(messages, resource); }, 10);
};

/**
 * Creates a new resource for a given path. Gets an old version of the same
 * resource as a parameter. Old resource can be used to optimize the operation.
 * Can just return the old resource if nothing changed.
 * By default just loads the new the resource.
 *
 * @param  {ProjectConfiguration} configuration
 * @param  {String}   path
 * @param  {Resource} oldResource
 * @param  {Function} callback
 */
ResourceLoader.prototype.updateFromPath =
  function(path, configuration, oldResource, callback) {
  this.loadFromPath(path, configuration, callback);
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
ResourceLoader.prototype.matchPath = function(path) {
  return true;
};

/**
 * Post process is called after the map is updated but before the update
 * task is complete.
 * Can be used to resolve dependencies or to bulk process all loaded resources
 * @param  {ResourceMap}      map
 * @param  {Array.<Resource>} resources
 * @param  {Function}         callback
 */
ResourceLoader.prototype.postProcess = function(map, resources, callback) {
  process.nextTick(function() {
    callback(MessageList.create());
  });
};


module.exports = ResourceLoader;

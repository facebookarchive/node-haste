/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
/*jslint proto:true*/

var inherits = require('util').inherits;
var path = require('path');
var fs = require('fs');

var Resource = require('./Resource');

/**
 * Resource for package.json files
 * @extends {Resource}
 * @class
 * @param {String} path path of the resource
 * @param {Object} data source code of the resource
 */
function ProjectConfiguration(path, data) {
  this.path = path;
  this.id = path;
  this.data = data;
}
inherits(ProjectConfiguration, Resource);
ProjectConfiguration.__proto__ = Resource;

ProjectConfiguration.prototype.type = 'ProjectConfiguration';
ProjectConfiguration.prototype.version = '0.1';

/**
 * Returns haste specific prefix
 * @return {String}
 */
ProjectConfiguration.prototype.getHastePrefix = function() {
  return this.data.haste && this.data.haste.prefix ||
    path.basename(path.dirname(this.path));
};

/**
 * Returns all directories affected by this package
 * @return {Array.<String>}
 */
ProjectConfiguration.prototype.getHasteDirectories = function() {
  var dirname = path.dirname(this.path);
  if (this.data.haste && this.data.haste.directories) {
    return this.data.haste.directories.map(path.join.bind(this, dirname));
  }
  return [dirname];
};


/**
 * Resolved id from the filePath
 * @param  {String} filePath
 * @return {String|null}
 */
ProjectConfiguration.prototype.resolveID = function(filePath) {
  var hasteDirectories = this.getHasteDirectories();
  var prefix = this.getHastePrefix();
  if (filePath.lastIndexOf('.js') === filePath.length - 3) {
    filePath = filePath.substr(0, filePath.length - 3);
  }

  for (var i = 0; i < hasteDirectories.length; i++) {
    if (filePath.indexOf(hasteDirectories[i] + '/') === 0) {
      var result = path.relative(hasteDirectories[i], filePath);
      if (prefix) {
        result = path.join(prefix, result);
      }
      return result;
    }
  }

  return null;
};

/**
 * Resolves require relative to current path. Actually checks if the file
 * exists to detemine how to resolve a local path
 *
 * @param  {String}   required id of required module
 * @param  {String}   current  path to requiring module
 * @param  {Function} callback
 * @return {String}            resolved path
 */
ProjectConfiguration.prototype.resolveRequire =
  function(required, current, callback) {
  var filePath = path.join(path.dirname(current), required);
  var me = this;

  path.exists(filePath + '.js', function(result) {
    if (result) {
      callback(me.resolveID(filePath) || required);
    } else {
      filePath += '/index';
      path.exists(filePath + '.js', function(result) {
        if (result) {
          callback(me.resolveID(filePath) || required);
        } else {
          callback(required);
        }
      });
    }
  });
};

/**
 * Resolves a list of requires relative to current path.
 *
 * @param  {Array.<String>}   required id of required module
 * @param  {String}   current  path to requiring module
 * @param  {Function} callback
 * @return {String}            resolved path
 */
ProjectConfiguration.prototype.resolveRequires =
  function(required, current, callback) {

  var result = [];
  if (!required.length) {
    callback(result);
    return;
  }

  var waiting = 0;
  function resolvedCallback(resolved) {
    result.push(resolved);
    if (--waiting === 0) {
      callback(result);
    }
  }

  required.forEach(function(r) {
    waiting++;
    this.resolveRequire(r, current, resolvedCallback);
  }, this);
};


/**
 * Only match package.json files
 * @static
 * @param  {String} filePath
 * @return {Bollean}
 */
ProjectConfiguration.matchPath = function(filePath) {
  return filePath.lastIndexOf('package.json') === filePath.length - 12;
};

/**
 * Creates a new resource for a given path
 *
 * @static
 * @param  {ProjectConfiguration} configuration
 * @param  {String}   path
 * @param  {Function} callback
 */
ProjectConfiguration.loadFromPath = function(configuration, path, callback) {
  fs.readFile(path, 'utf-8', function(err, sourceCode) {
    callback(new ProjectConfiguration(path, JSON.parse(sourceCode)));
  });
};


module.exports = ProjectConfiguration;

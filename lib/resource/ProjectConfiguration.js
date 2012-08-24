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

/**
 * Returns haste specific prefix
 * @return {String}
 */
ProjectConfiguration.prototype.getHastePrefix = function() {
  return this.data.haste && this.data.haste.prefix ||
    path.basename(path.dirname(this.path));
};

/**
 * Returns all roots affected by this package
 * @return {Array.<String>}
 */
ProjectConfiguration.prototype.getHasteRoots = function() {
  var dirname = path.dirname(this.path);
  if (this.data.haste && this.data.haste.roots) {
    return this.data.haste.roots.map(path.join.bind(this, dirname));
  }
  return [dirname];
};

/**
 * Resolved id from the filePath
 * @param  {String} filePath
 * @return {String|null}
 */
ProjectConfiguration.prototype.resolveID = function(filePath) {
  var hasteDirectories = this.getHasteRoots();
  var prefix = this.getHastePrefix();
  if (path.basename(filePath, '.js') === 'index') {
    filePath = path.dirname(filePath);
  } else if (filePath.lastIndexOf('.js') === filePath.length - 3) {
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

module.exports = ProjectConfiguration;

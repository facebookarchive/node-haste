/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
var inherits = require('util').inherits;

var ResourceLoader = require('./ResourceLoader');
var ProjectConfiguration = require('../resource/ProjectConfiguration');


/**
 * @class Loads and parses package.json files
 *
 * @extends {ResourceLoader}
 */
function ProjectConfigurationLoader() {}
inherits(ProjectConfigurationLoader, ResourceLoader);


ProjectConfigurationLoader.prototype.isConfiguration = true;


ProjectConfigurationLoader.prototype.getResourceTypes = function() {
  return [ProjectConfiguration];
};

ProjectConfigurationLoader.prototype.getExtensions = function() {
  return ['.json'];
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
 * @param {Function}             callback
 */
ProjectConfigurationLoader.prototype.loadFromSource =
  function(path, configuration, sourceCode, messages, callback) {
    var config = new ProjectConfiguration(path);
    config.id = path;
    config.data = JSON.parse(sourceCode);
    callback(messages, config);
};

/**
 * Only match package.json files
 * @static
 * @param  {String} filePath
 * @return {Bollean}
 */
ProjectConfigurationLoader.prototype.matchPath = function(filePath) {
  return filePath.lastIndexOf('package.json') === filePath.length - 12;
};


module.exports = ProjectConfigurationLoader;

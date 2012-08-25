/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
var inherits = require('util').inherits;

var commonjs = require('../parse/commonjs');
var ResourceLoader = require('./ResourceLoader');
var JSMock = require('../resource/JSMock');


/**
 * @class Loads and parses __mocks__ / *.js files
 *
 * @extends {ResourceLoader}
 */
function JSMockLoader(options) {
  this.options = options = options || {};
  this.pathRe = options.matchSubDirs ?
    /(?:\/|^)__mocks__\/(.+)\.js$/ :
    /(?:\/|^)__mocks__\/([^\/]+)\.js$/;
}
inherits(JSMockLoader, ResourceLoader);

JSMockLoader.prototype.getResourceTypes = function() {
  return [JSMock];
};

JSMockLoader.prototype.getExtensions = function() {
  return ['.js'];
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
JSMockLoader.prototype.loadFromSource =
  function(path, configuration, sourceCode, callback) {

  var mock = new JSMock(path);
  if (configuration) {
    mock.id = configuration.resolveID(path.replace('__mocks__/', ''));
  } else {
    mock.id = path.match(this.pathRe)[1];
  }
  mock.requiredModules = commonjs.extractRequireCalls(sourceCode);
  callback(mock);
};

/**
 * Only match __mocks__ / *.js files
 * @static
 * @param  {String} filePath
 * @return {Bollean}
 */
JSMockLoader.prototype.matchPath = function(filePath) {
  return this.pathRe.test(filePath);
};


module.exports = JSMockLoader;

/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
var inherits = require('util').inherits;
var path = require('path');

var docblock = require('../parse/docblock');
var commonjs = require('../parse/commonjs');
var ResourceLoader = require('./ResourceLoader');
var JSTest = require('../resource/JSTest');


/**
 * @class Loads and parses __tests__ / *.js files
 *
 * @extends {ResourceLoader}
 */
function JSTestLoader(options) {
  this.options = options = options || {};
  this.pathRe = options.matchSubDirs ?
    /(?:\/|^)__tests__\/(.+)\.js$/ :
    /(?:\/|^)__tests__\/([^\/]+)\.js$/;
}
inherits(JSTestLoader, ResourceLoader);

var requireRe = /(?:\brequire|\.map)\s*\(\s*[\'"]([^"\']+)["\']\s*\)/g;

JSTestLoader.prototype.getResourceTypes = function() {
  return [JSTest];
};

JSTestLoader.prototype.getExtensions = function() {
  return ['.js'];
};


/**
 * Initialize a resource with the source code and configuration
 * Loader can parse, gzip, minify the source code to build the resulting
 * Resource value object
 *
 * @protected
 * @param {String}               filePath      resource being built
 * @param {ProjectConfiguration} configuration configuration for the path
 * @param {String}               sourceCode
 * @param {Function}             callback
 */
JSTestLoader.prototype.loadFromSource =
  function(filePath, configuration, sourceCode, callback) {

  var test = new JSTest(filePath);
  var match = filePath.match(this.pathRe);
  test.id = match ? match[1] : path.basename(filePath, '.js');

  docblock.parse(docblock.extract(sourceCode)).forEach(function(pair) {
    var name = pair[0];
    var value = pair[1];

    switch (name) {
      case 'emails':
        test.contacts = value.split(/\s/);
        break;
      default:
        // do nothing
    }
  });

  test.requiredModules = commonjs.extractRequireCalls(sourceCode, requireRe);
  callback(null, test);
};

/**
 * Only match __tests__ / *.js files
 * @static
 * @param  {String} filePath
 * @return {Bollean}
 */
JSTestLoader.prototype.matchPath = function(filePath) {
  return this.pathRe.test(filePath);
};


module.exports = JSTestLoader;

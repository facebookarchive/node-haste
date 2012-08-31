/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
var inherits = require('util').inherits;

var docblock = require('../parse/docblock');
var extract = require('../parse/extract');
var ResourceLoader = require('./ResourceLoader');
var JSBench = require('../resource/JSBench');


/**
 * @class Loads and parses __benchmarks__ / *.js files
 *
 * @extends {ResourceLoader}
 */
function JSBenchLoader(options) {
  this.options = options = options || {};
  this.pathRe = options.matchSubDirs ?
    /(?:\/|^)__benchmarks__\/(.+)\.js$/ :
    /(?:\/|^)__benchmarks__\/([^\/]+)\.js$/;
}
inherits(JSBenchLoader, ResourceLoader);


JSBenchLoader.prototype.getResourceTypes = function() {
  return [JSBench];
};

JSBenchLoader.prototype.getExtensions = function() {
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
JSBenchLoader.prototype.loadFromSource =
  function(path, configuration, sourceCode, messages, callback) {

  var bench = new JSBench(path);

  docblock.parse(docblock.extract(sourceCode)).forEach(function(pair) {
    var name = pair[0];
    var value = pair[1];

    switch (name) {
      case 'emails':
        bench.contacts = value.split(/\s/);
        break;
      default:
        // do nothing
    }
  });

  bench.id = configuration && configuration.resolveID(path);
  if (!bench.id) {
    bench.id = path.match(this.pathRe)[1];
  }
  bench.requiredModules = extract.requireCalls(sourceCode);
  callback(messages, bench);
};

/**
 * Only match __benchmarks__ / *.js files
 * @static
 * @param  {String} filePath
 * @return {Bollean}
 */
JSBenchLoader.prototype.matchPath = function(filePath) {
  return this.pathRe.test(filePath);
};


module.exports = JSBenchLoader;

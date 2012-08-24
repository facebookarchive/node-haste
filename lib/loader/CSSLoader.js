/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
var inherits = require('util').inherits;
var zlib = require('zlib');

var docblock = require('../parse/docblock');
var ResourceLoader = require('./ResourceLoader');
var extractFBSprites = require('../parse/css').extractFBSprites;
var CSS = require('../resource/CSS');


/**
 * @class Loads and parses CSS files
 * Extracts options from the docblock, calculates gziped network size. Network
 * size calculation is off by default due to it's perf cost. Use options
 * parameter to switch them on.
 *
 * @extends {ResourceLoader}
 * @param {Object|null} options Object with the following options:
 *                              - extractNetworkSize
 *                              - extractFBSprites
 */
function CSSLoader(options) {
  this.options = options = options || {};
  var extractNetworkSize = !!options.networkSize;

  if (extractNetworkSize) {
    this.extractExtra = this.extractNetworkSize;
  } else {
    this.extractExtra = function(css, sourceCode, callback) {
      // make async to break long stack traces
      process.nextTick(function() {
        callback(css);
      });
    }
  }
}

inherits(CSSLoader, ResourceLoader);

CSSLoader.prototype.getResourceTypes = function() {
  return [CSS];
};

CSSLoader.prototype.getExtensions = function() {
  return ['.css'];
};

/**
 * Extracts aproximate network size by gziping the source
 * @todo (voloko) why not minify?
 * Off by default due to perf cost
 *
 * @protected
 * @param  {CSS}   css
 * @param  {String}   sourceCode
 * @param  {Function} callback
 */
CSSLoader.prototype.extractNetworkSize = function(css, sourceCode, callback) {
  zlib.deflate(sourceCode, function(err, buffer) {
    css.networkSize = buffer.length;
    callback(css);
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
 * @param {Function}             callback
 */
CSSLoader.prototype.loadFromSource =
  function(path, configuration, sourceCode, callback) {
  var css = new CSS(path);

  var props = docblock.parse(docblock.extract(sourceCode));

  props.forEach(function(pair) {
    var name = pair[0];
    var value = pair[1];

    switch (name) {
      case 'provides':
        css.id = value;
        break;
      case 'css':
        css.requiredCSS = css.requiredCSS.concat(value.split(/\s+/));
        break;
      case 'nonblocking':
        css.isNonblocking = true;
        break;
      case 'nopackage':
        css.isNopackage = true;
        break;
      case 'option':
      case 'options':
        value.split(/\s+/).forEach(function(key) {
          css.options[key] = true;
        });
        break;
      default:
        // ignore until we have error reporting
    }
  });

  if (this.options.extractFBSprites) {
    css.fbSprites = extractFBSprites(sourceCode);
  }

  this.extractExtra(css, sourceCode, callback);
};


/**
 * Only match *.css files
 * @param  {String} filePath
 * @return {Bollean}
 */
CSSLoader.prototype.matchPath = function(filePath) {
  return filePath.lastIndexOf('.css') === filePath.length - 4;
};

module.exports = CSSLoader;

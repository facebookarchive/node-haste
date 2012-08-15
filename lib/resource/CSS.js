/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
/*jslint proto:true*/

var inherits = require('util').inherits;
var fs = require('fs');
var zlib = require('zlib');

var extractFBSprites = require('../parse/css').extractFBSprites;
var CSSLite = require('./CSSLite');

/**
 * Resource for *.css files
 * A heavier version of CSS that does extract more information (gzipped size).
 * @extends {CSSLite}
 * @class
 * @param {String} path path of the resource
 */
function CSS(path) {
  CSSLite.call(this, path);
  this.networkSize = 0;
  this.fbSprites = [];
}
inherits(CSS, CSSLite);
CSS.__proto__ = CSSLite;

CSS.prototype.type = 'CSS';
CSS.prototype.version = '0.1';

CSS.initFromSource = function(css, configuration, sourceCode, callback) {
  CSSLite.initFromSource(css, configuration, sourceCode, function() {
    if (css.options.ignore) {
      callback(css);
      return;
    }
    zlib.deflate(sourceCode, function(err, buffer) {
      css.networkSize = buffer.length;
      css.fbSprites = extractFBSprites(sourceCode);
      callback(css);
    });
  });
};

module.exports = CSS;

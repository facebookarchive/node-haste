/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
/*jslint proto:true*/

var inherits = require('util').inherits;
var path = require('path');
var fs = require('fs');

var docblock = require('../parse/docblock');
var Resource = require('./Resource');

/**
 * Resource for *.css files
 * @extends {Resource}
 * @class
 * @param {String} path path of the resource
 */
function CSSLite(path) {
  this.path = path;
  this.id = null;

  this.isNopackage = false;
  this.isNonblocking = false;

  this.options = {};
  this.requiredCSS = [];
}
inherits(CSSLite, Resource);
CSSLite.__proto__ = Resource;


CSSLite.prototype.type = 'CSSLite';
CSSLite.prototype.version = '0.1';

/**
 * Only match *.css files
 * @static
 * @param  {String} filePath
 * @return {Bollean}
 */
CSSLite.matchPath = function(filePath) {
  return filePath.lastIndexOf('.css') === filePath.length - 4;
};

CSSLite.initFromSource = function(
  resource, configuration, sourceCode, callback) {
  var props = docblock.parse(docblock.extract(sourceCode));

  props.forEach(function(pair) {
    var name = pair[0];
    var value = pair[1];

    switch (name) {
      case 'provides':
        resource.id = value;
        break;
      case 'css':
        resource.requiredCSS = resource.requiredCSS.concat(value.split(/\s+/));
        break;
      case 'nonblocking':
        resource.isNonblocking = true;
        break;
      case 'nopackage':
        resource.isNopackage = true;
        break;
      case 'option':
      case 'options':
        value.split(/\s+/).forEach(function(key) {
          resource.options[key] = true;
        });
        break;
      default:
        // ignore until we have error reporting
    }
  });

  callback(resource);
};


module.exports = CSSLite;

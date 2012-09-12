/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
/*jslint proto:true*/

var inherits = require('util').inherits;
var Resource = require('./Resource');

/**
 * Resource for *.css files
 * @extends {Resource}
 * @class
 * @param {String} path path of the resource
 */
function CSS(path) {
  this.path = path;
  this.id = null;

  this.fbSprites = [];
  this.options = {};
  this._requiredCSSMap = {};
  this._requiredLegacyComponentsMap = [];
}
inherits(CSS, Resource);
CSS.__proto__ = Resource;


CSS.prototype.isNopackage = false;
CSS.prototype.isNonblocking = false;
CSS.prototype.isModule = false;
CSS.prototype.isPermanent = false;
CSS.prototype.networkSize = 0;
CSS.prototype.type = 'CSS';
CSS.prototype.requiredCSS = [];
CSS.prototype.requiredLegacyComponents = [];


CSS.prototype.addRequiredLegacyComponent = function(x) {
  this._requiredLegacyComponentsMap[x] = true;
};

CSS.prototype.addRequiredCSS = function(x) {
  this._requiredCSSMap[x] = true;
};

CSS.prototype.finalize = function() {
  var keys = Object.keys(this._requiredLegacyComponentsMap);
  if (keys.length) {
    this.requiredLegacyComponents = keys;
  }
  keys = Object.keys(this._requiredCSSMap);
  if (keys.length) {
    this.requiredCSS = keys;
  }
};


module.exports = CSS;

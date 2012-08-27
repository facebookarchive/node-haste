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
  this.requiredCSS = [];
}
inherits(CSS, Resource);
CSS.__proto__ = Resource;


CSS.prototype.isNopackage = false;
CSS.prototype.isNonblocking = false;
CSS.prototype.isModule = false;
CSS.prototype.networkSize = 0;
CSS.prototype.type = 'CSS';


module.exports = CSS;

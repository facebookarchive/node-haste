/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
/*jslint proto:true*/

var inherits = require('util').inherits;

var Resource = require('./Resource');

/**
 * Resource for __benchmarks__ / *.js files
 * @extends {Resource}
 * @class
 * @param {String} path path of the resource
 */
function JSBench(path) {
  this.path = path;
  this.id = null;

  this.contacts = [];
  this.requiredModules = [];
}
inherits(JSBench, Resource);
JSBench.__proto__ = Resource;

JSBench.prototype.type = 'JSBench';
JSBench.prototype.version = '0.1';


module.exports = JSBench;

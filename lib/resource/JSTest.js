/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
/*jslint proto:true*/

var inherits = require('util').inherits;
var path = require('path');
var fs = require('fs');

var docblock = require('../parse/docblock');
var commonjs = require('../parse/commonjs');
var Resource = require('./Resource');

/**
 * Resource for __tests__ / *.js files
 * @extends {Resource}
 * @class
 * @param {String} path path of the resource
 */
function JSTest(path) {
  this.path = path;
  this.id = null;

  this.contacts = [];
  this.requiredModules = [];
}
inherits(JSTest, Resource);
JSTest.__proto__ = Resource;

JSTest.prototype.type = 'JSTest';

module.exports = JSTest;

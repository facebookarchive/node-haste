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
JSTest.prototype.version = '0.1';


var re = /(\/|^)__tests__\/[^\/]+\.js$/;
/**
 * Only match __tests__ / *.js files
 * @static
 * @param  {String} filePath
 * @return {Bollean}
 */
JSTest.matchPath = function(filePath) {
  return re.test(filePath);
};


var requireRe = /(?:\brequire|\.map)\s*\(\s*[\'"]([^"\']+)["\']\s*\)/g;

JSTest.initFromSource = function(
  resource, configuration, sourceCode, callback) {
  resource.id = path.basename(resource.path, '.js');

  docblock.parse(docblock.extract(sourceCode)).forEach(function(pair) {
    var name = pair[0];
    var value = pair[1];

    switch (name) {
      case 'emails':
        resource.contacts = value.split(/\s/);
        break;
      default:
        // do nothing
    }
  });

  resource.requiredModules =
    commonjs.extractRequireCalls(sourceCode, requireRe);

  callback(resource);
};


module.exports = JSTest;

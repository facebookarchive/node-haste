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


var re = /(\/|^)__benchmarks__\/[^\/]+\.js$/;
/**
 * Only match __benchmarks__ / *.js files
 * @static
 * @param  {String} filePath
 * @return {Bollean}
 */
JSBench.matchPath = function(filePath) {
  return re.test(filePath);
};

JSBench.initFromSource = function(
  resource, configuration, sourceCode, callback) {

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

  var requires = commonjs.extractRequireCalls(sourceCode);
  if (configuration) {
    resource.id = configuration.resolveID(resource.path);
    configuration.resolveRequires(requires, resource.path, function(r) {
      resource.requiredModules = r;
      callback(resource);
    });
  } else {
    resource.id = path.basename(resource.path, '.js');
    resource.requiredModules = requires;
    callback(resource);
  }
};


module.exports = JSBench;

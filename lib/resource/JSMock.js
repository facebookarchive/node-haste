/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
/*jslint proto:true*/

var inherits = require('util').inherits;
var path = require('path');
var fs = require('fs');

var Resource = require('./Resource');
var commonjs = require('../parse/commonjs');

/**
 * Resource for __mocks__ / *.js files
 * @extends {Resource}
 * @class
 * @param {String} path path of the resource
 */
function JSMock(path) {
  this.path = path;
  this.id = null;
}
inherits(JSMock, Resource);
JSMock.__proto__ = Resource;

JSMock.prototype.type = 'JSMock';
JSMock.prototype.version = '0.1';


var re = /(\/|^)__mocks__\/[^\/]+\.js$/;
/**
 * Only match __mocks__ / *.js files
 * @static
 * @param  {String} filePath
 * @return {Bollean}
 */
JSMock.matchPath = function(filePath) {
  return re.test(filePath);
};

JSMock.initFromSource = function(
  resource, configuration, sourceCode, callback) {

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


module.exports = JSMock;

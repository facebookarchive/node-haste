/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
/*jslint proto:true*/

var inherits = require('util').inherits;

var Resource = require('./Resource');

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

module.exports = JSMock;

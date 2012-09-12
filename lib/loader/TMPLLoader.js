/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
var inherits = require('util').inherits;

var JSLoader = require('./JSLoader');

function TMPLLoader(options) {
  JSLoader.call(this, options);
}
inherits(TMPLLoader, JSLoader);
TMPLLoader.prototype.path = __filename;

TMPLLoader.prototype.matchPath = function(filePath) {
  return filePath.lastIndexOf('.tmpl') === filePath.length - 5;
};

TMPLLoader.prototype.getExtensions = function() {
  return ['.tmpl'];
};

module.exports = TMPLLoader;


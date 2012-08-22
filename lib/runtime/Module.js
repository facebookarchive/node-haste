/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
function Module(id, filename, parent) {
  this.id = id;
  this.filename = filename || null;
  this.parent = parent || null;
  this.loaded = false;
  this.exports = {};
}

Module.prototype.require = function(id) {};


module.exports = Module;
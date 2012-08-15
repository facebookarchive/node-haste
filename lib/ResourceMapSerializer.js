/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
var fs = require('fs');

var ResourceMap = require('./ResourceMap');

var FORMAT_VERSION = '0.1';
/**
 * A class that loads and stores ResourceMaps from and to a given file.
 * Usese simple JSON functions to seralize/deserialize the data
 *
 * @class
 * @param {ResourceTypes} resourceTypes
 */
function ResourceMapSerializer(resourceTypes) {
  this.resourceTypes = resourceTypes;
}

/**
 * Loads and deserializes a map from a given path
 * @param  {String}      path
 * @param  {ResourceMap} map
 * @param  {Function}    callback
 */
ResourceMapSerializer.prototype.loadFromPath = function(path, callback) {
  var me = this;
  fs.readFile(path, 'utf-8', function(err, code) {
    if (err) {
      callback(err, null);
      return;
    }

    var ser = JSON.parse(code);
    callback(null, me.fromObject(ser));
  });
};

ResourceMapSerializer.prototype.fromObject = function(ser) {
  var hash = this.resourceTypes.getHash();

  var map = new ResourceMap();
  if (hash === ser.typeHash && ser.formatVersion === FORMAT_VERSION) {
    ser.objects.forEach(function(obj) {
      var type = this.resourceTypes.getType(obj.type);
      map.addResource(type.fromObject(obj));
    }, this);
  }
  return map;
};

/**
 * Serializes and stores a map to a given path
 * @param  {String}      path
 * @param  {ResourceMap} map
 * @param  {Function}    callback
 */
ResourceMapSerializer.prototype.storeToPath = function(path, map, callback) {
  var ser = this.toObject(map);
  fs.writeFile(path, JSON.stringify(ser), 'utf-8', callback);
};

ResourceMapSerializer.prototype.toObject = function(map) {
  var ser = {
    formatVersion: FORMAT_VERSION,
    typeHash: this.resourceTypes.getHash(),
    objects: []
  };
  map.getAllResources().forEach(function(resource) {
    ser.objects.push(resource.toObject());
  });
  return ser;
};


module.exports = ResourceMapSerializer;

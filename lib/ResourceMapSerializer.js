/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
var fs = require('fs');

var ResourceMap = require('./ResourceMap');

/**
 * A class that loads and stores ResourceMaps from and to a given file.
 * Usese simple JSON functions to seralize/deserialize the data
 *
 * @class
 * @param {Array.<ResourceLoader>} loaders
 */
function ResourceMapSerializer(loaders) {
  this.typeMap = {};
  loaders.forEach(function(loader) {
    loader.getResourceTypes().forEach(function(type) {
      this.typeMap[type.prototype.type] = type;
    }, this);
  }, this);
}

ResourceMapSerializer.FORMAT_VERSION = '0.1';

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

ResourceMapSerializer.prototype.loadFromPathSync = function(path) {
  var code = fs.readFileSync(path, 'utf-8');
  return code && this.fromObject(JSON.parse(code));
};

ResourceMapSerializer.prototype.fromObject = function(ser) {
  if (ser.formatVersion === ResourceMapSerializer.FORMAT_VERSION) {
    var map = new ResourceMap();
    ser.objects.forEach(function(obj) {
      var type = this.typeMap[obj.type];
      map.addResource(type.fromObject(obj));
    }, this);
    return map;
  } else {
    return null;
  }
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
    formatVersion: ResourceMapSerializer.FORMAT_VERSION,
    objects: []
  };
  map.getAllResources().forEach(function(resource) {
    var object = resource.toObject();
    // ensure type is stored
    object.type = resource.type;
    ser.objects.push(object);
  });
  return ser;
};


module.exports = ResourceMapSerializer;

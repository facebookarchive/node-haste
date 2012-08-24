/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */

/**
 * A map holding resource by id
 * @param {Array.<Resource>} resources
 */
function ResourceMap(resources, typeToMap) {
  this.resourceCache = null;
  this.resourceMap = {};
  this.resourcePathMap = {};
  this.typeToMap = typeToMap || {};
  resources && resources.forEach(this.addResource, this);
}

ResourceMap.prototype.getResource = function(type, id) {
  return this.resourceMap[this.typeToMap[type] || type][id];
};

ResourceMap.prototype.getResourceByPath = function(path) {
  return this.resourcePathMap[path];
};

ResourceMap.prototype.getAllResources = function() {
  if (!this.resourceCache) {
    var cache = [];
    var map = this.resourcePathMap;
    Object.keys(map).forEach(function(k) {
      map[k] && cache.push(map[k]);
    }, this);
    this.resourceCache = cache;
  }
  return this.resourceCache;
};

ResourceMap.prototype.getAllResourcesByType = function(type) {
  type = this.typeToMap[type] || type;
  if (!this.resourceMap[type]) {
    return [];
  }
  return Object.keys(this.resourceMap[type]).map(function(key) {
    return this.resourceMap[type][key];
  }, this);
};

ResourceMap.prototype.addResource = function(resource) {
  this.resourceCache = null;
  var type = this.typeToMap[resource.type] || resource.type;
  if (!this.resourceMap[type]) {
    this.resourceMap[type] = {};
  }
  this.resourcePathMap[resource.path] = resource;
  this.resourceMap[type][resource.id] = resource;
};

ResourceMap.prototype.updateResource = function(oldResource, newResource) {
  this.resourceCache = null;
  this.removeResource(oldResource);
  this.addResource(newResource);
};

ResourceMap.prototype.removeResource = function(resource) {
  var type = this.typeToMap[resource.type] || resource.type;
  if (this.resourceMap[type] && this.resourceMap[type][resource.id]) {
    this.resourceCache = null;
    this.resourcePathMap[resource.path] = undefined;
    this.resourceMap[type][resource.id] = undefined;
  }
};


module.exports = ResourceMap;

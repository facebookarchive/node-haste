/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */

/**
 * A utility class to operate on a list of types
 * Can be used in searialization/desearilization
 *
 * @class
 * @param {Array.<function>} types List of Resources classes
 */
function ResourceTypes(types) {
  this.types = types;
  this.typeMap = {};
  types.forEach(function(type) {
    this.typeMap[type.prototype.type] = type;
  }, this);
}

/**
 * Returns a resorse type for a given path or null if not found
 * @param  {String} filePath
 * @return {function}
 */
ResourceTypes.prototype.typeForPath = function(filePath) {
  for (var i = 0; i < this.types.length; i++) {
    if (this.types[i].matchPath(filePath)) {
      return this.types[i];
    }
  }
  return null;
};

/**
 * Converts an object to a Resource using the type info
 * @param  {Resource} resource
 * @return {Object}
 */
ResourceTypes.prototype.getType = function(typeName) {
  return this.typeMap[typeName];
};


ResourceTypes.prototype.getHash = function() {
  return this.types.map(function(type) {
    return type.prototype.type + '_' + (type.prototype.version || '0.0');
  }).join(':');
};

module.exports = ResourceTypes;

/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */


/**
 * A data structure to efficiently find configuration for a given resource
 * @class
 * @param {Array.<ProjectConfiguration>} configurations
 */
function ConfigurationTrie(conigurations) {
  this.root = { paths: {} };
  conigurations.forEach(this.indexConfiguration, this);
}

/**
 * @protected
 */
ConfigurationTrie.prototype.indexConfiguration = function(configuration) {
  configuration.getHasteDirectories().forEach(function(path) {
    var parts = path.split('/');
    var node = this.root;
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i];
      node.paths[part] = node.paths[part] || { paths: {} };
      node = node.paths[part];
    }
    node.configuration = configuration;
  }, this);
};

ConfigurationTrie.prototype.findConfiguration = function(resourcePath) {
  var parts = resourcePath.split('/');
  var node = this.root;
  var configuration;
  for (var i = 0; i < parts.length - 1; i++) {
    var part = parts[i];
    if (node.paths[part]) {
      node = node.paths[part];
      configuration = node.configuration || configuration;
    } else {
      break;
    }
  }
  return configuration;
};

module.exports = ConfigurationTrie;

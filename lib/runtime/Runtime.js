/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
var ConfigurationTrie = require('../ConfigurationTrie');
var Module = require('./Module');


 /**
  * Haste Runtime
  * Minimal Runtime support to execute haste js files
  * Provides CommonJS-like require() function, module object and execution
  * environment
  * @class
  * @param {ResourceMap} map
  * @param {String}      jsType
  * @param {function}    runInThisContext
  */
function Runtime(map, jsType, runInThisContext) {
  this.map = map;
  this.jsType = jsType || 'JS';
  this.runInThisContext = runInThisContext || require('vm').runInThisContext;

  this.cache = {};
  this.trie =
    new ConfigurationTrie(map.getAllResourcesByType('ProjectConfiguration'));
}

/**
 * Resolves a resource for a given module and id
 * @param  {String}      id     ID of a resource to resolve
 * @param  {Module|null} module A module that required the resource
 * @return {Resource}           Resolved resource
 */
Runtime.prototype.require = function(id, parent) {
  var configuration = parent && this.trie.findConfiguration(parent.filename);
  var resource = this.resolveResource(id, parent, configuration);
  if (!this.cache[resource.path]) {
    var module = new Module(resource.id, resource.path, parent);
    this.cache[resource.path] = module;
    var me = this;
    module.require = function(id) {
      return me.require(id, module);
    };
    this.loadModule(module, resource, configuration);
  }
  return this.cache[resource.path].exports;
};

/**
 * Given an id, parent module and configuration resolve to a Resource
 * object.
 * @param  {String} id
 * @param  {Module|null} parent
 * @param  {ProjectConfiguration|null} configuration
 * @return {Resource}
 */
Runtime.prototype.resolveResource = function(id, parent, configuration) {
  var resolvedID = configuration && parent ?
    configuration.resolveRequireSync(id, parent.filename) :
    id;
  return this.map.getResource(this.jsType, resolvedID);
};


/**
 * Loads a given module using module itself and supporting information
 * @param  {Module} module
 * @param  {Resource} resource
 * @param  {ProjectConfiguration} configuration
 */
Runtime.prototype.loadModule = function(module, resource, configuration) {
  var code = this.loadCode(module, resource, configuration);

  // use local variable as context variables
  var factory = this.runInThisContext(
    '(function(module, exports, require) {' + code + '\n})',
    module.filename
  );
  factory(module, module.exports, module.require);

  module.loaded = true;
};

/**
 * Load code as a string
 * @param  {Module} module
 * @param  {Resource} resource
 * @param  {ProjectConfiguration} configuration
 * @return {String}
 */
Runtime.prototype.loadCode = function(module, resource, configuration) {
  return fs.readFileSync(module.filename, 'UTF-8');
};


module.exports = Runtime;

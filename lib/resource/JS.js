/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
/*jslint proto:true*/

var inherits = require('util').inherits;
var Resource = require('./Resource');

/**
 * Resource for *.js files
 * A heavier version of JS that does extract more information (gziped size).
 * @extends {JSLite}
 * @class
 * @param {String} path path of the resource
 */
function JS(path) {
  this.path = path;
  this.id = null;

  this.options = {};
  this._requiredCSSMap = {};
  this._requiredModuleMap = {};
  this._requiredLegacyComponentsMap = {}
}
inherits(JS, Resource);
JS.__proto__ = Resource;


// move default options to the prototype, to reduce serialized size
JS.prototype.jsxDOMImplementor = '';
JS.prototype.networkSize = 0;
JS.prototype.isJSXEnabled = false;
JS.prototype.isModule = false;
JS.prototype.isJavelin = false;
JS.prototype.isRunWhenReady = false;
JS.prototype.isPolyfill = false;
JS.prototype.isLegacy = false;
JS.prototype.isPermanent = false;
JS.prototype.isNopackage = false;

// do not modify this arrays in loader, only override
JS.prototype.definedJavelinSymbols = [];
JS.prototype.requiredJavelinSymbols = [];
JS.prototype.requiredDynamicModules = [];
JS.prototype.requiredLazyModules = [];
JS.prototype.requiredCSS = [];
JS.prototype.requiredModules = [];
JS.prototype.requiredLegacyComponents = [];
JS.prototype.suggests = [];
JS.prototype.polyfillUAs = [];

JS.prototype.type = 'JS';

JS.prototype.addRequiredModule = function(x) {
  this._requiredModuleMap[x] = true;
};

JS.prototype.addRequiredLegacyComponent = function(x) {
  this._requiredLegacyComponentsMap[x] = true;
};

JS.prototype.addRequiredCSS = function(x) {
  this._requiredCSSMap[x] = true;
};

JS.prototype.finalize = function() {
  var keys = Object.keys(this._requiredModuleMap);
  if (keys.length) {
    this.requiredModules = keys;
  }
  keys = Object.keys(this._requiredLegacyComponentsMap);
  if (keys.length) {
    this.requiredLegacyComponents = keys;
  }
  keys = Object.keys(this._requiredCSSMap);
  if (keys.length) {
    this.requiredCSS = keys;
  }
};



module.exports = JS;

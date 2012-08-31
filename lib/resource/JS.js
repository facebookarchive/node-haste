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
  this.requiredCSS = [];
  this.requiredModules = [];
  this.requiredLegacyComponents = [];
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
JS.prototype.suggests = [];


JS.prototype.type = 'JS';

module.exports = JS;

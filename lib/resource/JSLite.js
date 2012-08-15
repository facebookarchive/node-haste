/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
/*jslint proto:true*/

var inherits = require('util').inherits;
var path = require('path');
var fs = require('fs');

var docblock = require('../parse/docblock');
var commonjs = require('../parse/commonjs');
var Resource = require('./Resource');

/**
 * Resource for *.js files (with less processing than normal JS)
 * @extends {Resource}
 * @class
 * @param {String} path path of the resource
 */
function JSLite(path) {
  this.path = path;
  this.id = null;

  this.jsxDOMImplementor = '';

  this.isJSXEnabled = false;
  this.isModule = false;
  this.isJavelin = false;
  this.isRunWhenReady = false;
  this.isPolyfill = false;
  this.isLegacy = false;
  this.isPermanent = false;
  this.isNopackage = false;

  this.options = {};
  this.requiredCSS = [];
  this.requiredModules = [];
  this.requiredLegacyComponents = [];
}
inherits(JSLite, Resource);
JSLite.__proto__ = Resource;

JSLite.prototype.type = 'JSLite';
JSLite.prototype.version = '0.1';

/**
 * Only match *.js files
 * @static
 * @param  {String} filePath
 * @return {Bollean}
 */
JSLite.matchPath = function(filePath) {
  return filePath.lastIndexOf('.js') === filePath.length - 3;
};

JSLite.initFromSource = function(js, configuration, sourceCode, callback) {
  var props = docblock.parse(docblock.extract(sourceCode));

  if (configuration) {
    js.isModule = true;
  }

  props.forEach(function(pair) {
    var name = pair[0];
    var value = pair[1];

    switch (name) {
      case 'provides':
        js.isModule = false;
        js.id = value;
        break;
      case 'providesModule':
        js.isModule = true;
        js.id = value;
        break;
      case 'providesLegacy':
        js.isRunWhenReady = true;
        js.isLegacy = true;
        js.isModule = true;
        js.id = 'legacy:' + value;
        break;
      case 'css':
        js.requiredCSS = js.requiredCSS.concat(value.split(/\s+/));
        break;
      case 'requires':
        js.requiredLegacyComponents = js.requiredLegacyComponents
          .concat(value.split(/\s+/));
        break;
      case 'javelin':
        js.isModule = true;
        js.isJavelin = true;
        js.isRunWhenReady = true;
        break;
      case 'polyfill':
        js.isPolyfill = true;
        break;
      case 'runWhenReady_DEPRECATED':
        js.isRunWhenReady = true;
        break;
      case 'jsx':
        js.isJSXEnabled = true;
        js.jsxDOMImplementor = value;
        if (value) {
          js.requiredModules.push(value);
        }
        break;
      case 'permanent':
        js.isPermanent = true;
        break;
      case 'nopackage':
        js.isNopackage = true;
        break;
      case 'option':
      case 'options':
        value.split(/\s+/).forEach(function(key) {
          js.options[key] = true;
        });
        break;
      default:
        // ignore until we have error reporting
    }
  });

  if (js.options.ignore) {
    callback(js);
  } else if (js.isModule) {
    // require calls outside of modules are not supported
    var requires = commonjs.extractRequireCalls(sourceCode);
    if (configuration) {
      if (!js.id) {
        js.id = configuration.resolveID(js.path);
      }
      configuration.resolveRequires(requires, js.path, function(r) {
        js.requiredModules = js.requiredModules.concat(r);
        callback(js);
      });
    } else {
      js.requiredModules = js.requiredModules.concat(requires);
      callback(js);
    }
  } else {
    callback(js);
  }
};


module.exports = JSLite;

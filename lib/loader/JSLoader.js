/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
var inherits = require('util').inherits;
var path = require('path');
var zlib = require('zlib');
var childProcess = require('child_process');

var docblock = require('../parse/docblock');
var extract = require('../parse/extract');
var ResourceLoader = require('./ResourceLoader');
var JS = require('../resource/JS');
var MessageList = require('../MessageList');
var extractJavelinSymbols = require('../parse/extractJavelinSymbols');

/**
 * @class Loads and parses JavaScript files
 * Extracts options from the docblock, extracts javelin symbols, calculates
 * gziped network size. Both javalin symbols parsing and network size
 * calculation are off by default due to their perf cost. Use options parameter
 * to switch them on.
 *
 * @extends {ResourceLoader}
 * @param {Object|null} options Object with the following options:
 *                              - networkSize
 *                              - invalidRelativePaths
 *                              - extractSpecialRequires
 */
function JSLoader(options) {
  this.options = options = options || {};

  if (this.options.networkSize) {
    this.extractExtra = this.extractNetworkSize;
  } else {
    this.extractExtra = function(js, sourceCode, messages, callback) {
      // make async to break long stack traces
      process.nextTick(function() {
        callback(messages, js);
      });
    };
  }
}
inherits(JSLoader, ResourceLoader);
JSLoader.prototype.path = __filename;

JSLoader.prototype.getResourceTypes = function() {
  return [JS];
};

JSLoader.prototype.getExtensions = function() {
  return ['.js'];
};


/**
 * Extracts aproximate network size by gziping the source
 * @todo (voloko) why not minify?
 * Off by default due to perf cost
 *
 * @protected
 * @param  {JS}   js
 * @param  {String}   sourceCode
 * @param  {Function} callback
 */
JSLoader.prototype.extractNetworkSize =
  function(js, sourceCode, messages,callback) {
  zlib.gzip(sourceCode, function(err, buffer) {
    js.networkSize = buffer.length;
    callback(messages, js);
  });
};

var spaceRe = /\s+/;
/**
 * Syncronously extracts docblock options from the source
 *
 * @protected
 * @param  {JS}   js
 * @param  {String}   sourceCode
 */
JSLoader.prototype.parseDocblockOptions =
  function(js, sourceCode, messages) {

  var props = docblock.parse(docblock.extract(sourceCode));
  props.forEach(function(pair) {
    var name = pair[0];
    var value = pair[1];
    switch (name) {
      case 'provides':
        js.id = value.split(spaceRe)[0];
        break;
      case 'providesModule':
        js.isModule = true;
        js.id = value.split(spaceRe)[0];
        break;
      case 'providesLegacy':
        js.isRunWhenReady = true;
        js.isLegacy = true;
        js.isModule = true;
        js.id = 'legacy:' + value.split(spaceRe)[0];
        break;
      case 'css':
        value.split(spaceRe).forEach(js.addRequiredCSS, js);
        break;
      case 'requires':
        value.split(spaceRe).forEach(js.addRequiredLegacyComponent, js);
        break;
      case 'javelin':
        // hack to ignore javelin docs (voloko)
        if (js.path.indexOf('/js/javelin/docs/') !== -1) {
          break;
        }
        js.isModule = true;
        js.isJavelin = true;
        js.isRunWhenReady = true;
        break;
      case 'polyfill':
        js.isPolyfill = true;
        if (value.match(/\S/)) {
          js.polyfillUAs = value.split(spaceRe);
        } else {
          js.polyfillUAs = ['all'];
        }
        break;
      case 'runWhenReady_DEPRECATED':
        js.isRunWhenReady = true;
        break;
      case 'jsx':
        js.isJSXEnabled = true;
        js.jsxDOMImplementor = value;
        if (value) {
          js.addRequiredModule(value);
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
        value.split(spaceRe).forEach(function(key) {
          js.options[key] = true;
        });
        break;
      case 'suggests':
        messages.addClowntownError(js.path, 'docblock',
          '@suggests is deprecated. Simply use the Bootloader APIs.');
        break;
      case 'author':
      case 'deprecated':
        // Support these so Diviner can pick them up.
        break;
      case 'bolt':
        // Used by bolt transformation
        break;
      case 'javelin-installs':
        //  This is used by Javelin to identify installed symbols.
        break;
      case 'param':
      case 'params':
      case 'task':
      case 'return':
      case 'returns':
      case 'access':
        messages.addWarning(js.path, 'docblock',
          "File has a header docblock, but the docblock is class or " +
          "function documentation, not file documentation. Header blocks " +
          "should not have @param, @task, @returns, @access, etc.");
        break;
      case 'nolint':
      case 'generated':
      case 'preserve-header':
      case 'emails':
        // various options
        break;
      case 'layer':
        // This directive is currently used by Connect JS library
        break;
      default:
        messages.addClowntownError(js.path, 'docblock',
          'Unknown directive ' + name);
    }
  });
};


/**
 * Initialize a resource with the source code and configuration
 * Loader can parse, gzip, minify the source code to build the resulting
 * Resource value object
 *
 * @protected
 * @param {String}               path      resource being built
 * @param {ProjectConfiguration} configuration configuration for the path
 * @param {String}               sourceCode
 * @param {Function}             callback
 */
JSLoader.prototype.loadFromSource =
  function(path, configuration, sourceCode, messages, callback) {
  var js = new JS(path);
  if (configuration) {
    js.isModule = true;
  }

  this.parseDocblockOptions(js, sourceCode, messages);

  if (js.isJavelin) {
    var data = extractJavelinSymbols(sourceCode);
    js.definedJavelinSymbols = data.defines;
    js.requiredJavelinSymbols = data.requires;
    if (data.id) {
      js.id = data.id;
    }
    if (js.id != 'javelin-magical-init') {
      js.addRequiredModule('javelin-magical-init');
    }
  }

  // resolve module ids through configuration
  if (js.isModule || js.path.indexOf('__browsertests__') !== -1) {
    // require calls outside of modules are not supported
    if (configuration) {
      if (!js.id) {
        js.id = configuration.resolveID(js.path);
      }
    }
    extract.requireCalls(sourceCode).forEach(js.addRequiredModule, js);

    if (this.options.extractSpecialRequires) {
      js.requiredDynamicModules =
        extract.requireDynamicCalls(sourceCode);
      js.requiredLazyModules =
        extract.requireLazyCalls(sourceCode);
      js.suggests = extract.loadModules(sourceCode);
    }
  } else {
    if (this.options.extractSpecialRequires) {
      js.requiredLazyModules =
        extract.requireLazyCalls(sourceCode);
      js.suggests = extract.loadComponents(sourceCode);
    }
  }
  extract.cxModules(sourceCode).forEach(js.addRequiredCSS, js);

  // call generated function
  this.extractExtra(js, sourceCode, messages, function(m, js) {
    if (js) {
      js.finalize();
    }
    callback(m, js);
  });
};

/**
 * Only match *.js files
 * @param  {String} filePath
 * @return {Bollean}
 */
JSLoader.prototype.matchPath = function(filePath) {
  return filePath.lastIndexOf('.js') === filePath.length - 3;
};


/**
 * Post process is called after the map is updated but before the update
 * task is complete.
 * Used to resolve local required paths and /index.js directory requires
 * @todo (voloko) Correctly resolve a.js and a/index.js
 *
 * @param  {ResourceMap}      map
 * @param  {Array.<Resource>} resources
 * @param  {Function}         callback
 */
JSLoader.prototype.postProcess = function(map, resources, callback) {
  var messages = MessageList.create();
  var invalidRelativePaths = this.options.invalidRelativePaths;
  var isJavelin = false;
  resources.forEach(function(r) {
    var required = r.requiredModules;
    var tryInvalidPaths = invalidRelativePaths &&
      map.getConfigurationByPath(r.path);
    if (r.isJavelin) {
      isJavelin = true;
    }

    for (var i = 0; i < required.length; i++) {
      var req = required[i];
      if (req.charAt(0) === '.' || tryInvalidPaths) {
        var relative = path.join(path.dirname(r.path), req);
        var resource = map.getResourceByPath(relative + '.js') ||
          map.getResourceByPath(relative + '/index.js');
        if (!resource) {
          if (req.charAt(0) === '.') {
            messages.addClowntownError(r.path, 'js',
              'Cannot resolve local path ' + req);
          }
        } else {
          required[i] = resource.id;
        }
      }
    }

  });

  // legacy namespace
  resources.forEach(function(r) {
    var resource, i, required;

    required = r.requiredCSS;
    for (i = 0; i < required.length; i++) {
      resource = map.getResource('CSS', 'css:' + required[i]);
      if (resource && resource.isModule) {
        required[i] = 'css:' + required[i];
      }
    }

    if (r.isModule) {
      return;
    }

    required = r.requiredLegacyComponents;
    for (i = 0; i < required.length; i++) {
      resource = map.getResource('JS', 'legacy:' + required[i]);
      if (resource && resource.isLegacy) {
        required[i] = 'legacy:' + required[i];
      }
    }

    required = r.suggests;
    for (i = 0; i < required.length; i++) {
      resource = map.getResource('JS', 'legacy:' + required[i]);
      if (resource && resource.isLegacy) {
        required[i] = 'legacy:' + required[i];
      }
    }

  });

  // rebuild javelin map
  if (isJavelin) {
    var providesMap = {};
    map.getAllResourcesByType('JS').forEach(function(r) {
      if (r.isJavelin) {
        r.definedJavelinSymbols.forEach(function(s) {
          if (providesMap[s]) {
            messages.addClowntownError(r.path, 'javelin',
            'Javlin symbol ' + s + ' is already defined in ' +
            providesMap[s].path);
            return;
          }
          providesMap[s] = r;
        });
      }
    });
    map.getAllResourcesByType('JS').forEach(function(r) {
      if (r.isJavelin) {
        r.requiredJavelinSymbols.forEach(function(s) {
          var resolved = providesMap[s];
          if (!resolved) {
            messages.addClowntownError(r.path, 'javelin',
            'Javlin symbol ' + s + ' is required but never defined');
            return;
          }
          if (r.requiredModules.indexOf(resolved.id) === -1) {
            r.requiredModules.push(resolved.id);
          }
          if (r.requiredLegacyComponents.indexOf(resolved.id) !== -1) {
            r.requiredLegacyComponents = r.requiredLegacyComponents
              .filter(function(id) { return id !== resolved.id; });
          }
        });
      }
    });
  }

  process.nextTick(function() {
    callback(messages);
  });
};

module.exports = JSLoader;


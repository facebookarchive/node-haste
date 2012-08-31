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

/**
 * @class Loads and parses JavaScript files
 * Extracts options from the docblock, extracts javelin symbols, calculates
 * gziped network size. Both javalin symbols parsing and network size
 * calculation are off by default due to their perf cost. Use options parameter
 * to switch them on.
 *
 * @extends {ResourceLoader}
 * @param {Object|null} options Object with the following options:
 *                              - extractNetworkSize
 *                              - extractJavelin
 *                              - javelinsymbolsPath
 */
function JSLoader(options) {
  this.options = options = options || {};
  var extractNetworkSize = !!options.networkSize;
  var extractJavelin = options.extractJavelin || options.javelinsymbolsPath;
  this.javelinsymbolsPath = options.javelinsymbolsPath ||
    '/scripts/javelin/javelinsymbols';

  // generate extractExtra function depending on the options passed
  if (extractJavelin && extractNetworkSize) {
    this.extractExtra = function(js, sourceCode, messages, callback) {
      this.extractJavelinSymbols(
        js,
        sourceCode,
        messages,
        this.extractNetworkSize.bind(this,js, sourceCode, messages, callback));
    };
  } else if (extractJavelin) {
    this.extractExtra = this.extractJavelinSymbols;
  } else if (extractNetworkSize) {
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
  zlib.deflate(sourceCode, function(err, buffer) {
    js.networkSize = buffer.length;
    callback(messages, js);
  });
};

/**
 * Extracts javelin specific symbols using javelinsymbols tool. Depends on
 * the correct path to the tool (see options.javelinsymbolsPath). Off by default
 *
 * @protected
 * @param  {JS}   js
 * @param  {String}   sourceCode
 * @param  {Function} callback
 */
JSLoader.prototype.extractJavelinSymbols =
  function(js, code, messages, callback) {
  if (!js.isJavelin) {
    callback(null, js);
    return;
  }

  var child = childProcess.exec(this.javelinsymbolsPath);
  var output = '';
  var me = this;
  child.stdout.setEncoding('utf-8');
  child.stdout.on('data', function(d) {
    output += d;
  });
  child.on(
    'exit',
    function() {
      me._javelinSymbolsCallback(js, output, messages, callback);
    });
  child.stdin.end(code, 'utf-8');
};

JSLoader.prototype._javelinSymbolsCallback =
  function(js, output, messages, callback) {
  var defines = {};
  var requires = {};
  output.split(/\n/).forEach(function(line) {
    var name;
    // Strip line number.
    line = line.replace(/:\d+$/, '');
    switch(line[0]) {
      // JX.install
      case '+':
        name = 'JX.' + line.substr(1);
        delete requires[name];
        defines[name] = true;
        // Definitions require JX.install
        requires['JX.install'] = true;
        js.id = name;
        break;
      // JX.<anything else>
      case '?':
        name = 'JX.' + line.split('.')[1];
        if (!defines[name]) {
          requires[name] = true;
        }
        break;
      // JX.behavior
      case '*':
        name = 'javelin-behavior-' + line.substr(1);
        delete requires[name];
        defines[name] = true;
        // Behaviors require JX.behavior
        requires['JX.behavior'] = true;
        js.id = name;
        break;
    }
  });
  js.definedJavelinSymbols = Object.keys(defines);
  js.requiredJavelinSymbols = Object.keys(requires);
  callback(messages, js);
};

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
        js.isModule = false;
        js.id = value.split(/\s+/)[0];
        break;
      case 'providesModule':
        js.isModule = true;
        js.id = value.split(/\s+/)[0];
        break;
      case 'providesLegacy':
        js.isRunWhenReady = true;
        js.isLegacy = true;
        js.isModule = true;
        js.id = 'legacy:' + value.split(/\s+/)[0];
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
      case 'suggests':
        messages.addClowntownError(js.path, 'docblock',
          '@suggests is deprecated. Simply use the Bootloader APIs.');
        break;
      case 'author':
      case 'deprecated':
        // Support these so Diviner can pick them up.
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

  // fail fast if ignored
  if (js.options.ignore) {
    callback(messages, js);
    return;
  }

  // resolve module ids through configuration
  if (js.isModule) {
    // require calls outside of modules are not supported
    if (configuration) {
      if (!js.id) {
        js.id = configuration.resolveID(js.path);
      }
    }
    js.requiredModules = js.requiredModules.concat(
      extract.requireCalls(sourceCode));

    if (this.options.extracSpecialRequires) {
      js.requiredDynamicModules =
        extract.requireDynamicCalls(sourceCode);
      js.requiredLazyModules =
        extract.requireLazyCalls(sourceCode);
      js.suggests = extract.loadModules(sourceCode);
      js.requiredDynamicModules =
        extract.cxModules(sourceCode);
    }
  } else {
    if (this.options.extracSpecialRequires) {
      js.suggests = extract.loadComponents(sourceCode);
    }
  }

  // call generated function
  this.extractExtra(js, sourceCode, messages, callback);
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
  resources.forEach(function(r) {
    var required = r.requiredModules;
    for (var i = 0; i < required.length; i++) {
      var req = required[i];
      if (req.charAt(0) === '.') {
        var relative = path.join(path.dirname(r.path), req);
        var resource = map.getResourceByPath(relative + '.js') ||
          map.getResourceByPath(relative + '/index.js');
        if (!resource) {
          //logError('Cannot resolve local path ' + req + ' in ' + r.path);
        } else {
          req = resource.id;
          required[i] = req;
        }
      }
    }
  });
  process.nextTick(function() {
    callback(messages);
  });
};

module.exports = JSLoader;


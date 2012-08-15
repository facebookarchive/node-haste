/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
/*jslint proto:true*/

var inherits = require('util').inherits;
var fs = require('fs');
var zlib = require('zlib');
var childProcess = require('child_process');

var JSLite = require('./JSLite');

/**
 * Resource for *.js files
 * A heavier version of JS that does extract more information (gziped size).
 * @extends {JSLite}
 * @class
 * @param {String} path path of the resource
 */
function JS(path) {
  JSLite.call(this, path);
  this.networkSize = 0;
  this.definedJavelinSymbols = [];
  this.requiredJavelinSymbols = [];
}
inherits(JS, JSLite);
JS.__proto__ = JSLite;

JS.prototype.type = 'JS';
JS.prototype.version = '0.1';


JS.javelinsymbolsPath = '/scripts/javelin/javelinsymbols';
function extractJavelinSymbols(js, code, callback) {
  var child = childProcess.exec(JS.javelinsymbolsPath);
  var result = '';
  child.stdout.setEncoding('utf-8');
  child.stdout.on('data', function(d) {
    result += d;
  });
  child.on('exit', function() {
    parseJavelinResult(js, result, callback);
  });
  child.stdin.end(code, 'utf-8');
}

function parseJavelinResult(js, output, callback) {
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
      // JX.behavior
      case '*':
        name = 'JX.' + line.split('.')[1];
        delete requires[name];
        defines[name] = true;
        // Behaviors require JX.behavior
        requires['JX.behavior'] = true;
        js.id = name;
        break;

      // JX.<anything else>
      case '?':
        name = 'javelin-behavior-' + line.substr(1);
        if (!defines[name]) {
          requires[name] = true;
        }
        break;
    }
  });
  js.definedJavelinSymbols = Object.keys(defines);
  js.requiredJavelinSymbols = Object.keys(requires);
  callback(js);
}

JS.initFromSource = function(js, configuration, sourceCode, callback) {
  JSLite.initFromSource(js, configuration, sourceCode, function() {
    if (js.options.ignore) {
      callback(js);
      return;
    }
    zlib.deflate(sourceCode, function(err, buffer) {
      js.networkSize = buffer.length;
      if (js.isJavelin) {
        extractJavelinSymbols(js, sourceCode, callback);
      } else {
        callback(js);
      }
    });
  });
};

module.exports = JS;

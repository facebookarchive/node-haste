/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
var path = require('path');
var MessageList = require('./MessageList');

function AnalyzeChangedTask(loaders, configurationTrie, options) {
  this.loaders = loaders;
  this.configurationTrie = configurationTrie;
  this.maxOpenFiles = options && options.maxOpenFiles || 200;
  this.maxProcesses = options && options.maxProcesses || 4;
}

AnalyzeChangedTask.fromObject = function(object) {
  var ResourceLoader = require('./loader/ResourceLoader');
  var loaders = object.loaders.map(ResourceLoader.fromObject, this);
  var ConfigurationTrie = require('./ConfigurationTrie');
  var trie = new ConfigurationTrie.fromObject(object.trie);
  return new AnalyzeChangedTask(loaders, trie, {
    maxOpenFiles: object.maxOpenFiles
  });
};

AnalyzeChangedTask.prototype.toObject = function() {
  return {
    loaders: this.loaders.map(function(l) {
      return l.toObject();
    }),
    trie: this.configurationTrie.toObject(),
    maxOpenFiles: this.maxOpenFiles
  };
};

AnalyzeChangedTask.prototype.runInAFork = function(paths, callback) {
  var cp = require('child_process');
  var child = cp.fork(__dirname + '/analyze-changed.js');
  var typeMap = {};
  this.loaders.forEach(function(loader) {
    loader.getResourceTypes().forEach(function(type) {
      typeMap[type.prototype.type] = type;
    });
  });

  child.on('message', function(m) {
    var messages = MessageList.fromObject(m.messages);
    var resources = m.resources.map(function(obj) {
      var type = typeMap[obj.type];
      return type.fromObject(obj);
    });
    callback(messages, resources, m.skipped);
  }.bind(this));

  child.send({
    task: this.toObject(),
    paths: paths
  });
};

AnalyzeChangedTask.prototype.runInForks = function(n, paths, callback) {
  var buckets = [];
  var waiting = n;
  for (var i = 0; i < n; i++) {
    buckets[i] = [];
  }
  paths.forEach(function(p, i) {
    buckets[i % n].push(p);
  });

  var skipped = [];
  var messages = MessageList.create();
  var resources = [];
  var complete = function(m, r, s) {
    messages.mergeAndRecycle(m);
    resources = resources.concat(r);
    skipped = skipped.concat(s);
    if (--waiting === 0) {
      callback(messages, resources, skipped);
    }
  };

  buckets.forEach(function(paths) {
    this.runInAFork(paths, complete);
  }, this);
};

AnalyzeChangedTask.prototype.runOptimaly = function(paths, callback) {
  var n = Math.min(
    this.maxProcesses,
    Math.floor(paths.length / this.maxOpenFiles));

  if (n > 1) {
    this.runInForks(n, paths, callback);
  } else {
    this.run(paths, callback);
  }
};

AnalyzeChangedTask.prototype.run = function(paths, callback) {
  var trie = this.configurationTrie;
  var loaders = this.loaders;
  var maxOpenFiles = this.maxOpenFiles;

  var messages = MessageList.create();
  var waiting = paths.length;
  var active = 0;
  var next;
  var result = [];
  var skipped = [];

  function resourceLoaded(m, resource) {
    messages.mergeAndRecycle(m);
    result.push(resource);
    waiting--;
    active--;
    next();
  }

  next = function() {
    while (active < maxOpenFiles && paths.length) {
      var path = paths.shift();
      var loader = null;

      for (var i = 0; i < loaders.length; i++) {
        if (loaders[i].matchPath(path)) {
          loader = loaders[i];
          break;
        }
      }

      if (loader) {
        active++;
        var configuration = trie.findConfiguration(path);
        loader.loadFromPath(path, configuration, resourceLoaded);
      } else {
        // if we reached this point the resource was not analyzed because of the
        // missing type
        skipped.push(path);
        waiting--;
      }
    }
    if (waiting === 0 && paths.length === 0) {
      callback(messages, result, skipped);
    }
  };

  next();
};

module.exports = AnalyzeChangedTask;

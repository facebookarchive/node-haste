/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */

var path = require('path');
var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;

var ProjectConfiguration = require('./resource/ProjectConfiguration');
var ConfigurationTrie = require('./ConfigurationTrie');

/**
 * A task represention a map rebuild operation
 * @class
 * @param {FileFinder}    finder
 * @param {ResourceTypes} resourceTypes
 * @param {ResourceMap}   map
 */
function MapUpdateTask(finder, resourceTypes, map, options) {
  this.finder = finder;
  this.map = map;
  this.resourceTypes = resourceTypes;
  this.maxOpenFiles = options && options.maxOpenFiles || 200;

  this.files = [];
  this.changed = [];
  this.changedPaths = {};
  this.newConfigurations = {};
  this.skipped = [];
  this.toPostProcess = {};
}
inherits(MapUpdateTask, EventEmitter);

/**
 * Runs the task
 * @public
 */
MapUpdateTask.prototype.run = function() {
  this.finder.find(function(files) {
    this.files = files;
    this.emit('found', files);
    this.markChangedFiles(function() {
      this.emit('changed-files', this.changed);
      this.processChangedConfigurations(function() {
        this.emit('changed', this.changed);
        this.analyzeChanged(function() {
          this.emit('analyzed', this.changed);
          this.postProcess(function() {
            this.emit('postProcessed', this.changed);
            this.updateMap(function() {
              this.emit('complete', this.map);
            });
          });
        });
      });
    });
  }.bind(this));
};

/**
 * @protected
 * @param {String}   newPath
 * @param {Resource} oldResource
 */
MapUpdateTask.prototype.markAsChanged = function(mtime, newPath, oldResource) {
  var filePath = newPath || oldResource.path;
  if (!this.changedPaths[filePath]) {
    this.changedPaths[filePath] = 1;
    this.changed.push({
      mtime: mtime,
      newPath: newPath,
      oldResource: oldResource,
      path: filePath
    });
  }
};

/**
 * Go through found files and existing map and mark files as changed
 * @param  {Function} callback
 */
MapUpdateTask.prototype.markChangedFiles = function(callback) {
  var visited = {};

  this.files.forEach(function(pair) {
    var filePath = pair[0];
    var mtime = pair[1];
    visited[filePath] = true;
    var resource = this.map.getResourceByPath(filePath);
    if (!resource) {
      this.markAsChanged(mtime, filePath, null);
    } else if (resource.mtime < mtime) {
      this.markAsChanged(mtime, filePath, resource);
    }
  }, this);

  this.map.getAllResources().forEach(function(resource) {
    if (!visited[resource.path]) {
      this.markAsChanged(resource.mtime, null, resource);
    }
  }, this);
  callback.call(this);
};

/**
 * Mark all files touched by changes in configuration
 * @param  {Function} callback
 */
MapUpdateTask.prototype.processChangedConfigurations = function(callback) {
  var toLoad = [];
  var affected = [];

  var changedConfigurations = this.changed.filter(function(record) {
    return ProjectConfiguration.matchPath(record.path);
  });
  changedConfigurations.forEach(function(record) {
    if (record.newPath) {
      toLoad.push(record);
    }
    if (record.oldResource) {
      affected.push(record.oldResource);
    }
  });

  var next = function() {
    var affectedDirectories = [];
    affected.forEach(function(resource) {
      affectedDirectories.push
        .apply(affectedDirectories, resource.getHasteDirectories());
    }, this);
    if (affectedDirectories.length) {
      var regex = new RegExp('^' + '(' + affectedDirectories.join('|') + ')');
      this.files.forEach(function(pair) {
        if (regex.test(pair[0])) {
          this.markAsChanged(
            pair[1],
            pair[0],
            this.map.getResourceByPath(pair[0]));
        }
      }, this);
    }
    callback.call(this);
  }.bind(this);

  if (toLoad.length) {
    var waiting = toLoad.length;
    var me = this;
    toLoad.forEach(function(record) {
      ProjectConfiguration
      .loadFromPath(null, record.newPath, function(resource) {
        resource.mtime = record.mtime;
        record.newResource = resource;
        me.newConfigurations[resource.path] = resource;
        affected.push(resource);
        if (--waiting === 0) {
          next();
        }
      });
    });
  } else {
    next();
  }
};

/**
 * Parse and analyze changed files
 * @protected
 * @param  {Function} callback
 */
MapUpdateTask.prototype.analyzeChanged = function(callback) {
  if (!this.changed.length) {
    callback.call(this);
    return;
  }

  var configurations = this.files.filter(function(pair) {
    return ProjectConfiguration.matchPath(pair[0]);
  }, this).map(function(pair) {
    return this.newConfigurations[pair[0]] ||
      this.map.getResourceByPath(pair[0]);
  }, this);

  var trie = new ConfigurationTrie(configurations);

  // if resource was preloaded earlier just skip
  var toLoad = this.changed.filter(function(record) {
    return !record.newResource;
  });

  var waiting = 0;
  var next;
  function resourceLoaded(record, type, resource) {
    if (type.postProcess) {
      if (!this.toPostProcess[resource.type]) {
        this.toPostProcess[resource.type] = [];
      }
      this.toPostProcess[resource.type].push(resource);
    }
    resource.mtime = record.mtime;
    record.newResource = resource;
    waiting--;
    next();
  }

  next = function() {
    while (waiting < this.maxOpenFiles && toLoad.length) {
      var record = toLoad.shift();
      var type = this.resourceTypes.typeForPath(record.path);
      if (type) {
        waiting++;
        var configuration = trie.findConfiguration(record.path);
        if (record.oldResource) {
          type.updateFromPath(
            configuration,
            record.path,
            record.oldResource,
            resourceLoaded.bind(this, record, type));
        } else {
          type.loadFromPath(
            configuration,
            record.path,
            resourceLoaded.bind(this, record, type));
        }
      } else {
        // if we reached this point the resource was not analyzed because of the
        // missing type
        this.skipped.push(record);
      }
    }
    if (waiting === 0 && !toLoad.length) {
      callback.call(this);
    }
  }.bind(this);

  next();
};

MapUpdateTask.prototype.postProcess = function(callback) {
  var waiting = 0;
  var me = this;
  function finished() {
    if (--waiting === 0) {
      callback.call(me);
    }
  }
  Object.keys(this.toPostProcess).forEach(function(typeName) {
    waiting++;
    this.resourceTypes.getType(typeName)
      .postProcess(this.toPostProcess[typeName], finished);
  }, this);

  if (waiting === 0) {
    callback.call(this);
  }
};

/**
 * Update existing map with the changes
 * @param  {Function} callback
 */
MapUpdateTask.prototype.updateMap = function(callback) {
  this.changed.forEach(function(record) {
    if (!record.newPath) {
      this.map.removeResource(record.oldResource);
    } else if (record.newResource && record.oldResource) {
      this.map.updateResource(record.oldResource, record.newResource);
    } else if (record.newResource) {
      this.map.addResource(record.newResource);
    }
  }, this);
  callback.call(this);
};

module.exports = MapUpdateTask;

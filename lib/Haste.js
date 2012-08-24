/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;

var MapUpdateTask = require('./MapUpdateTask');
var ResourceMap = require('./ResourceMap');
var ResourceMapSerializer = require('./ResourceMapSerializer');
var FileFinder = require('./FileFinder');

/*
 *
 *                             ____________________________
 *                                                           .OOo
 *                                                           OOOOL
 *                                  __________________    .. JOOO?
 *                                                     .eSSSSSS**'
 *                                                   gSSSSSSSSSS    6.
 *                                                   oo  SSSSSSSs  .G
 *                                      ___________   oo SSSSSSSSSgG
 *                                                     *ISSSSSS  **
 *                                                      SSSSSSS
 *                                                    .oYSSSSSY.
 *                                                    OOOOOOOOOOOg
 *                                                   .OOOOT**TOOOOO.
 *                        ______________________    .OOOO'     'OOOOO.
 *                                                 .OOOO'         OOOO'
 *                                              .oOOOO*        .OOOO*
 *                                            .OOOOO''       .OOOOO
 *                                         .JOOOO*         .##OOO'
 *                                        C##?/             T##I
 *                                         Y#|                'V
 *    Node Haste ________________________   C
 *
 */

/**
 * @class Haste. A nice facade to node-haste system
 *
 * Running a node haste update task is a pretty complicated matter. You have
 * to manually create a FileFinder, a MapUpdateTask, a ResourceMapSerializer.
 * Haste class automates all of this providing a task oriented API with a
 * broad set of configuration options. The only 2 required parameters are
 * loaders and scanDirs
 *
 * @extends {EventEmitter}
 *
 * @example
 *   var Haste = require('node-haste/Haste');
 *   var loaders = require('node-haste/loaders');
 *
 *   var haste = new Haste(
 *   [
 *     new loaders.JSLoader({ networkSize: true }),
 *     new loaders.CSSLoader({ networkSize: true }),
 *     new ProjectConfigurationLoader(),
 *     new ResourceLoader()
 *   ],
 *   ['html']);
 *
 *   haste.update('.cache', function(map) {
 *     assert(map instanceof ResourceMap);
 *   });
 *
 *
 * @param {Array.<Loader>}  loaders              Preconfigured Loader instances
 * @param {Array.<String>}  scanDirs
 * @param {FileFinder|null} options.finder       Custom finder instance
 * @param {ResourceMapSerializer|null} options.serializer Custom serializer
 * @param {Number|null}   options.maxOpenFiles   Maximum number of loaders
 *                                               MapUpdateTask can use
 * @param {Boolean|null}  options.useNativeFind  Whether to use native shell
 *                                               find command (faster) or node
 *                                               implementation (safer)
 * @param {function|null} options.ignorePaths    Function to reject paths
 * @param {String|null}   options.version        Version of the cache. If
 *                                               the version mismatches the
 *                                               cached on, cache will be
 *                                               ignored
 *
 */
function Haste(loaders, scanDirs, options) {
  this.loaders = loaders;
  this.scanDirs = scanDirs;
  this.options = options || {};
  this.finder = options.finder || null;
  this.serializer = options.serializer || null;
}
inherits(Haste, EventEmitter);

/**
 * All in one function:
 *  1) load cache if exists
 *  2) compare to the existing files
 *  3) analyze changes,
 *  4) update map,
 *  5) write cache back to disk
 *  6) return map
 *
 * @param  {String}   path
 * @param  {Function} callback
 */
Haste.prototype.update = function(path, callback) {
  var me = this;
  this.loadOrCreateMap(path, function(map) {
    me.emit('mapLoaded');
    var task = me.updateMap(map, function() {
      // only store map if it's changed
      var mapChanged = task.changed.length > task.skipped.length;
      if (mapChanged) {
        me.storeMap(path, map, function() {
          me.emit('mapStored');
          callback(map);
        })
      } else {
        callback(map);
      }
    });
  });
};

/**
 * Updates a map using the configuration options from constructor
 * @param  {ResourceMap}   map
 * @param  {Function} callback
 */
Haste.prototype.updateMap = function(map, callback) {
  return this.createUpdateTask(map).on('complete', callback).run();
};

/**
 * Loads map from a file
 * @param  {String}   path
 * @param  {Function} callback
 */
Haste.prototype.loadMap = function(path, callback) {
  this.getSerializer().loadFromPath(path, callback);
};

/**
 * Loads map from a file or creates one if cache is not available
 * @param  {String}   path
 * @param  {Function} callback
 */
Haste.prototype.loadOrCreateMap = function(path, callback) {
  this.getSerializer().loadFromPath(path, function(err, map) {
    callback(map || new ResourceMap());
  });
};

/**
 * Stores the map cache
 * @param  {String}   path
 * @param  {ResourceMap}   map
 * @param  {Function} callback
 */
Haste.prototype.storeMap = function(path, map, callback) {
  this.getSerializer().storeToPath(path, map, callback);
};



/**
 * @protected
 * @param {ResourceMap} map
 * @return {MapUpdateTask}
 */
Haste.prototype.createUpdateTask = function(map) {
  var task = new MapUpdateTask(
    this.getFinder(),
    this.loaders,
    map,
    {
      maxOpenFiles: this.options.maxOpenFiles
    });

  var events =
    ['found', 'changed', 'analyzed', 'mapUpdated', 'postProcessed', 'complete']
  var me = this;
  events.forEach(function(name) {
    task.on(name, function(value) {
      me.emit(name, value)
    });
  });
  return task;
};

/**
 * @protected
 * @return {FileFinder}
 */
Haste.prototype.getFinder = function() {
  if (!this.finder) {
  var ext = {};
    this.loaders.forEach(function(loader) {
      loader.getExtensions().forEach(function(e) {
        ext[e] = true;
      });
    });
    this.finder = new FileFinder({
      scanDirs: this.scanDirs,
      extensions: Object.keys(ext),
      useNative: this.options.useNativeFind,
      ignore: this.options.ignorePaths
    });
  }
  return this.finder;
};

/**
 * @protected
 * @return {ResourceMapSerializer}
 */
Haste.prototype.getSerializer = function() {
  return this.serializer || new ResourceMapSerializer(
    this.loaders,
    { version: this.options.version });
};

module.exports = Haste;
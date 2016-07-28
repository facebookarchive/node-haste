/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.dontMock('util').dontMock('events').dontMock('../').setMock('child_process', {
  execSync: function execSync() {
    return '/usr/bin/watchman';
  }
});

var sane = require('sane');

describe('FileWatcher', function () {
  var WatchmanWatcher = void 0;
  var FileWatcher = void 0;
  var config = void 0;

  beforeEach(function () {
    WatchmanWatcher = sane.WatchmanWatcher;
    WatchmanWatcher.prototype.once.mockImplementation(function (type, callback) {
      return callback();
    });

    FileWatcher = require('../');

    config = [{
      dir: 'rootDir',
      globs: ['**/*.js', '**/*.json']
    }];
  });

  pit('gets the watcher instance when ready', function () {
    var fileWatcher = new FileWatcher(config);
    return fileWatcher.getWatchers().then(function (watchers) {
      watchers.forEach(function (watcher) {
        expect(watcher instanceof WatchmanWatcher).toBe(true);
      });
    });
  });

  pit('emits events', function () {
    var cb = void 0;
    WatchmanWatcher.prototype.on.mockImplementation(function (type, callback) {
      cb = callback;
    });
    var fileWatcher = new FileWatcher(config);
    var handler = jest.genMockFn();
    fileWatcher.on('all', handler);
    return fileWatcher.getWatchers().then(function (watchers) {
      cb(1, 2, 3, 4);
      jest.runAllTimers();
      expect(handler.mock.calls[0]).toEqual([1, 2, 3, 4]);
    });
  });

  pit('ends the watcher', function () {
    var fileWatcher = new FileWatcher(config);
    WatchmanWatcher.prototype.close.mockImplementation(function (callback) {
      return callback();
    });

    return fileWatcher.end().then(function () {
      expect(WatchmanWatcher.prototype.close).toBeCalled();
    });
  });
});
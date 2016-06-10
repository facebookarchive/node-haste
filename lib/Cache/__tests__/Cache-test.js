/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.dontMock('absolute-path').dontMock('../');

jest.mock('fs').setMock('os', {
  tmpDir: function tmpDir() {
    return 'tmpDir';
  }
});

jest.useRealTimers();

var fs = require('graceful-fs');

var Cache = require('../');

describe('Cache', function () {
  describe('getting/setting', function () {
    pit('calls loader callback for uncached file', function () {
      fs.stat.mockImpl(function (file, callback) {
        callback(null, {
          mtime: {
            getTime: function getTime() {}
          }
        });
      });

      var cache = new Cache({
        cacheKey: 'cache'
      });
      var loaderCb = jest.genMockFn().mockImpl(function () {
        return Promise.resolve();
      });

      return cache.get('/rootDir/someFile', 'field', loaderCb).then(function ($) {
        return expect(loaderCb).toBeCalledWith('/rootDir/someFile');
      });
    });

    pit('supports storing multiple fields', function () {
      fs.stat.mockImpl(function (file, callback) {
        callback(null, {
          mtime: {
            getTime: function getTime() {}
          }
        });
      });

      var cache = new Cache({
        cacheKey: 'cache'
      });
      var index = 0;
      var loaderCb = jest.genMockFn().mockImpl(function () {
        return Promise.resolve(index++);
      });

      return cache.get('/rootDir/someFile', 'field1', loaderCb).then(function (value) {
        expect(value).toBe(0);
        return cache.get('/rootDir/someFile', 'field2', loaderCb).then(function (value2) {
          return expect(value2).toBe(1);
        });
      });
    });

    pit('gets the value from the loader callback', function () {
      fs.stat.mockImpl(function (file, callback) {
        return callback(null, {
          mtime: {
            getTime: function getTime() {}
          }
        });
      });

      var cache = new Cache({
        cacheKey: 'cache'
      });
      var loaderCb = jest.genMockFn().mockImpl(function () {
        return Promise.resolve('lol');
      });

      return cache.get('/rootDir/someFile', 'field', loaderCb).then(function (value) {
        return expect(value).toBe('lol');
      });
    });

    pit('caches the value after the first call', function () {
      fs.stat.mockImpl(function (file, callback) {
        callback(null, {
          mtime: {
            getTime: function getTime() {}
          }
        });
      });

      var cache = new Cache({
        cacheKey: 'cache'
      });
      var loaderCb = jest.genMockFn().mockImpl(function () {
        return Promise.resolve('lol');
      });

      return cache.get('/rootDir/someFile', 'field', loaderCb).then(function () {
        var shouldNotBeCalled = jest.genMockFn();
        return cache.get('/rootDir/someFile', 'field', shouldNotBeCalled).then(function (value) {
          expect(shouldNotBeCalled).not.toBeCalled();
          expect(value).toBe('lol');
        });
      });
    });

    pit('clears old field when getting new field and mtime changed', function () {
      var mtime = 0;
      fs.stat.mockImpl(function (file, callback) {
        callback(null, {
          mtime: {
            getTime: function getTime() {
              return mtime++;
            }
          }
        });
      });

      var cache = new Cache({
        cacheKey: 'cache'
      });
      var loaderCb = jest.genMockFn().mockImpl(function () {
        return Promise.resolve('lol' + mtime);
      });

      return cache.get('/rootDir/someFile', 'field1', loaderCb).then(function (value) {
        return cache.get('/rootDir/someFile', 'field2', loaderCb).then(function (value2) {
          return cache.get('/rootDir/someFile', 'field1', loaderCb).then(function (value3) {
            return expect(value3).toBe('lol2');
          });
        });
      });
    });
  });

  describe('loading cache from disk', function () {
    var fileStats;

    beforeEach(function () {
      fileStats = {
        '/rootDir/someFile': {
          mtime: {
            getTime: function getTime() {
              return 22;
            }
          }
        },
        '/rootDir/foo': {
          mtime: {
            getTime: function getTime() {
              return 11;
            }
          }
        }
      };

      fs.existsSync.mockImpl(function () {
        return true;
      });

      fs.statSync.mockImpl(function (filePath) {
        return fileStats[filePath];
      });

      fs.readFileSync.mockImpl(function () {
        return JSON.stringify({
          '/rootDir/someFile': {
            metadata: { mtime: 22 },
            data: { field: 'oh hai' }
          },
          '/rootDir/foo': {
            metadata: { mtime: 11 },
            data: { field: 'lol wat' }
          }
        });
      });
    });

    pit('should load cache from disk', function () {
      var cache = new Cache({
        cacheKey: 'cache'
      });
      var loaderCb = jest.genMockFn();

      return cache.get('/rootDir/someFile', 'field', loaderCb).then(function (value) {
        expect(loaderCb).not.toBeCalled();
        expect(value).toBe('oh hai');

        return cache.get('/rootDir/foo', 'field', loaderCb).then(function (val) {
          expect(loaderCb).not.toBeCalled();
          expect(val).toBe('lol wat');
        });
      });
    });

    pit('should not load outdated cache', function () {
      fs.stat.mockImpl(function (file, callback) {
        return callback(null, {
          mtime: {
            getTime: function getTime() {}
          }
        });
      });

      fileStats['/rootDir/foo'].mtime.getTime = function () {
        return 123;
      };

      var cache = new Cache({
        cacheKey: 'cache'
      });
      var loaderCb = jest.genMockFn().mockImpl(function () {
        return Promise.resolve('new value');
      });

      return cache.get('/rootDir/someFile', 'field', loaderCb).then(function (value) {
        expect(loaderCb).not.toBeCalled();
        expect(value).toBe('oh hai');

        return cache.get('/rootDir/foo', 'field', loaderCb).then(function (val) {
          expect(loaderCb).toBeCalled();
          expect(val).toBe('new value');
        });
      });
    });
  });

  describe('writing cache to disk', function () {
    it('should write cache to disk', function (done) {
      var index = 0;
      var mtimes = [10, 20, 30];

      fs.stat.mockImpl(function (file, callback) {
        return callback(null, {
          mtime: {
            getTime: function getTime() {
              return mtimes[index++];
            }
          }
        });
      });

      var cache = new Cache({
        cacheKey: 'cache'
      });

      cache.get('/rootDir/bar', 'field', function () {
        return Promise.resolve('bar value');
      });
      cache.get('/rootDir/foo', 'field', function () {
        return Promise.resolve('foo value');
      });
      cache.get('/rootDir/baz', 'field', function () {
        return Promise.resolve('baz value');
      });

      setTimeout(function () {
        expect(fs.writeFile).toBeCalled();
        done();
      }, 2001);
    });
  });

  describe('check for cache presence', function () {
    it('synchronously resolves cache presence', function () {
      fs.stat.mockImpl(function (file, callback) {
        return callback(null, {
          mtime: {
            getTime: function getTime() {}
          }
        });
      });

      var cache = new Cache({
        cacheKey: 'cache'
      });
      var loaderCb = jest.genMockFn().mockImpl(function () {
        return Promise.resolve('banana');
      });
      var file = '/rootDir/someFile';

      return cache.get(file, 'field', loaderCb).then(function () {
        expect(cache.has(file)).toBe(true);
        expect(cache.has(file, 'field')).toBe(true);
        expect(cache.has(file, 'foo')).toBe(false);
      });
    });
  });

  describe('invalidate', function () {
    it('invalidates the cache per file or per-field', function () {
      fs.stat.mockImpl(function (file, callback) {
        return callback(null, {
          mtime: {
            getTime: function getTime() {}
          }
        });
      });

      var cache = new Cache({
        cacheKey: 'cache'
      });
      var loaderCb = jest.genMockFn().mockImpl(function () {
        return Promise.resolve('banana');
      });
      var file = '/rootDir/someFile';

      return cache.get(file, 'field', loaderCb).then(function () {
        expect(cache.has(file)).toBe(true);
        cache.invalidate(file, 'field');
        expect(cache.has(file)).toBe(true);
        expect(cache.has(file, 'field')).toBe(false);
        cache.invalidate(file);
        expect(cache.has(file)).toBe(false);
      });
    });
  });
});
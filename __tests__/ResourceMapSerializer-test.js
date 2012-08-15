/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 * @emails javascript@lists.facebook.com voloko@fb.com
 */

describe('ResourceMapSerializer', function() {
  var ResourceMapSerializer = require('../lib/ResourceMapSerializer');
  var ResourceTypes = require('../lib/ResourceTypes');
  var ResourceMap = require('../lib/ResourceMap');
  var JS = require('../lib/resource/JS');
  var JSTest = require('../lib/resource/JSTest');
  var CSS = require('../lib/resource/CSS');

  it('should serialize resource map with a single object', function() {
    var types = new ResourceTypes([JSTest, JS, CSS]);
    var serializer = new ResourceMapSerializer(types);
    var map = new ResourceMap([
      JS.fromObject({
        path: 'a/b.js',
        id: 'b',
        requiredModules: ['foo', 'bar']
      })
    ]);

    var map2 = serializer.fromObject(serializer.toObject(map));
    expect(map2.getAllResources().length).toBe(1);
    expect(map2.getResource('JS', 'b').requiredModules).toEqual(['foo', 'bar']);
  });

  it('should serialize resource map with multiple objects', function() {
    var types = new ResourceTypes([JSTest, JS, CSS]);
    var serializer = new ResourceMapSerializer(types);
    var map = new ResourceMap([
      JS.fromObject({
        path: 'a/b.js',
        id: 'b',
        requiredModules: ['foo', 'bar']
      }),
      CSS.fromObject({
        path: 'a/b.css',
        id: 'b-css'
      })
    ]);

    var map2 = serializer.fromObject(serializer.toObject(map));
    expect(map2.getAllResources().length).toBe(2);
    expect(map2.getResource('JS', 'b') instanceof JS).toBe(true, 'JS');
    expect(map2.getResource('CSS', 'b-css') instanceof CSS).toBe(true, 'CSS');
  });

  it('should serialize to a file', function() {
    var fs = require('fs');
    var data = null;
    spyOn(fs, 'writeFile').andCallFake(function(path, d, enc, callback) {
      data = d;
      callback();
    });
    spyOn(fs, 'readFile').andCallFake(function(path, enc, callback) {
      callback(null, data);
    });
    var types = new ResourceTypes([JSTest, JS, CSS]);
    var serializer = new ResourceMapSerializer(types);
    var map = new ResourceMap([
      JS.fromObject({
        path: 'a/b.js',
        id: 'b',
        requiredModules: ['foo', 'bar']
      })
    ]);

    var map2 = null;
    runs(function() {
      serializer.storeToPath('tmp', map, function() {
        serializer.loadFromPath('tmp', function(err, m) {
          map2 = m;
        });
      });
    });

    waitsFor(function() {
      return map2;
    }, 100);

    runs(function() {
      expect(fs.writeFile).toHaveBeenCalled();
      expect(fs.readFile).toHaveBeenCalled();
      expect(map2.getAllResources().length).toBe(1);
      expect(map2.getResource('JS', 'b').requiredModules)
        .toEqual(['foo', 'bar']);
    });
  });
});

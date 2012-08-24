/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 * @emails javascript@lists.facebook.com voloko@fb.com
 */

describe("MapUpdateTask", function() {
  var MapUpdateTask = require('../lib/MapUpdateTask');
  var Resource = require('../lib/resource/Resource');
  var ResourceLoader = require('../lib/loader/ResourceLoader');
  var ResourceMap = require('../lib/ResourceMap');
  var ProjectConfiguration = require('../lib/resource/ProjectConfiguration');
  var ProjectConfigurationLoader =
    require('../lib/loader/ProjectConfigurationLoader');
  var waitsForCallback = require('../lib/test_helpers/waitsForCallback');

  function createFinderSpy(data) {
    var finder = createSpyObj('FileFinder', ['find']);
    finder.find.andCallFake(function(callback) {
      callback(data);
    });
    return finder;
  }

  function expectChanges(changed, expected) {
    expect(changed.length).toBe(expected.length);
    var pathMap = {};
    changed.map(function(record) {
      pathMap[record.path] = record;
    });
    expected.forEach(function(pair) {
      expect(pathMap[pair[1]]).toBeDefined('Change exists ' + pair[1]);
      if (pair[0] === 'added') {
        expect(pathMap[pair[1]].oldResource).toBe(null);
        expect(pathMap[pair[1]].newPath).toBe(pair[1]);
      } else if (pair[0] === 'changed') {
        expect(pathMap[pair[1]].oldResource.path).toBe(pair[1]);
        expect(pathMap[pair[1]].newPath).toBe(pair[1]);
      } else if (pair[0] === 'removed') {
        expect(pathMap[pair[1]].oldResource.path).toBe(pair[1]);
        expect(pathMap[pair[1]].newPath).toBe(null);
      }
    });
  }

  function addMtime(mtime, resource) {
    resource.mtime = mtime;
    return resource;
  }

  it("should find changed files", function() {
    var finder = createFinderSpy([
      ['sub/added.js', 1300000000000],
      ['changed.js', 1300000000000],
      ['unmodified.js', 1300000000000]
    ]);
    var map = new ResourceMap([
      addMtime(1200000000000, new Resource('sub/removed.js')),
      addMtime(1200000000000, new Resource('changed.js')),
      addMtime(1300000000000, new Resource('unmodified.js'))
    ]);
    var task = new MapUpdateTask(
      finder,
      [],
      map);
    var changed;

    runs(function() {
      task.on('changed', function(tmp) {
        changed = tmp;
      });
      task.run();
    });

    waitsFor(function() {
      return changed;
    }, 300);

    runs(function() {
      expectChanges(changed, [
        ['added', 'sub/added.js'],
        ['removed', 'sub/removed.js'],
        ['changed', 'changed.js']
      ]);
    });
  });

  it('should find changes on package.json deletion', function() {
    var finder = createFinderSpy([
      ['p1/a/1.js', 1300000000000],
      ['p1/b/2.js', 1300000000000]
    ]);
    var map = new ResourceMap([
      addMtime(1300000000000, new Resource('p1/a/1.js')),
      addMtime(1300000000000, new Resource('p1/b/2.js')),
      addMtime(1300000000000, new ProjectConfiguration('p1/package.json', {}))
    ]);
    var task = new MapUpdateTask(
      finder,
      [],
      map);
    var changed;

    runs(function() {
      task.on('changed', function(tmp) {
        changed = tmp;
      });
      task.run();
    });

    waitsFor(function() {
      return changed;
    }, 300);

    runs(function() {
      expectChanges(changed, [
        ['changed', 'p1/a/1.js'],
        ['changed', 'p1/b/2.js'],
        ['removed', 'p1/package.json']
      ]);
    });
  });

  it('should find changes on package.json deletion + haste dirs', function() {
    var finder = createFinderSpy([
      ['p1/a/1.js', 1300000000000],
      ['p1/b/2.js', 1300000000000]
    ]);
    var map = new ResourceMap([
      addMtime(1300000000000, new Resource('p1/a/1.js')),
      addMtime(1300000000000, new Resource('p1/b/2.js')),
      addMtime(1300000000000, new ProjectConfiguration('p1/package.json', {
        haste: { roots: ['a'] }
      }))
    ]);
    var task = new MapUpdateTask(finder, [], map);
    var changed;

    runs(function() {
      task.on('changed', function(tmp) {
        changed = tmp;
      });
      task.run();
    });

    waitsFor(function() {
      return changed;
    }, 300);

    runs(function() {
      expectChanges(changed, [
        ['changed', 'p1/a/1.js'],
        ['removed', 'p1/package.json']
      ]);
    });
  });

  it('should find changes on package.json addition', function() {
    var finder = createFinderSpy([
      ['p1/a/1.js', 1300000000000],
      ['p1/b/2.js', 1300000000000],
      ['p1/package.json', 1300000000000]
    ]);
    var map = new ResourceMap([
      addMtime(1300000000000, new Resource('p1/a/1.js')),
      addMtime(1300000000000, new Resource('p1/b/2.js'))
    ]);
    var configurationLoader = new ProjectConfigurationLoader();
    spyOn(configurationLoader, 'loadFromPath')
      .andCallFake(function(path, configuration, callback) {
        callback(
          new ProjectConfiguration('p1/package.json', {}));
      });

    var task = new MapUpdateTask(finder, [configurationLoader], map);
    var changed;

    runs(function() {
      task.on('changed', function(tmp) {
        changed = tmp;
      });
      task.run();
    });

    waitsFor(function() {
      return changed;
    }, 300);

    runs(function() {
      expectChanges(changed, [
        ['changed', 'p1/a/1.js'],
        ['changed', 'p1/b/2.js'],
        ['added', 'p1/package.json']
      ]);
    });
  });

  it('should find changes on package.json change', function() {
    var finder = createFinderSpy([
      ['p1/a/1.js', 1300000000000],
      ['p1/b/2.js', 1300000000000],
      ['p1/package.json', 1300000000000]
    ]);
    var map = new ResourceMap([
      addMtime(1300000000000, new Resource('p1/a/1.js')),
      addMtime(1300000000000, new Resource('p1/b/2.js')),
      addMtime(1200000000000, new ProjectConfiguration('p1/package.json', {
        haste: { roots: ['a'] }
      }))
    ]);
    var configurationLoader = new ProjectConfigurationLoader();
    spyOn(configurationLoader, 'loadFromPath')
      .andCallFake(function(path, configuration, callback) {
        expect(path).toBe('p1/package.json');
        callback(
          new ProjectConfiguration('p1/package.json', {}));
      });

    var task = new MapUpdateTask(finder, [configurationLoader], map);
    var changed;

    runs(function() {
      task.on('changed', function(tmp) {
        changed = tmp;
      });
      task.run();
    });

    waitsFor(function() {
      return changed;
    }, 300);

    runs(function() {
      expectChanges(changed, [
        ['changed', 'p1/a/1.js'],
        ['changed', 'p1/b/2.js'],
        ['changed', 'p1/package.json']
      ]);
    });
  });

  it('should find changes on package.json change + haste dirs', function() {
    var finder = createFinderSpy([
      ['p1/a/1.js', 1300000000000],
      ['p1/b/2.js', 1300000000000],
      ['p1/package.json', 1300000000000]
    ]);
    var map = new ResourceMap([
      addMtime(1300000000000, new Resource('p1/a/1.js')),
      addMtime(1300000000000, new Resource('p1/b/2.js')),
      addMtime(1200000000000, new ProjectConfiguration('p1/package.json', {
        haste: { roots: ['a'] }
      }))
    ]);
    var configurationLoader = new ProjectConfigurationLoader();
    spyOn(configurationLoader, 'loadFromPath')
      .andCallFake(function(path, configuration, callback) {
        callback(
          new ProjectConfiguration('p1/package.json', {
            haste: { roots: ['a'] }
          }));
      });

    var task = new MapUpdateTask(finder, [configurationLoader], map);
    var changed;

    runs(function() {
      task.on('changed', function(tmp) {
        changed = tmp;
      });
      task.run();
    });

    waitsFor(function() {
      return changed;
    }, 300);

    runs(function() {
      expectChanges(changed, [
        ['changed', 'p1/a/1.js'],
        ['changed', 'p1/package.json']
      ]);
    });
  });

  it('should load resource when changed', function() {
    var finder = createFinderSpy([
      ['sub/added.js', 1300000000000]
    ]);
    var map = new ResourceMap([]);
    var loader = new ResourceLoader();
    var task = new MapUpdateTask(finder, [loader], map);
    spyOn(loader, 'loadFromPath')
      .andCallFake(function(path, configuration, callback) {
        expect(path).toBe('sub/added.js');
        callback(new Resource('sub/added.js'));
      });

    waitsForCallback(
      function(callback) {
        task.on('complete', callback);
        task.run();
      },
      function() {}
    );
  });

  it('should update resource when changed', function() {
    var finder = createFinderSpy([
      ['sub/changed.js', 1300000000000]
    ]);
    var old = addMtime(1200000000000, new Resource('sub/changed.js'));
    var map = new ResourceMap([old]);
    var loader = new ResourceLoader();
    var task = new MapUpdateTask(finder, [loader], map);
    spyOn(loader, 'updateFromPath')
      .andCallFake(function(path, configuration, oldResource, callback) {
        expect(path).toBe('sub/changed.js');
        expect(oldResource).toBe(old);
        callback(new Resource('sub/changed.js'));
      });

    waitsForCallback(
      function(callback) {
        task.on('complete', callback);
        task.run();
      },
      function() {}
    );
  });

});

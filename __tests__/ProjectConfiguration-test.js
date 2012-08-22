/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 * @emails javascript@lists.facebook.com voloko@fb.com
 */

describe('ProjectConfiguration', function() {
  var ProjectConfiguration = require('../lib/resource/ProjectConfiguration');

  it('should match package.json paths', function() {
    expect(ProjectConfiguration.matchPath('package.json')).toBe(true);
    expect(ProjectConfiguration.matchPath('a/package.json')).toBe(true);
    expect(ProjectConfiguration.matchPath('a/1.js')).toBe(false);
  });

  it('should return non-haste affecteded directories', function() {
    var resource = new ProjectConfiguration('a/b/package.json', {});
    expect(resource.getHasteDirectories()).toEqual(['a/b']);
  });

  it('should return haste affecteded directories', function() {
    var resource = new ProjectConfiguration(
      'a/b/package.json',
      { haste: {
        directories: ['lib', 'tests']
      }});
    expect(resource.getHasteDirectories()).toEqual(['a/b/lib', 'a/b/tests']);
  });

  function expectResolve(resource, from, to, expected) {
    var result = null;
    runs(function() {
      resource.resolveRequire(from, to, function(r) {
        result = r;
      });
    });

    waitsFor(function() {
      return result;
    }, 100);

    runs(function() {
      expected(result);
    });
  }

  it('should translate require without haste paths', function() {
    var path = require('path');
    spyOn(path, 'exists').andCallFake(function(path, cb) {
      cb(true);
    });
    var resource = new ProjectConfiguration('a/b/package.json', {});
    expectResolve(resource, './a', 'a/b/c/d.js', function(v) {
      expect(v).toBe('b/c/a');
    });
  });

  it('should translate require within haste paths', function() {
    var path = require('path');
    spyOn(path, 'exists').andCallFake(function(path, cb) {
      cb(true);
    });
    var resource = new ProjectConfiguration(
      'project1/package.json',
      { haste: { directories: ['lib', 'main']} });

    expectResolve(resource, './a', 'project1/main.js', function(v) {
      expect(v).toBe('./a');
    });
    expectResolve(resource, './lib/b', 'project1/main.js', function(v) {
      expect(v).toBe('project1/b');
    });
    expectResolve(resource, './main/b', 'project1/main.js', function(v) {
      expect(v).toBe('project1/b');
    });
  });

  it('should translate require within haste paths', function() {
    var path = require('path');
    spyOn(path, 'existsSync').andCallFake(function(path) {
      return true;
    });
    var resource = new ProjectConfiguration(
      'project1/package.json',
      { haste: { directories: ['lib', 'main']} });

    expect(resource.resolveRequireSync('./a', 'project1/main.js'))
      .toBe('./a');
    expect(resource.resolveRequireSync('./lib/b', 'project1/main.js'))
      .toBe('project1/b');
    expect(resource.resolveRequireSync('./main/b', 'project1/main.js'))
      .toBe('project1/b');
  });

  it('should resolve index', function() {
    var path = require('path');
    spyOn(path, 'exists').andCallFake(function(path, cb) {
      cb(path === 'a/b/c/a/index.js');
    });
    var resource = new ProjectConfiguration('a/b/package.json', {});
    expectResolve(resource, './a', 'a/b/c/d.js', function(v) {
      expect(v).toBe('b/c/a/index');
    });
  });

  it('should resolve index sync', function() {
    var path = require('path');
    spyOn(path, 'existsSync').andCallFake(function(path) {
      return path === 'a/b/c/a/index.js';
    });
    var resource = new ProjectConfiguration('a/b/package.json', {});
    expect(resource.resolveRequireSync('./a', 'a/b/c/d.js'))
      .toBe('b/c/a/index');
  });

  it('should resolve 0 paths', function() {
    var resource = new ProjectConfiguration('a/b/package.json', {});
    var result = null;
    runs(function() {
      resource.resolveRequires([], 'a/b/c/d.js', function(r) {
        result = r;
      });
    });

    waitsFor(function() {
      return result;
    }, 100);

    runs(function() {
      expect(result).toEqual([]);
    });
  });

});

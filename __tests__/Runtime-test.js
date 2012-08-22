/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
describe('Runtime', function() {

  var Runtime = require('../lib/runtime/Runtime');
  var ResourceMap = require('../lib/ResourceMap');
  var JS = require('../lib/resource/JS');
  var ProjectConfiguration = require('../lib/resource/ProjectConfiguration');

  it('should resolve top level require', function() {
    var map = new ResourceMap([
      JS.fromObject({ id: 'foo', path: 'foo.js' })
    ]);

    var runtime = new Runtime(map);

    runtime.loadCode = function() {
      return 'exports.value = "foo";';
    };

    expect(runtime.require('foo').value).toBe("foo");
  });


  it('should cache required module', function() {
    var map = new ResourceMap([
      JS.fromObject({ id: 'foo', path: 'foo.js' })
    ]);

    var runtime = new Runtime(map);

    runtime.loadCode = function() {
      return 'exports.value = {}';
    };

    expect(runtime.require('foo').value)
      .toBe(runtime.require('foo').value);
  });

  it('should resolve sub requires', function() {
    var map = new ResourceMap([
      JS.fromObject({ id: 'foo', path: 'foo.js' }),
      JS.fromObject({ id: 'bar', path: 'bar.js' })
    ]);

    var runtime = new Runtime(map);

    runtime.loadCode = function(module) {
      if (module.id === 'foo') {
        return 'module.exports = require("bar").value;';
      } else {
        return 'exports.value = "bar";';
      }
    };

    expect(runtime.require('foo')).toBe("bar");
  });

  it('should resolve sub requires with configuration', function() {
    var configuration = new ProjectConfiguration('a/package.json', {});
    configuration.resolveRequireSync = function() {
      return 'bar';
    };

    var map = new ResourceMap([
      JS.fromObject({ id: 'foo', path: 'a/foo.js' }),
      JS.fromObject({ id: 'bar', path: 'a/bar.js' }),
      configuration
    ]);

    var runtime = new Runtime(map);

    runtime.loadCode = function(module) {
      if (module.id === 'foo') {
        return 'module.exports = require("./bar").value;';
      } else {
        return 'exports.value = "bar";';
      }
    };

    expect(runtime.require('foo')).toBe("bar");
  });
});
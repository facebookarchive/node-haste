/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 * @emails javascript@lists.facebook.com voloko@fb.com
 */

describe('JS', function() {
  var JSBench = require('../lib/resource/JSBench');
  var path = require('path');
  var ProjectConfiguration = require('../lib/resource/ProjectConfiguration');
  var loadResouce = require('../lib/test_helpers/loadResource')
    .bind(null, JSBench);

  it('should match package.json paths', function() {
    expect(JSBench.matchPath('x.js')).toBe(false);
    expect(JSBench.matchPath('a/__benchmarks__/x.js')).toBe(true);
    expect(JSBench.matchPath('__benchmarks__/x.js')).toBe(true);
    expect(JSBench.matchPath('a/__benchmarks__/support/x.js')).toBe(false);
    expect(JSBench.matchPath('a/1.css')).toBe(false);
  });

  var testData = path.join(__dirname, '..', '__test_data__', 'JSBench');

  it('should extract dependencies', function() {
    loadResouce(
      null,
      path.join(testData, 'html-bench.js'),
      function(resource) {
        expect(resource.id).toBe('html-bench');
        expect(resource.requiredModules)
          .toEqual(['htmlSpecialChars']);
        expect(resource.contacts).toEqual(['foo@bar.com']);
      });
  });

  it('should resolve paths using configuration', function() {
    loadResouce(
      new ProjectConfiguration(
        path.join(testData, 'configured', 'package.json'),
        {}),
      path.join(testData, 'configured', '__benchmarks__', 'test-bench.js'),
      function(resource) {
        expect(resource.id).toBe('configured/__benchmarks__/test-bench');
        expect(resource.requiredModules).toEqual(['configured/a']);
      });
  });

});

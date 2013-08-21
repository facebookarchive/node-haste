/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 * @emails javascript@lists.facebook.com voloko@fb.com
 */

describe('JSTestLoader', function() {
  var JSTestLoader = require('../lib/loader/JSTestLoader');
  var path = require('path');
  var loadResouce = require('../lib/test_helpers/loadResource');

  it('should match package.json paths', function() {
    var loader = new JSTestLoader();
    expect(loader.matchPath('x.js')).toBe(false);
    expect(loader.matchPath('a/__tests__/x.js')).toBe(true);
    expect(loader.matchPath('__tests__/x.js')).toBe(true);
    expect(loader.matchPath('a/__tests__/support/x.js')).toBe(false);
    expect(loader.matchPath('a/1.css')).toBe(false);
  });

  var testData = path.join(__dirname, '..', '__test_data__', 'JSTest');

  it('should extract dependencies', function() {
    loadResouce(
      new JSTestLoader(),
      path.join(testData, '__tests__', 'test-test.js'),
      null,
      function(errors, resource) {
        expect(resource.id).toBe('test-test');
        expect(resource.requiredModules)
          .toEqual(['fs', 'temp', 'mock-modules']);
        expect(resource.contacts)
          .toEqual(['javascript@lists.facebook.com', 'voloko@fb.com']);
      });
  });

});

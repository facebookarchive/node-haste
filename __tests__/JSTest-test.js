/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 * @emails javascript@lists.facebook.com voloko@fb.com
 */

describe('JSTest', function() {
  var JSTest = require('../lib/resource/JSTest');
  var path = require('path');
  var loadResouce = require('../lib/test_helpers/loadResource')
    .bind(null, JSTest);

  it('should match package.json paths', function() {
    expect(JSTest.matchPath('x.js')).toBe(false);
    expect(JSTest.matchPath('a/__tests__/x.js')).toBe(true);
    expect(JSTest.matchPath('__tests__/x.js')).toBe(true);
    expect(JSTest.matchPath('a/__tests__/support/x.js')).toBe(false);
    expect(JSTest.matchPath('a/1.css')).toBe(false);
  });

  var testData = path.join(__dirname, '..', '__test_data__', 'JSTest');

  it('should extract dependencies', function() {
    loadResouce(
      null,
      path.join(testData, 'test-test.js'),
      function(resource) {
        expect(resource.id).toBe('test-test');
        expect(resource.requiredModules)
          .toEqual(['fs', 'temp', 'mock-modules', 'why', 'are', 'we', 'here']);
        expect(resource.contacts).toEqual(['foo@bar.com']);
      });
  });

});

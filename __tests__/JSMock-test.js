/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 * @emails javascript@lists.facebook.com voloko@fb.com
 */

describe('JSMock', function() {
  var JSMock = require('../lib/resource/JSMock');
  var path = require('path');
  var ProjectConfiguration = require('../lib/resource/ProjectConfiguration');
  var loadResouce = require('../lib/test_helpers/loadResource')
    .bind(null, JSMock);

  it('should match package.json paths', function() {
    expect(JSMock.matchPath('x.js')).toBe(false);
    expect(JSMock.matchPath('a/__mocks__/x.js')).toBe(true);
    expect(JSMock.matchPath('__mocks__/x.js')).toBe(true);
    expect(JSMock.matchPath('a/__mocks__/support/x.js')).toBe(false);
    expect(JSMock.matchPath('a/1.css')).toBe(false);
  });

  var testData = path.join(__dirname, '..', '__test_data__', 'JSMock');

  it('should extract dependencies', function() {
    loadResouce(
      null,
      path.join(testData, 'mock.js'),
      function(resource) {
        expect(resource.id).toBe('mock');
        expect(resource.requiredModules).toEqual(['foo', 'bar']);
      });
  });

  it('should resolve paths using configuration', function() {
    loadResouce(
      new ProjectConfiguration(
        path.join(testData, 'configured', 'package.json'),
        {}),
      path.join(testData, 'configured', '__mocks__', 'mock.js'),
      function(resource) {
        expect(resource.id).toBe('configured/__mocks__/mock');
        expect(resource.requiredModules).toEqual(['configured/a']);
      });
  });

});

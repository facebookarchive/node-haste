/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 * @emails javascript@lists.facebook.com voloko@fb.com
 */

describe('JSLite', function() {
  var path = require('path');
  var JS = require('../lib/resource/JSLite');
  var ProjectConfiguration = require('../lib/resource/ProjectConfiguration');
  var loadResouce = require('../lib/test_helpers/loadResource').bind(null, JS);

  var testData = path.join(__dirname, '..', '__test_data__', 'JSLite');

  it('should match package.json paths', function() {
    expect(JS.matchPath('x.js')).toBe(true);
    expect(JS.matchPath('a/x.js')).toBe(true);
    expect(JS.matchPath('a/1.css')).toBe(false);
  });

  it('should parse old school components', function() {
    loadResouce(
      null,
      path.join(testData, 'oldSchoolComponent.js'),
      function(js) {
        expect(js.isModule).toBe(false);
        expect(js.id).toBe('oldSchoolComponent-tag');
        expect(js.requiredLegacyComponents).toEqual(['foo', 'bar']);
        expect(js.requiredCSS).toEqual(['foo-css']);
      });
  });


  it('should parse modules with requires', function() {
    loadResouce(
      null,
      path.join(testData, 'module.js'),
      function(js) {
        expect(js.isModule).toBe(true);
        expect(js.id).toBe('module-tag');
        expect(js.requiredModules).toEqual(['foo', 'bar']);
        expect(js.requiredCSS).toEqual(['foo-css']);
      });
  });


  it('should parse javelin', function() {
    loadResouce(
      null,
      path.join(testData, 'javelin.js'),
      function(js) {
        expect(js.isModule).toBe(true);
        expect(js.isJavelin).toBe(true);
        expect(js.isRunWhenReady).toBe(true);
        expect(js.id).toBe('javelin-tag');
        expect(js.requiredLegacyComponents)
          .toEqual(['javelin-dom', 'javelin-install', 'javelin-stratcom']);
      });
  });

  it('should resolve paths using configuration', function() {
    loadResouce(
      new ProjectConfiguration(
        path.join(testData, 'configured', 'package.json'),
        {}),
      path.join(testData, 'configured', 'a.js'),
      function(js) {
        expect(js.id).toBe('configured/a');
        expect(js.requiredCSS).toEqual(['foo-css']);
        expect(js.requiredModules)
          .toEqual(['configured/b', 'configured/foo/index']);
      });
  });

});

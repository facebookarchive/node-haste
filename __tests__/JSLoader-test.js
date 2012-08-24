/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 * @emails javascript@lists.facebook.com voloko@fb.com
 */

describe('JSLoader', function() {
  var path = require('path');
  var JSLoader = require('../lib/loader/JSLoader');
  var ProjectConfiguration = require('../lib/resource/ProjectConfiguration');
  var loadResouce = require('../lib/test_helpers/loadResource');

  var testData = path.join(__dirname, '..', '__test_data__', 'JS');

  it('should match package.json paths', function() {
    var loader =new JSLoader();
    expect(loader.matchPath('x.js')).toBe(true);
    expect(loader.matchPath('a/x.js')).toBe(true);
    expect(loader.matchPath('a/1.css')).toBe(false);
  });

  it('should parse old school components', function() {
    loadResouce(
      new JSLoader(),
      path.join(testData, 'oldSchoolComponent.js'),
      null,
      function(js) {
        expect(js.isModule).toBe(false);
        expect(js.id).toBe('oldSchoolComponent-tag');
        expect(js.requiredLegacyComponents).toEqual(['foo', 'bar']);
        expect(js.requiredCSS).toEqual(['foo-css']);
      });
  });


  it('should parse modules with requires', function() {
    loadResouce(
      new JSLoader(),
      path.join(testData, 'module.js'),
      null,
      function(js) {
        expect(js.isModule).toBe(true);
        expect(js.id).toBe('module-tag');
        expect(js.requiredModules).toEqual(['foo', 'bar']);
        expect(js.requiredCSS).toEqual(['foo-css']);
      });
  });


  it('should parse javelin', function() {
    loadResouce(
      new JSLoader(),
      path.join(testData, 'javelin.js'),
      null,
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
      new JSLoader(),
      path.join(testData, 'configured', 'a.js'),
      new ProjectConfiguration(
        path.join(testData, 'configured', 'package.json'),
        {}),
      function(js) {
        expect(js.id).toBe('configured/a');
        expect(js.requiredCSS).toEqual(['foo-css']);
      });
  });

});

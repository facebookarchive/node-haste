/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 * @emails javascript@lists.facebook.com voloko@fb.com
 */

describe('JSLoader', function() {
  var path = require('path');
  var JS = require('../lib/resource/JS');
  var JSLoader = require('../lib/loader/JSLoader');
  var ProjectConfiguration = require('../lib/resource/ProjectConfiguration');
  var ResourceMap = require('../lib/ResourceMap');
  var loadResouce = require('../lib/test_helpers/loadResource');
  var waitsForCallback = require('../lib/test_helpers/waitsForCallback');

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
      function(errors, js) {
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
      function(errors, js) {
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
      function(errors, js) {
        expect(js.isModule).toBe(true);
        expect(js.isJavelin).toBe(true);
        expect(js.isRunWhenReady).toBe(true);
        expect(js.id).toBe('javelin-tag');
        expect(js.requiredLegacyComponents)
          .toEqual(['javelin-dom', 'javelin-install', 'javelin-stratcom']);
      });
  });

  it('should exptract network size', function() {
    loadResouce(
      new JSLoader({ networkSize: true }),
      path.join(testData, 'javelin.js'),
      null,
      function(errors, js) {
        expect(js.networkSize > 0).toBe(true);
      });
  });

  it('should exptract javelin symbols', function() {
    loadResouce(
      new JSLoader({
        javelinsymbolsPath: 'echo -e "\n+MSteps:13\n?JX.URL:11\n?JX.install:9"'
      }),
      path.join(testData, 'javelin.js'),
      null,
      function(errors, js) {
        expect(js.definedJavelinSymbols).toEqual(['JX.MSteps']);
        expect(js.requiredJavelinSymbols.sort())
          .toEqual(['JX.URL', 'JX.install']);
      });
  });

  it('should exptract javelin symbols and networkSize', function() {
    loadResouce(
      new JSLoader({
        javelinsymbolsPath: 'echo -e "\n+MSteps:13\n?JX.URL:11\n?JX.install:9"',
        networkSize: true
      }),
      path.join(testData, 'javelin.js'),
      null,
      function(errors, js) {
        expect(js.definedJavelinSymbols).toEqual(['JX.MSteps']);
        expect(js.requiredJavelinSymbols.sort())
          .toEqual(['JX.URL', 'JX.install']);
        expect(js.networkSize > 0).toBe(true);
      });
  });

  it('should resolve paths using configuration', function() {
    loadResouce(
      new JSLoader(),
      path.join(testData, 'configured', 'a.js'),
      new ProjectConfiguration(
        path.join(testData, 'configured', 'package.json'),
        {}),
      function(errors, js) {
        expect(js.id).toBe('configured/a');
        expect(js.requiredCSS).toEqual(['foo-css']);
      });
  });

  it('should resolve local paths in post process', function() {
    var map;

    waitsForCallback(
      // test
      function(callback) {
        var loader = new JSLoader();
        map = new ResourceMap([
          JS.fromObject({
            id: 'a',
            path: 'project1/a.js',
            requiredModules: ['../b']
          }),
          JS.fromObject({
            id: 'b',
            path: 'b.js'
          })
        ]);

        loader.postProcess(map, map.getAllResources(), callback);
      },

      // expectation
      function() {
        expect(map.getResource('JS', 'a').requiredModules).toEqual(['b']);
      }
    );
  });


  it('should resolve local paths with index', function() {
    var map;

    waitsForCallback(
      // test
      function(callback) {
        var loader = new JSLoader();
        map = new ResourceMap([
          JS.fromObject({
            id: 'a',
            path: 'project1/a.js',
            requiredModules: ['../b']
          }),
          JS.fromObject({
            id: 'b',
            path: 'b/index.js'
          })
        ]);

        loader.postProcess(map, map.getAllResources(), callback);
      },

      // expectation
      function() {
        expect(map.getResource('JS', 'a').requiredModules).toEqual(['b']);
      }
    );
  });
});

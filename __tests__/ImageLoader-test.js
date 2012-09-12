/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 * @emails javascript@lists.facebook.com voloko@fb.com
 */

describe('Image', function() {
  var ImageLoader = require('../lib/loader/ImageLoader');
  var ResourceMap = require('../lib/ResourceMap');
  var path = require('path');
  var loadResouce = require('../lib/test_helpers/loadResource');
  var waitsForCallback = require('../lib/test_helpers/waitsForCallback');

  it('should match package.json paths', function() {
    var loader = new ImageLoader();
    expect(loader.matchPath('x.png')).toBe(true);
    expect(loader.matchPath('x.jpg')).toBe(true);
    expect(loader.matchPath('a/x.gif')).toBe(true);
    expect(loader.matchPath('a/1.js')).toBe(false);
  });

  var testData = path.join(__dirname, '..', '__test_data__', 'Image');

  it('should find the size of the picture', function() {
    var loader = new ImageLoader();
    loadResouce(
      loader,
      path.join(testData, 'a.jpg'),
      null,
      function(errors, resource) {
        expect(resource.width).toBe(900);
        expect(resource.height).toBe(596);
      });
  });

  it('should calculate network size when asked', function() {
    var loader = new ImageLoader();
    loadResouce(
      loader,
      path.join(testData, 'a.jpg'),
      null,
      function(errors, r) {
        expect(r.networkSize).toBe(127381);
      });
  });

  it('should return form postProcess with 0 resources', function() {
    var loader = new ImageLoader();
    var map = new ResourceMap();
    waitsForCallback(
      function(callback) {
        loader.postProcess(map, [], function() {
          callback();
        });
      },
      function(messages) {
        expect(messages).not.toBe(null);
      }
    );
  });
});

/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 * @emails javascript@lists.facebook.com voloko@fb.com
 */

describe('Image', function() {
  var ImageLoader = require('../lib/loader/ImageLoader');
  var ResourceMap = require('../lib/ResourceMap');
  var path = require('path');
  var loadResouce = require('../lib/test_helpers/loadResource');

  it('should match package.json paths', function() {
    var loader = new ImageLoader();
    expect(loader.matchPath('x.png')).toBe(true);
    expect(loader.matchPath('x.jpg')).toBe(true);
    expect(loader.matchPath('a/x.gif')).toBe(true);
    expect(loader.matchPath('a/1.js')).toBe(false);
  });

  var testData = path.join(__dirname, '..', '__test_data__', 'Image');

  it('should find the size of the picture', function() {
    var resource = null;
    var loader = new ImageLoader({
      identifyPath: 'echo r:' + path.join(testData, 'a.jpg') + ' 900x596'
    });
    loadResouce(
      loader,
      path.join(testData, 'a.jpg'),
      null,
      function(r) {
        loader.postProcess(new ResourceMap([r]), [r], function() {
          processed = true;
          resource = r;
        });
      });

    waitsFor(function() {
      return resource;
    }, 500);

    runs(function() {
      expect(resource.width).toBe(900);
      expect(resource.height).toBe(596);
    });
  });
});

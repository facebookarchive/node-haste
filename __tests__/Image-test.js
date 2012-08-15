/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 * @emails javascript@lists.facebook.com voloko@fb.com
 */

describe('Image', function() {
  var Image = require('../lib/resource/Image');
  var path = require('path');
  var loadResouce = require('../lib/test_helpers/loadResource')
    .bind(null, Image);

  it('should match package.json paths', function() {
    expect(Image.matchPath('x.png')).toBe(true);
    expect(Image.matchPath('x.jpg')).toBe(true);
    expect(Image.matchPath('a/x.gif')).toBe(true);
    expect(Image.matchPath('a/1.js')).toBe(false);
  });

  var testData = path.join(__dirname, '..', '__test_data__', 'Image');

  it('should find the size of the picture', function() {
    var resource = null;
    loadResouce(
      null,
      path.join(testData, 'a.jpg'),
      function(r) {
        Image.postProcess([r], function() {
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

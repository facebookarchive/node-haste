/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 * @emails javascript@lists.facebook.com voloko@fb.com
 */

describe('CSS', function() {
  var CSS = require('../lib/resource/CSS');
  var path = require('path');
  var loadResouce = require('../lib/test_helpers/loadResource')
    .bind(null, CSS);

  var testData = path.join(__dirname, '..', '__test_data__', 'CSSLite');


  it('should parse css sprites', function() {
    loadResouce(
      null,
      path.join(testData, 'fb-sprite.css'),
      function(css) {
        expect(css.fbSprites).toEqual([
          'images/dialog/large_halo_top_left.png',
          'images/dialog/large_halo_top_right.png'
        ]);
        expect(css.networkSize > 0).toBe(true);
      });
  });

});

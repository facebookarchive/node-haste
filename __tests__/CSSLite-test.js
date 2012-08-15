/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 * @emails javascript@lists.facebook.com voloko@fb.com
 */

describe('CSSLite', function() {
  var CSSLite = require('../lib/resource/CSSLite');
  var path = require('path');
  var loadResouce = require('../lib/test_helpers/loadResource')
    .bind(null, CSSLite);

  it('should match package.json paths', function() {
    expect(CSSLite.matchPath('x.css')).toBe(true);
    expect(CSSLite.matchPath('a/x.css')).toBe(true);
    expect(CSSLite.matchPath('a/1.js')).toBe(false);
  });

  var testData = path.join(__dirname, '..', '__test_data__', 'CSSLite');

  it('should parse component name', function() {
    loadResouce(
      null,
      path.join(testData, 'plain.css'),
      function(css) {
        expect(css.id).toBe('plain-css');
        expect(css.options).toEqual({ 'no-browser-specific-css' : true });
        expect(css.requiredCSS).toEqual(['bar']);
      });
  });

  it('should parse special attributes', function() {
    loadResouce(
      null,
      path.join(testData, 'special.css'),
      function(css) {
        expect(css.id).toBe('special-css');
        expect(css.isNonblocking).toBe(true);
        expect(css.isNopackage).toBe(true);
      });
  });

});

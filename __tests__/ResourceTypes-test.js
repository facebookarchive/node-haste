/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 * @emails javascript@lists.facebook.com voloko@fb.com
 */

describe('ResourceTypes', function() {

  var ResourceTypes = require('../lib/ResourceTypes');
  var JS = require('../lib/resource/JS');
  var JSTest = require('../lib/resource/JSTest');
  var CSS = require('../lib/resource/CSS');

  it('should return correct type for a path', function() {
    var types = new ResourceTypes([JSTest, JS, CSS]);

    expect(types.typeForPath('./a/b.js')).toBe(JS, "JS");
    expect(types.typeForPath('./a/__tests__/b.js')).toBe(JSTest, "JSTest");
    expect(types.typeForPath('./a/__tests__/b.css')).toBe(CSS, "CSS");
    expect(types.typeForPath('./a/__tests__/b.png')).toBe(null);
  });

  it('should return correct resource type hash', function() {
    var types = new ResourceTypes([JSTest, JS, CSS]);
    expect(types.getHash()).toBe('JSTest_0.1:JS_0.1:CSS_0.1');
  });

});

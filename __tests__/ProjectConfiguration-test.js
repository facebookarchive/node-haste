/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 * @emails javascript@lists.facebook.com voloko@fb.com
 */

describe('ProjectConfiguration', function() {
  var ProjectConfiguration = require('../lib/resource/ProjectConfiguration');

  it('should return non-haste affecteded roots', function() {
    var resource = new ProjectConfiguration('a/b/package.json', {});
    expect(resource.getHasteRoots()).toEqual(['a/b']);
  });

  it('should return haste affecteded roots', function() {
    var resource = new ProjectConfiguration(
      'a/b/package.json',
      { haste: {
        roots: ['lib', 'tests']
      }});
    expect(resource.getHasteRoots()).toEqual(['a/b/lib', 'a/b/tests']);
  });

  it('should resolve id with a prefix', function() {
    var resource = new ProjectConfiguration(
      'a/b/package.json',
      { haste: {
        roots: ['lib', 'tests'],
        prefix: "bar"
      }});
    expect(resource.resolveID('a/b/lib/foo')).toEqual('bar/foo');
  });

  it('should resolve id without a prefix', function() {
    var resource = new ProjectConfiguration(
      'a/b/package.json',
      { haste: {
        roots: ['lib', 'tests'],
        prefix: ""
      }});
    expect(resource.resolveID('a/b/lib/foo')).toEqual('foo');
  });

});

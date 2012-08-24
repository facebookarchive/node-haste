/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 * @emails javascript@lists.facebook.com voloko@fb.com
 */

describe('ProjectConfiguration', function() {
  var ProjectConfiguration = require('../lib/resource/ProjectConfiguration');

  it('should return non-haste affecteded directories', function() {
    var resource = new ProjectConfiguration('a/b/package.json', {});
    expect(resource.getHasteDirectories()).toEqual(['a/b']);
  });

  it('should return haste affecteded directories', function() {
    var resource = new ProjectConfiguration(
      'a/b/package.json',
      { haste: {
        directories: ['lib', 'tests']
      }});
    expect(resource.getHasteDirectories()).toEqual(['a/b/lib', 'a/b/tests']);
  });

});

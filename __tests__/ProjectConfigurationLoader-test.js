/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 * @emails javascript@lists.facebook.com voloko@fb.com
 */

describe('ProjectConfiguration', function() {
  var ProjectConfigurationLoader =
    require('../lib/loader/ProjectConfigurationLoader');

  it('should match package.json paths', function() {
    var loader = new ProjectConfigurationLoader();
    expect(loader.matchPath('package.json')).toBe(true);
    expect(loader.matchPath('a/package.json')).toBe(true);
    expect(loader.matchPath('a/1.js')).toBe(false);
  });

});

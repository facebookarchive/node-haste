/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 * @emails javascript@lists.facebook.com voloko@fb.com
 */

describe('ConfigurationTrie', function() {
  var ConfigurationTrie = require('../lib/ConfigurationTrie');
  var ProjectConfiguration = require('../lib/resource/ProjectConfiguration');

  it('should match subpath', function() {
    var config = new ProjectConfiguration('a/b/package.json', {});
    var trie = new ConfigurationTrie([config]);

    expect(trie.findConfiguration('a/b/a.js')).toBe(config);
    expect(trie.findConfiguration('a/a.js')).toBe(undefined);
    expect(trie.findConfiguration('a/b/c/d.js')).toBe(config);
    expect(trie.findConfiguration('a/b.js')).toBe(undefined);
  });


  it('should support haste paths', function() {
    var config = new ProjectConfiguration(
      'a/b/package.json',
      {
        haste: { roots: ['c', 'd'] }
      });
    var trie = new ConfigurationTrie([config]);

    expect(trie.findConfiguration('a/b/a.js')).toBe(undefined);
    expect(trie.findConfiguration('a/b/c/a.js')).toBe(config);
    expect(trie.findConfiguration('a/b/d/d.js')).toBe(config);
  });


  it('should match subpath with 2 configurations', function() {
    var config1 = new ProjectConfiguration('a/b/package.json', {});
    var config2 = new ProjectConfiguration('a/c/package.json', {});
    var trie = new ConfigurationTrie([config1, config2]);

    expect(trie.findConfiguration('a/b/a.js')).toBe(config1);
    expect(trie.findConfiguration('a/c/c/d.js')).toBe(config2);
  });


  it('should match nested configurations', function() {
    var config1 = new ProjectConfiguration('a/b/package.json', {});
    var config2 =
      new ProjectConfiguration('a/b/c/package.json', {});
    var trie = new ConfigurationTrie([config1, config2]);

    expect(trie.findConfiguration('a/b/a.js')).toBe(config1, 'a/b/a.js');
    expect(trie.findConfiguration('a/b/c.js')).toBe(config1, 'a/b/c.js');
    expect(trie.findConfiguration('a/b/c/d.js')).toBe(config2, 'a/b/c/d.js');
  });

});

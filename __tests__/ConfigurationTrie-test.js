/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @emails javascript@lists.facebook.com voloko@fb.com
 */

describe('ConfigurationTrie', function() {
  var ConfigurationTrie = require('../lib/ConfigurationTrie');
  var ProjectConfiguration = require('../lib/resource/ProjectConfiguration');
  var path = require("path");

  it('should match subpath', function() {
    var config = new ProjectConfiguration(['a','b','package.json'].join(path.sep), {});
    var trie = new ConfigurationTrie([config]);

    expect(trie.findConfiguration(['a','b','a.js'].join(path.sep))).toBe(config);
    expect(trie.findConfiguration(['a','a.js'].join(path.sep))).toBe(undefined);
    expect(trie.findConfiguration(['a','b','c','d.js'].join(path.sep))).toBe(config);
    expect(trie.findConfiguration(['a','b.js'].join(path.sep))).toBe(undefined);
  });


  it('should support haste paths', function() {
    var config = new ProjectConfiguration(
      'a/b/package.json',
      {
        haste: { roots: ['c', 'd'] }
      });
    var trie = new ConfigurationTrie([config]);

    expect(trie.findConfiguration(['a','b','a.js'].join(path.sep))).toBe(undefined);
    expect(trie.findConfiguration(['a','b','c','a.js'].join(path.sep))).toBe(config);
    expect(trie.findConfiguration(['a','b','d','d.js'].join(path.sep))).toBe(config);
  });


  it('should match subpath with 2 configurations', function() {
    var config1 = new ProjectConfiguration(['a','b','package.json'].join(path.sep), {});
    var config2 = new ProjectConfiguration(['a','c','package.json'].join(path.sep), {});
    var trie = new ConfigurationTrie([config1, config2]);

    expect(trie.findConfiguration(['a','b','a.js'].join(path.sep))).toBe(config1);
    expect(trie.findConfiguration(['a','c','c','d.js'].join(path.sep))).toBe(config2);
  });


  it('should match nested configurations', function() {
    var config1 = new ProjectConfiguration(['a','b','package.json'].join(path.sep), {});
    var config2 =
      new ProjectConfiguration(['a','b','c','package.json'].join(path.sep), {});
    var trie = new ConfigurationTrie([config1, config2]);

    expect(trie.findConfiguration(['a','b','a.js'].join(path.sep))).toBe(config1, ['a','b','a.js'].join(path.sep));
    expect(trie.findConfiguration(['a','b','c.js'].join(path.sep))).toBe(config1, ['a','b','c.js'].join(path.sep));
    expect(trie.findConfiguration(['a','b','c','d.js'].join(path.sep))).toBe(config2, ['a','b','c','d.js'].join(path.sep));
  });

});

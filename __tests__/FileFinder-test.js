/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 * @emails javascript@lists.facebook.com voloko@fb.com
 */

describe("FileFinder", function() {
  var path = require('path');
  var finder = require('../lib/FileFinder');

  var workingDir = path.join(__dirname, '..', '__test_data__', 'FileFinder');

  it("should find files in a directory", function() {
    var result;
    runs(function() {
      finder.find([workingDir], ['.js'], null, function(files) {
        result = files;
      });
    });

    waitsFor(function() {
      return result;
    }, 300);

    runs(function() {
      var files = result.map(function(r) {
        return r[0];
      });
      expect(files.join('\n')).toContain('sub/1.js');
      expect(files.join('\n')).toContain('sub/2.js');
      expect(files.join('\n')).toContain('3.js');
    });
  });

  it("should find files in a directory using native find", function() {
    var result;
    runs(function() {
      finder.findNative([workingDir], ['.js'], null, function(files) {
        result = files;
      });
    });

    waitsFor(function() {
      return result;
    }, 300);

    runs(function() {
      var files = result.map(function(r) {
        return r[0];
      });
      expect(files.join('\n')).toContain('sub/1.js');
      expect(files.join('\n')).toContain('sub/2.js');
      expect(files.join('\n')).toContain('3.js');
    });
  });
});

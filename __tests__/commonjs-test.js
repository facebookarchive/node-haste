/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 * @emails javascript@lists.facebook.com voloko@fb.com
 */

describe('commonjs parsing', function() {
  var commonjs = require('../lib/parse/commonjs');

  it('should extract normal requires', function() {
    var code =
      'var a = require("foo");\n' +
      'var b = require("bar");\n';
    expect(commonjs.extractRequireCalls(code)).toEqual(['foo', 'bar']);
  });


  it('should not extract from comments', function() {
    var code =
      '/* a = require("b") */\n' +
      'var a = require("foo");\n' +
      '// var a = require("yada");\n' +
      'var b = require("bar");\n';
    expect(commonjs.extractRequireCalls(code)).toEqual(['foo', 'bar']);
  });


  it('should extract require at the start', function() {
    var code =
      'require("foo");\n' +
      'var b = require("bar");\n';
    expect(commonjs.extractRequireCalls(code)).toEqual(['foo', 'bar']);
  });


  it('should ingore non require', function() {
    var code =
      'require("foo");\n' +
      'foo.require("something");\n' +
      'foo_require("something_new");\n' +
      'var b = [require("bar")];\n';
    expect(commonjs.extractRequireCalls(code)).toEqual(['foo', 'bar']);
  });


  it('should dedupe matches', function() {
    var code =
      'require("foo");\n' +
      'var b = require("foo");\n';
    expect(commonjs.extractRequireCalls(code)).toEqual(['foo']);
  });
});

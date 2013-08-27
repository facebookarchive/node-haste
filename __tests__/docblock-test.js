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

describe('docblock', function() {
  var docblock = require('../lib/parse/docblock');

  it('should extract valid docblock', function() {
    var code = '/**\n * @providesModule foo\n*/\nvar x = foo;';
    expect(docblock.extract(code)).toBe('/**\n * @providesModule foo\n*/');
  });

  it('should extract valid docblock with more comments', function() {
    var code = '/**\n * @providesModule foo\n*/\nvar x = foo;\n/**foo*/';
    expect(docblock.extract(code)).toBe('/**\n * @providesModule foo\n*/');
  });

  it('should return nothing for no docblock', function() {
    var code = '';
    expect(docblock.extract(code)).toBe('');
  });

  it('should return extract and parsedocblock', function() {
    var code =
      '/** @provides intern-fbtrace-css */\n' +
      '\n' +
      '.dummy {}\n';

    expect(docblock.parse(docblock.extract(code))).toEqual([
      ['provides', 'intern-fbtrace-css']
    ]);
  });

  it('should parse directives out of a docblock', function() {
    var code =
      '/**\n' +
      ' * @providesModule foo\n' +
      ' * @css a b\n' +
      ' * @preserve-whitespace\n' +
      ' */';
    expect(docblock.parse(code)).toEqual([
      ['providesModule', 'foo'],
      ['css', 'a b'],
      ['preserve-whitespace', '']
    ]);
  });

  it('should parse directives out of a docblock as an object', function() {
    var code =
      '/**\n' +
      ' * @providesModule foo\n' +
      ' * @css a b\n' +
      ' * @preserve-whitespace\n' +
      ' */';
    expect(docblock.parseAsObject(code)).toEqual({
      'providesModule': 'foo',
      'css': 'a b',
      'preserve-whitespace': ''
    });
  });

  it('should parse directives out of a docblock with comments', function() {
    var code =
      '/**\n' +
      ' * Copyright 2004-present Facebook. All Rights Reserved.\n' +
      ' * @providesModule foo\n' +
      ' * @css a b\n' +
      ' *\n' +
      ' * And some license here\n' +
      ' * @preserve-whitespace\n' +
      ' */';
    expect(docblock.parse(code)).toEqual([
      ['providesModule', 'foo'],
      ['css', 'a b'],
      ['preserve-whitespace', '']
    ]);
  });

  it('should parse multiline directives', function() {
    var code =
      '/**\n' +
      ' * Copyright 2004-present Facebook. All Rights Reserved.\n' +
      ' * @class A long declaration of a class\n' +
      ' *        goes here, so we can read it and enjoy\n' +
      ' *\n' +
      ' * And some license here\n' +
      ' * @preserve-whitespace\n' +
      ' */';
    expect(docblock.parse(code)).toEqual([
      ['class', 'A long declaration of a class goes here, ' +
        'so we can read it and enjoy'],
      ['preserve-whitespace', '']
    ]);
  });
});

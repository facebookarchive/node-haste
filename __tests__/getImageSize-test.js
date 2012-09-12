/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 * @emails javascript@lists.facebook.com voloko@fb.com
 */
describe("getImageSize", function() {
  var path = require('path');
  var fs = require('fs');
  var root = path.join(__dirname, '..', '__test_data__', 'Image');
  var getImageSize = require('../lib/parse/getImageSize');

  it('should parse gif image size', function() {
    var buffer = fs.readFileSync(path.join(root, '200x100.gif'));
    var size = getImageSize(buffer);
    expect(size.width).toBe(200);
    expect(size.height).toBe(100);
  });

  it('should parse png image size', function() {
    var buffer = fs.readFileSync(path.join(root, '200x100.png'));
    var size = getImageSize(buffer);
    expect(size.width).toBe(200);
    expect(size.height).toBe(100);
  });

  it('should parse jpeg image size', function() {
    var buffer = fs.readFileSync(path.join(root, '200x100.jpg'));
    var size = getImageSize(buffer);
    expect(size.width).toBe(200);
    expect(size.height).toBe(100);
  });
});

/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */

var fbSpriteRe = /-fb-sprite\s*:\s*url\s*\(\s*[\'"]?([^\'")]+)[\'"]?\s*\)/g;
var splashRe = /^\//;
function extractFBSprites(contents) {
  var result = {};
  var match;
  while (match = fbSpriteRe.exec(contents)) {
    result[match[1].replace(splashRe, '')] = 1;
  }
  return Object.keys(result);
}

var bgRe = /background[^:]*:.*?url\([\']*([^\)]*\/images\/[^\)]+)[\']*\)/g;
var quoteRe = /'"/g;
function extractBackgroundImages(contents) {
  var result = {};
  var match;
  while (match = bgRe.exec(contents)) {
    result[match[1].replace(splashRe, '').replace(quoteRe, '')] = 1;
  }
  return Object.keys(result);
}

exports.extractFBSprites = extractFBSprites;

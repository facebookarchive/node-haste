/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */

var blockCommentRe = /\/\*(.|\n)*?\*\//g;
var lineCommentRe = /\/\/.+(\n|$)/g;
var requireRe = /\brequire\s*\(\s*[\'"]([^"\']+)["\']\s*\)/g;

function extractRequireCalls(code, regex) {
  // clean up most comments
  code = code
    .replace(blockCommentRe, '')
    .replace(lineCommentRe, '');

  regex = regex || requireRe;
  var match;
  var result = [];
  var visited = {};
  while (match = regex.exec(code)) {
    // manually check for preceding dot
    if (match.index === 0 || code.charAt(match.index - 1) !== '.') {
      if (!visited[match[1]]) {
        result.push(match[1]);
        visited[match[1]] = 1;
      }
    }
  }
  return result;
}


exports.extractRequireCalls = extractRequireCalls;

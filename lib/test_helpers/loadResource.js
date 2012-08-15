/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */

function loadResource(type, conf, filePath, expectation) {
  var resource;
  runs(function() {
    type.loadFromPath(conf, filePath, function(r) { resource = r; });
  });

  waitsFor(function() {
    return resource;
  }, 500);

  runs(function() {
    expectation(resource);
  });
}

module.exports = loadResource;

/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */

function loadResource(loader, filePath, conf, expectation) {
  var resource;
  runs(function() {
    loader.loadFromPath(filePath, conf, function(r) { resource = r; });
  });

  waitsFor(function() {
    return resource;
  }, 500);

  runs(function() {
    expectation(resource);
  });
}

module.exports = loadResource;

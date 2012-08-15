#!/usr/bin/env node
var path = require('path');

// A test script to estimate performance of the runner on real world data.
// Has no side effects. The outupt of this thing is not used by anything.
var FileFinder = require('../lib/FileFinder');
var ResourceMap = require('../lib/ResourceMap');
var MapUpdateTask = require('../lib/MapUpdateTask');
var ResourceTypes = require('../lib/ResourceTypes');
var ProjectConfiguration = require('../lib/resource/ProjectConfiguration');
var ResourceMapSerializer = require('../lib/ResourceMapSerializer');
var ImageResource = require('../lib/resource/Image');
var JS = require('../lib/resource/JS');
var JSBench = require('../lib/resource/JSBench');
var JSTest = require('../lib/resource/JSTest');
var JSMock = require('../lib/resource/JSMock');
var JSLite = require('../lib/resource/JSLite');
var CSSLite = require('../lib/resource/CSSLite');
var CSS = require('../lib/resource/CSS');

ImageResource.identifyPath = 'gm identify';
JS.javelinsymbolsPath = '~/www/scripts/javelin/javelinsymbols';

var MAX_OPEN_FILES = 1000;
var LITE = false;

var resourceList = LITE ?
  [JSTest, JSMock, JSBench, JSLite, CSSLite, ProjectConfiguration] :
  [JS, CSS, ImageResource, ProjectConfiguration];
var extensions = LITE ?
  ['.js', '.css', '.json'] :
  ['.js', '.css', '.json', '.jpg', '.png', '.gif'];
var cacheName = LITE ? '.cache-lite' : '.cache';

var types = new ResourceTypes(resourceList);
var CACHE = path.join(__dirname, cacheName);
var ignoreRe = new RegExp('html/intern/(' +
      'wiki/skins(?!/facebook)|' +
      'pixelcloud/|' +
      'wiki/extensions/FCKeditor/|' +
      'third_party/ckeditor(?!/ckeditor.js)' +
    ')|/__(\\w+)__/');

var mobileRe = new RegExp('^html/' +
  '(js/mobile|css/mobile|intern/js/mobile|intern/css/mobile)/');

var t = Date.now();
function logTime(prefix) {
  console.log(prefix +  (Date.now() - t) + 'ms');
  t = Date.now();
}

var serializer = new ResourceMapSerializer(types);
serializer.loadFromPath(CACHE, function(err, map) {
  if (err) {
    map = new ResourceMap();
  }
  logTime('map loaded: ');

  var dirs = process.argv.slice(2);
  dirs = dirs.length ? dirs : ['.'];
  var finder = new FileFinder({
    scanDirs: dirs,
    extensions: extensions,
    useNative: true,
    ignore: function(path) {
      return ignoreRe.test(path) || mobileRe.test(path);
    }
  });

  var task = new MapUpdateTask(finder, types, map, {
    maxOpenFiles: MAX_OPEN_FILES
  });


  task.on('found', function(files) {
    logTime('found ' + files.length + ' files: ');
  });
  task.on('changed', function(changed) {
    logTime('changed ' + changed.length + ' files: ');
  });
  task.on('analyzed', function(updated) {
    logTime('analyzed ' + updated.length + ' resources: ');
  });
  task.on('postProcessed', function(updated) {
    logTime('postProcessed resources: ');
  });
  task.on('complete', function() {
    logTime('update complete: ');
    if (task.changed.length > task.skipped.length) {
      serializer.storeToPath(CACHE, map, function() {
        logTime('map stored with ' + map.getAllResources().length +
          ' resources: ');
      });
    }
  });
  task.run();
});


#!/usr/bin/env node
var path = require('path');

var Haste = require('../lib/Haste');
var loaders = require('../lib/loaders');

var LITE = false;

var loaders = LITE ?
  [
    new loaders.JSTestLoader(),
    new loaders.JSMockLoader(),
    new loaders.JSBenchLoader(),
    new loaders.JSLoader(),
    new loaders.ProjectConfigurationLoader(),
    new loaders.ResourceLoader()
  ] :
  [
    new loaders.JSLoader({
      javelinsymbolsPath: '~/www/scripts/javelin/javelinsymbols',
      networkSize: true
    }),
    new loaders.CSSLoader({
      networkSize: true
    }),
    new loaders.ImageLoader({
      maxIdentifyThreads: 8,
      networkSize: true,
      identifyPath: 'gm identify'
    }),
    new loaders.ProjectConfigurationLoader(),
    new loaders.ResourceLoader()
  ];

var cachePath = path.join(__dirname, LITE ? '.cache-lite' : '.cache');
var ignoreRe = new RegExp(
  'html/intern/(' +
    'wiki/skins(?!/facebook)|' +
    'pixelcloud/|' +
    'wiki/extensions/FCKeditor/|' +
    'third_party/ckeditor(?!/ckeditor.js)' +
  ')|/__(\\w+)__/');

var mobileRe = new RegExp('^html/' +
  '(js/mobile|css/mobile|intern/js/mobile|intern/css/mobile)/');

var dirs = process.argv.slice(2);
dirs = dirs.length ? dirs : ['.'];


var haste = new Haste(loaders, dirs, {
  maxOpenFiles: 1000,
  useNativeFind: true,
  ignorePaths: function(path) {
    return ignoreRe.test(path) || mobileRe.test(path);
  }
});

var t = Date.now();
function logTime(prefix) {
  console.log(prefix +  (Date.now() - t) + 'ms');
  t = Date.now();
}
haste.on('mapLoaded', function() {
  logTime('map loaded: ');
});
haste.on('found', function(files) {
  logTime('found ' + files.length + ' files: ');
});
haste.on('changed', function(changed) {
  logTime('changed ' + changed.length + ' files: ');
});
haste.on('analyzed', function(updated) {
  logTime('analyzed ' + updated.length + ' resources: ');
});
haste.on('mapUpdated', function(updated) {
  logTime('map updated: ');
});
haste.on('postProcessed', function(updated) {
  logTime('postprocessed: ');
});
haste.on('mapStored', function() {
  logTime('map stored: ');
});

haste.update(cachePath, function(map, messages) {
  logTime('map stored with ' + map.getAllResources().length +
    ' resources: ');
  if (messages.length) {
    console.log(messages.render());
  }
});

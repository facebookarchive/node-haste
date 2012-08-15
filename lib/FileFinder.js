/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */

var fs = require('fs');
var path = require('path');

/**
 * Scans directories for files with given extensions (async)
 * Will not follow symlinks. Uses node.js native function to traverse, can
 * be slower, but more safe than findNative
 *
 * @param  {Array.<String>} scanDirs   Directories to scan, ex: ['html/']
 * @param  {Array.<String>} extensions Extensions to searc for, ex: ['.js']
 * @param  {function|null}  ignore     Optional function to filter out paths
 * @param  {Function}       callback
 */
function find(scanDirs, extensions, ignore, callback) {
  var result = [];
  var activeCalls = 0;

  function readdirRecursive(curDir) {
    activeCalls++;
    fs.readdir(curDir, function(err, names) {
      activeCalls--;

      for (var i = 0; i < names.length; i++) {
        names[i] = path.join(curDir, names[i]);
      }

      names.forEach(function(curFile) {
        if (ignore && ignore(curFile)) {
          return;
        }
        activeCalls++;

        fs.lstat(curFile, function(err, stat) {
          activeCalls--;

          if (!err && stat && !stat.isSymbolicLink()) {
            if (stat.isDirectory()) {
              readdirRecursive(curFile);
            } else {
              var ext = path.extname(curFile);
              if (extensions.indexOf(ext) !== -1) {
                result.push([curFile, stat.mtime.getTime()]);
              }
            }
          }
          if (activeCalls === 0) {
            callback(result);
          }
        });
      });

      if (activeCalls === 0) {
        callback(result);
      }
    });
  }

  scanDirs.forEach(readdirRecursive);
}

/**
 * Scans directories for files with given extensions (async)
 * Will not follow symlinks. Uses native find shell script. Usually faster than
 * node.js based implementation though as any shell command is suspectable to
 * attacks. Use with caution.
 *
 * @param  {Array.<String>} scanDirs   Directories to scan, ex: ['html/']
 * @param  {Array.<String>} extensions Extensions to searc for, ex: ['.js']
 * @param  {function|null}  ignore     Optional function to filter out paths
 * @param  {Function}       callback
 */
function findNative(scanDirs, extensions, ignore, callback) {
  var spawn = require('child_process').spawn;
  var args = [].concat(scanDirs);
  extensions.forEach(function(ext, index) {
    if (index) {
      args.push('-o');
    }
    args.push('-iname');
    args.push('*' + ext);
  });

  var find = spawn('find', args);
  var stdout = '';
  find.stdout.setEncoding('utf-8');
  find.stdout.on('data', function(data) {
    stdout += data;
  });

  find.on('exit', function(code) {
    var lines = stdout.split('\n');
    if (ignore) {
      var include = function(x) {
        return !ignore(x);
      };
      lines = lines.filter(include);
    }
    var result = [];
    var count = lines.length;
    lines.forEach(function(path) {
      fs.stat(path, function(err, stat) {
        if (stat) {
          result.push([path, stat.mtime.getTime()]);
        }
        if (--count === 0) {
          callback(result);
        }
      });
    });
  });
}

/**
 * Wrapper for options for a find call
 * @class
 * @param {Object} options
 */
function FileFinder(options) {
  this.scanDirs = options && options.scanDirs || ['.'];
  this.extensions = options && options.extensions || ['.js'];
  this.ignore = options && options.ignore || null;
  this.useNative = options && options.useNative || false;
}

/**
 * @param  {Function} callback
 */
FileFinder.prototype.find = function(callback) {
  var impl = this.useNative ? findNative : find;
  impl(this.scanDirs, this.extensions, this.ignore, callback);
};


module.exports = FileFinder;
module.exports.find = find;
module.exports.findNative = findNative;

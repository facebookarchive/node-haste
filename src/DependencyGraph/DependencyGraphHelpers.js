/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const fs = require('fs');
const path = require('../fastpath');

const NODE_MODULES_DIR = path.sep + 'node_modules' + path.sep;

class DependencyGraphHelpers {
  constructor({
    roots = [],
    providesModuleNodeModules = [],
    assetExts = [],
  }) {
    const list = providesModuleNodeModules;
    this._hasteRegex = list && list.length ? buildHasteRegex(
      this._resolveHastePackages(list, roots)
    ) : null;
    this._assetExts = assetExts;
  }

  /**
   * An item in the `providesModuleNodeModule` array is an object containing two keys:
   *  * 'name' - the package name
   *  * 'parent' - if a string, it's the name of the parent package of the module in
   *  the dep tree. If null, it signifies that we should look for this package at
   *  the top level of the module tree.
   *
   * We try to resolve the specified module...but if we can't, we fallback to looking
   * in 'node_modules/[package name]' (this satisfies use cases where the actual
   * 'react-native' package is one of the root dirs, such as when we run tests
   * or examples).
   */
  _resolveHastePackages(packages, roots) {
    const packagePathForPackage = ({ name, parent }, rootDir) => {
      let packagePath;
      if (parent) {
        if (!Array.isArray(parent)) {
          parent = [parent];
        }
        parent.push(name);
        packagePath = rootDir +
          NODE_MODULES_DIR +
          parent.join(NODE_MODULES_DIR);
      } else {
        packagePath = rootDir + NODE_MODULES_DIR + name;
      }

      if (packagePath.endsWith(path.sep)) {
        return packagePath.slice(0, -1);
      } else {
        return packagePath;
      }
    };

    const hastePackages = [];
    packages.forEach(p => {
      roots.forEach(rootDir => {
        let name, parent;
        if (typeof p === 'string') {
          name = p;
          parent = null;
        } else {
          name = p.name;
          parent = p.parent;
        }
        const packagePath = packagePathForPackage({ name, parent }, rootDir);
        try {
          const stats = fs.statSync(packagePath);
          if (stats && stats.isDirectory()) {
            hastePackages.push(packagePath);
          }
        } catch (e) {
          // if we don't find the package, let's just default to node_modules/[package name]
          hastePackages.push(packagePathForPackage({ name }, rootDir));
        }
      });
    });
    return hastePackages;
  }

  /**
   * This method has three possible outcomes:
   *
   * 1) A file is not in 'node_modules' at all (some type of file in the project).
   * 2) The file is in 'node_modules', and it's contained in one of the
   * 'providesModuleNodeModules' packages.
   * 3) It's in 'node_modules' but not in a 'providesModuleNodeModule' package,
   * so it's just a normal node_module.
   *
   * This method uses a regex to do the directory testing, rather than for loop
   * and `indexOf` in order to get perf wins.
   */
  isNodeModulesDir(file) {
    const index = file.indexOf(NODE_MODULES_DIR);
    if (index === -1) {
      return false;
    }

    return this._hasteRegex ? !this._hasteRegex.test(file) : true;
  }

  isAssetFile(file) {
    return this._assetExts.indexOf(this.extname(file)) !== -1;
  }

  extname(name) {
    return path.extname(name).substr(1);
  }
}

/**
 * Given a list of directories, build a regex that takes the form:
 * 	^((?![module's node_modules dir])[module dir])|
 * 	 ((?![next module's node_modules dir])[next module dir])|...
 *
 * This is an alternative to looping through any of the providesModuleNodeModules
 * during `isNodeModulesDir`, which is run tens of thousands of times in a typical
 * project. A regex is much faster in this use-case.
 */
function buildHasteRegex(dirs) {
  const dirRegexes = [];
  dirs.forEach(dir => {
    const dirRegex = '((?!' +
      escapeRegExp(dir + NODE_MODULES_DIR) + ')' +
      escapeRegExp(dir + path.sep) + ')';
    dirRegexes.push(dirRegex);
  });

  return new RegExp('^' + dirRegexes.join('|'));
}

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}

module.exports = DependencyGraphHelpers;

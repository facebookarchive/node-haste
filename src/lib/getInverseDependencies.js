/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

function resolveModuleRequires(resolutionResponse, module) {
  const resolvedDeps = Object.create(null);

  const resolvedPairs = resolutionResponse.getResolvedDependencyPairs(module);
  if (!resolvedPairs) {
    return Promise.resolve([]);
  }

  return Promise.all(
    resolvedPairs.map(
      ([depName, depModule]) => {
        if (depModule) {
          return depModule.getName().then(name => {
            resolvedDeps[depName] = name;
          });
        }
      }
    )
  )
  .then(() => module.getDependencies(resolutionResponse.transformOptions))
  .then(dependencies => dependencies.map(dep => resolvedDeps[dep] || dep));
}

/**
 * Returns an object that indicates in which module each module is required.
 */
function getInverseDependencies(resolutionResponse) {
  const cache = Object.create(null);

  return Promise.all(resolutionResponse.dependencies.map(module => {
    return Promise.all([
      module.getName(),
      resolveModuleRequires(resolutionResponse, module),
    ]).then(([moduleName, resolvedDependencies]) => {
      resolvedDependencies.forEach(dep => {
        if (!cache[dep]) {
          cache[dep] = [];
        }

        cache[dep].push(moduleName);
      });
    });
  })).then(() => cache);
}

module.exports = getInverseDependencies;

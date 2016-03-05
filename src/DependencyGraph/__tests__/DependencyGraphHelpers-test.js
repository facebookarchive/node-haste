/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.autoMockOff();

jest.mock('fs');

const DependencyGraphHelpers = require('../DependencyGraphHelpers');
const fs = require('graceful-fs');

describe('DependencyGraphHelpers', function() {
  it('should properly resolve haste packages', function() {
    var root = '/root';
    _setMockFilesystem();

    const helpers = new DependencyGraphHelpers({});
    const hastePackageDirs = helpers._resolveHastePackages([
      { name: 'haste-fbjs', parent: 'react-native' },
      'react-haste', // handle just a string as input
      { name: 'react-native' },
    ], [root]);

    expect(hastePackageDirs).toEqual([
      '/root/node_modules/react-native/node_modules/haste-fbjs',
      '/root/node_modules/react-haste',
      '/root/node_modules/react-native',
    ]);
  });

  it('should correctly determined whether a file is a node_module or haste module', function() {
    var root = '/root';
    _setMockFilesystem();

    const helpers = new DependencyGraphHelpers({
      providesModuleNodeModules: [
        { name: 'haste-fbjs', parent: 'react-native' },
        { name: 'react-haste' },
      ],
      roots: [root],
    });

    expect(
      helpers.isNodeModulesDir('/root/index.js')
    ).toBe(false);

    expect(
      helpers.isNodeModulesDir('/root/node_modules/haste-fbjs/main.js')
    ).toBe(true);

    expect(
      helpers.isNodeModulesDir('/root/node_modules/react-native/node_modules/haste-fbjs/main.js')
    ).toBe(false);
  });

  function _setMockFilesystem() {
    fs.__setMockFilesystem({
      'root': {
        'index.js': [
          '/**',
          ' * @providesModule index',
          ' */',
          'require("shouldWork");',
        ].join('\n'),
        'node_modules': {
          // A peer version of haste-fbjs
          'haste-fbjs': {
            'package.json': JSON.stringify({
              name: 'haste-fbjs',
              main: 'main.js',
            }),
            'main.js': [
              '/**',
              ' * @providesModule shouldWork',
              ' */',
            ].join('\n'),
          },
          'react-native': {
            'package.json': JSON.stringify({
              name: 'react-native',
              main: 'main.js',
            }),
            'node_modules': {
              // the version of haste-fbjs that
              // we specified to be a `providesModuleNodeModule`
              'haste-fbjs': {
                'package.json': JSON.stringify({
                  name: 'haste-fbjs',
                  main: 'main.js',
                }),
                'main.js': [
                  '/**',
                  ' * @providesModule shouldWork',
                  ' */',
                ].join('\n'),
              },
            },
          },
        },
      },
    });
  }
});

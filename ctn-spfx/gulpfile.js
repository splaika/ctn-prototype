'use strict';

const build = require('@microsoft/sp-build-web');

build.addSuppression(`Warning - [sass] The local CSS class 'ms-Grid' is not camelCase and will not be type-safe.`);

// バンドル名からコンテンツハッシュを外し、固定名にする。
// 既定では ctn-suite-web-part_<hash>.js となり、コードを直すたびに名前が変わる。
// .sppkg 内のマニフェストはこのファイル名を名指しするため、名前が変わると
// パッケージの再登録（＝SharePoint 管理者への依頼）が毎回必要になる。
// 固定名にすればコード修正はライブラリ側の差し替えだけで完結する。
build.configureWebpack.mergeConfig({
  additionalConfiguration: (config) => {
    config.output.filename = '[name].js';
    config.output.chunkFilename = '[id].[name].js';
    return config;
  }
});

var getTasks = build.rig.getTasks;
build.rig.getTasks = function () {
  var result = getTasks.call(build.rig);

  result.set('serve', result.get('serve-deprecated'));

  return result;
};

build.initialize(require('gulp'));

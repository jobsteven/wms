// //////////////////////////////////////////////////////////////////////////////
//
//  Copyright (C) 2016-present  All Rights Reserved.
//  Licensed under the Apache License, Version 2.0 (the "License");
//  http://www.apache.org/licenses/LICENSE-2.0
//
//  Github Home: https://github.com/jobsteven
//  Author: AlexWang
//  Date: 2017-04-19 19:32:32
//  QQ Email: 1669499355@qq.com
//  Last Modified time: 2017-05-25 17:09:56
//  Description: wms-mediaElement
//
// //////////////////////////////////////////////////////////////////////////////

import Emiter from 'tinyEmiter';

export default class MediaElement extends Emiter {
  constructor(kws, id) {
    // console.log('ME', id);
    super();
    this.kws = kws;
    this.id = id;
    this.on('OnRelease', this._clear.bind(this))
  }

  _clear() {
    if (this.kws) this.kws = null;
    if (this.id) this.id = null;
  }

  release() {
    // console.log('ME Release', this.id);
    if (this.kws) {
      this.kws.release(this.id).then(() => {
        // console.log('ME OnRelease', this.id);
        this.emit('OnRelease');
      })
    }
  }
}
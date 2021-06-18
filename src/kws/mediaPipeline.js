// //////////////////////////////////////////////////////////////////////////////
//
//  Copyright (C) 2016-present  All Rights Reserved.
//  Licensed under the Apache License, Version 2.0 (the "License");
//  http://www.apache.org/licenses/LICENSE-2.0
//
//  Github Home: https://github.com/jobsteven
//  Author: AlexWang
//  Date: 2017-04-12 20:20:18
//  QQ Email: 1669499355@qq.com
//  Last Modified time: 2017-05-25 10:42:31
//  Description: wms-mediaPipeline
//
// //////////////////////////////////////////////////////////////////////////////
import MediaElement from './mediaElement.js';

export default class MediaPipeline extends MediaElement {

  setLatencyStats(latencyStats = true) {
    return this.kws
      .invoke(this.id, 'setLatencyStats', { latencyStats })
  }
}
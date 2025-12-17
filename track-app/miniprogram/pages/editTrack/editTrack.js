Page({
  data: {
    tempPoints: [],
    pickerLat: 0,
    pickerLng: 0,
    pickerMarker: [],
  },

  onLoad(options) {
    let points = [];
    if (options.points) {
      try {
        points = JSON.parse(decodeURIComponent(options.points));
      } catch(e) {}
    }
    // 默认用当前定位初始化坐标拾取器
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({
          tempPoints: points,
          pickerLat: res.latitude,
          pickerLng: res.longitude,
          pickerMarker: [{
            id: 999,
            latitude: res.latitude,
            longitude: res.longitude,
            iconPath: '/assets/guiji.png',
            width: 44,
            height: 44,
            draggable: true
          }]
        });
      },
      fail: () => {
        // 定位失败，默认北京
        this.setData({
          tempPoints: points,
          pickerLat: 39.90403,
          pickerLng: 116.407526,
          pickerMarker: [{
            id: 999,
            latitude: 39.90403,
            longitude: 116.407526,
            iconPath: '/assets/guiji.png',
            width: 44,
            height: 44,
            draggable: true
          }]
        });
      }
    });
  },

  // 拾取当前指针坐标（guiji.png marker）
  pickPoint() {
    let arr = this.data.tempPoints.concat([{
      latitude: this.data.pickerLat,
      longitude: this.data.pickerLng,
      photoUrl: '',
      timestamp: Date.now()
    }]);
    this.setData({ tempPoints: arr });
  },

  // 拖动 picker marker 事件
  onPickerDragEnd(e) {
    let { latitude, longitude } = e.detail.marker;
    this.setData({
      pickerLat: latitude,
      pickerLng: longitude,
      pickerMarker: [{
        id: 999,
        latitude,
        longitude,
        iconPath: '/assets/guiji.png',
        width: 44,
        height: 44,
        draggable: true
      }]
    });
  },

  // 添加当前位置为新点
  addPoint() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        let newPt = {
          latitude: res.latitude,
          longitude: res.longitude,
          photoUrl: '',
          timestamp: Date.now()
        };
        this.setData({ tempPoints: this.data.tempPoints.concat(newPt) });
      }
    });
  },

  // 删除某个点
  removePoint(e) {
    let idx = e.currentTarget.dataset.idx;
    let arr = this.data.tempPoints;
    arr.splice(idx, 1);
    this.setData({ tempPoints: arr });
  },

  // 保存轨迹（时间强制18:00）
  saveTrack() {
    const app = getApp();
    const trackName = app.globalData.userInfo.nickName + '-' + getToday();
    const createTime = getToday18Clock();
    wx.cloud.callFunction({
      name: 'saveTrack',
      data: {
        points: this.data.tempPoints,
        nickname: app.globalData.userInfo.nickName,
        avatarUrl: app.globalData.userInfo.avatarUrl,
        createTime,
        trackName
      },
      success: res => {
        wx.showToast({ title: '轨迹保存为18:00' });
        wx.navigateBack();
      }
    });
  },

  // 页面卸载时返回上一页自动重置早退计数
  onUnload() {
    // 通知index页面重置早退点击计数
    const pages = getCurrentPages();
    if(pages.length >= 2) {
      const prevPage = pages[pages.length - 2];
      if (prevPage && prevPage.setData) {
        prevPage.setData({ earlyLeaveClickCount: 0 }); // 重置
      }
    }
  }
});

// 工具函数
function getToday18Clock() {
  const d = new Date();
  d.setHours(18,0,0,0);
  return d.getTime();
}
function getToday() {
  const d = new Date();
  const pad = n => n<10 ? '0'+n : n;
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}
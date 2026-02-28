const app = getApp()

function getToday() {
  const d = new Date();
  const pad = n => n < 10 ? '0' + n : n;
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

// 获取当天18:00时间戳
function getToday18Clock() {
  const d = new Date();
  d.setHours(18,0,0,0);
  return d.getTime();
}

Page({
  data: {
    latitude: 0,
    longitude: 0,
    markers: [],
    polyline: [],
    tracking: false,
    points: [],
    avatarUrl: '',
    nickName: '',
    hasUserInfo: false,
    showPhotoPunchCard: false, // 控制弹窗显隐
    photoUrl: '',              // 当前预览图片FileID
    startLocation: null,  // 记录起点
    endLocation: null,    // 记录终点
    earlyLeaveClickCount: 0 // 记录早退点击次数
  },

  // 页面加载校验获取用户信息
  onLoad() {
    this.checkUserAuth();
    this.getLocation();
  },

  // 防止报错的授权方法
  checkUserAuth() {
    wx.getSetting({
      success: res => {
        if (!res.authSetting['scope.userInfo']) {
          wx.getUserProfile({
            desc: '用于展示个人信息',
            success: r => {
              this.setData({
                avatarUrl: r.userInfo.avatarUrl,
                nickName: r.userInfo.nickName,
                hasUserInfo: true
              });
              app.globalData.userInfo = r.userInfo;
            }
          });
        } else {
          wx.getUserInfo({
            success: r => {
              this.setData({
                avatarUrl: r.userInfo.avatarUrl,
                nickName: r.userInfo.nickName,
                hasUserInfo: true
              });
              app.globalData.userInfo = r.userInfo;
            }
          });
        }
      }
    });
  },

  // 获取当前位置，并支持callback
  getLocation(callback) {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({
          latitude: res.latitude,
          longitude: res.longitude,
        });
        if(typeof callback === 'function') callback(res);
        // 跟踪中自动打点
        if (this.data.tracking) {
          this._addLocationPoint(res.latitude, res.longitude);
        }
      }
    });
  },

  // 运动开始：清空points，记录起点，重置终点
  startTracking() {
    const storedInterval = wx.getStorageSync('setting_locationInterval');
    const intervalMin = typeof storedInterval === 'number' ? storedInterval : 5;
    this.setData({
      tracking: true,
      points: [],
      polyline: [],
      endLocation: null,
      earlyLeaveClickCount: 0 // 重置计数
    });
    // 采集起点
    this.getLocation(res => {
      this.setData({ startLocation: { latitude: res.latitude, longitude: res.longitude } });
      // 同时存入points第一个点
      this._addLocationPoint(res.latitude, res.longitude);
      this.renderMarkers();
    });
    // 按设置间隔自动打点最新位置
    this.locationTimer = setInterval(() => this.getLocation(), intervalMin * 60 * 1000);
  },

  // 运动结束
  stopTracking() {
    const now = new Date();
    const storedHour = wx.getStorageSync('setting_offWorkHour');
    const offWorkHour = typeof storedHour === 'number' ? storedHour : 18;
    if (now.getHours() < offWorkHour) {
      let c = this.data.earlyLeaveClickCount + 1;
      if (c === 1) {
        wx.showToast({ title: `不到${offWorkHour}:00不能下班`, icon: 'none' });
      } else if (c <= 20) {
        wx.showToast({ title: `不到${offWorkHour}:00下班为早退`, icon: 'none' });
      } else if (c === 21) {
        wx.showModal({
          title: '轨迹修改',
          content: `您已点击21次，进入轨迹修改页面，可手动编辑点位，保存后时间会被设为${offWorkHour}:00。`,
          showCancel: false,
          success: () => {
            wx.navigateTo({
              url: '/pages/editTrack/editTrack?points=' + encodeURIComponent(JSON.stringify(this.data.points))
            });
          }
        });
        return;
      }
      this.setData({ earlyLeaveClickCount: c });
      return;
    }
    // 满18点后正常结束
    clearInterval(this.locationTimer);
    this.setData({ tracking: false, earlyLeaveClickCount: 0 });
    // 记录终点并添加最后采集点
    this.getLocation(res => {
      const endLoc = { latitude: res.latitude, longitude: res.longitude };
      this.setData({ endLocation: endLoc });
      this._addLocationPoint(res.latitude, res.longitude); // 终点加入points
      this.renderMarkers();
      // 保存轨迹
      const trackName = this.data.nickName + '-' + getToday();
      wx.cloud.callFunction({
        name: 'saveTrack',
        data: {
          points: this.data.points,
          nickname: this.data.nickName,
          avatarUrl: this.data.avatarUrl,
          createTime: Date.now(),
          trackName
        },
        success: res => {
          wx.showToast({ title: '轨迹已保存' });
        }
      });
    });
  },

  openPhotoPunchCardPanel() {
    this.setData({ showPhotoPunchCard: true, photoUrl: '' });
  },
  
  closePhotoPunchCardPanel() {
    this.setData({ showPhotoPunchCard: false, photoUrl: '' });
  },
  
  choosePhoto() {
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      success: (res) => {
        wx.showLoading({ title: '上传中' });
        wx.cloud.uploadFile({
          cloudPath: `trackImg/${Date.now()}-${Math.floor(Math.random() * 10000)}.jpg`,
          filePath: res.tempFilePaths[0],
          success: uploadRes => {
            this.setData({ photoUrl: uploadRes.fileID });
            wx.hideLoading();
          },
          fail: err => {
            wx.hideLoading();
            wx.showToast({ title: '上传失败', icon: 'none' });
          }
        });
      }
    });
  },
  
  delPhoto() {
    this.setData({ photoUrl: '' });
  },
  
  submitPhotoPunchCard() {
    if (!this.data.photoUrl) {
      wx.showToast({ title: '请先拍照上传！', icon: 'none' });
      return;
    }
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        const newPoint = {
          latitude: res.latitude,
          longitude: res.longitude,
          photoUrl: this.data.photoUrl,
          timestamp: Date.now()
        };
        const points = this.data.points.concat(newPoint);
        this.setData({
          points,
          photoUrl: '',
          showPhotoPunchCard: false,
          polyline: [{ points, color: "#FF0000DD", width: 4 }]
        });
        wx.showToast({ title: '打点成功' });
        this.renderMarkers && this.renderMarkers();
      }
    })
  },
  // 采集一个新的普通轨迹点(无照片)
  _addLocationPoint(lat, lng) {
    const newPoint = {
      latitude: lat,
      longitude: lng,
      photoUrl: '',
      timestamp: Date.now()
    };
    const points = this.data.points.concat(newPoint);
    this.setData({
      points,
      polyline: [{ points, color: "#FF0000DD", width: 4 }]
    });
    this.renderMarkers();
  },

  // 拍照打点，其实调用addPoint
  takePhoto() {
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      success: (res) => {
        wx.cloud.uploadFile({
          cloudPath: `trackImg/${Date.now()}-${Math.floor(Math.random()*1000)}.jpg`,
          filePath: res.tempFilePaths[0],
          success: uploadRes => {
            const { latitude, longitude } = this.data;
            this.addPoint(latitude, longitude, uploadRes.fileID);
            wx.showToast({ title: '照片已上传' });
          }
        });
      }
    });
  },

  // 带照片的手动打点
  addPoint(lat, lng, photoUrl = null) {
    const newPoint = {
      latitude: lat,
      longitude: lng,
      photoUrl,
      timestamp: Date.now()
    };
    const points = this.data.points.concat(newPoint);
    this.setData({
      points,
      polyline: [{ points, color: "#FF0000DD", width: 4 }]
    });
    this.renderMarkers();
  },

  // 渲染所有marker：起点/终点(guiji.png)，有照片的点(photo.png)
  renderMarkers() {
    let markers = [];
    // 起点
    if (this.data.startLocation) {
      markers.push({
        id: 1,
        latitude: this.data.startLocation.latitude,
        longitude: this.data.startLocation.longitude,
        iconPath: '/assets/guiji.png',
        width: 44,
        height: 44
      });
    }
    // 终点
    if (this.data.endLocation) {
      markers.push({
        id: 2,
        latitude: this.data.endLocation.latitude,
        longitude: this.data.endLocation.longitude,
        iconPath: '/assets/guiji.png',
        width: 44,
        height: 44
      });
    }
    // 带照片点
    this.data.points.forEach((pt, idx) => {
      if (pt.photoUrl) {
        markers.push({
          id: 1000 + idx,
          latitude: pt.latitude,
          longitude: pt.longitude,
          iconPath: '/assets/photo.png',
          width: 32,
          height: 32
        });
      }
    });
    this.setData({ markers });
  }
});
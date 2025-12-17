App({
  onLaunch() {
    wx.cloud.init({
      env: 'wxf6c1f9608d3be8d7'
    })
    this.globalData = { userInfo: null }
  }
})
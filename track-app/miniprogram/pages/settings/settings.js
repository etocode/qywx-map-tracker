Page({
  data: {
    offWorkHour: 18,
    locationInterval: 5
  },

  onLoad() {
    const storedHour = wx.getStorageSync('setting_offWorkHour');
    const storedInterval = wx.getStorageSync('setting_locationInterval');
    this.setData({
      offWorkHour: typeof storedHour === 'number' ? storedHour : 18,
      locationInterval: typeof storedInterval === 'number' ? storedInterval : 5
    });
  },

  onOffWorkHourInput(e) {
    const v = parseInt(e.detail.value);
    this.setData({ offWorkHour: isNaN(v) ? 18 : v });
  },

  onLocationIntervalInput(e) {
    const v = parseInt(e.detail.value);
    this.setData({ locationInterval: isNaN(v) ? 5 : v });
  },

  saveSettings() {
    const hour = this.data.offWorkHour;
    const interval = this.data.locationInterval;
    if (hour < 0 || hour > 23) {
      wx.showToast({ title: '下班时间需在 0-23 点之间', icon: 'none' });
      return;
    }
    if (interval < 1) {
      wx.showToast({ title: '间隔至少 1 分钟', icon: 'none' });
      return;
    }
    wx.setStorageSync('setting_offWorkHour', hour);
    wx.setStorageSync('setting_locationInterval', interval);
    wx.showToast({ title: '设置已保存' });
  }
});

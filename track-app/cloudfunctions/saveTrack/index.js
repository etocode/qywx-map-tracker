const cloud = require('wx-server-sdk')
cloud.init()
exports.main = async (event, context) => {
  const db = cloud.database()
  return db.collection('tracks').add({
    data: {
      openid: cloud.getWXContext().OPENID,
      points: event.points,
      nickname: event.nickname,
      avatarUrl: event.avatarUrl,
      createTime: event.createTime
    }
  })
}
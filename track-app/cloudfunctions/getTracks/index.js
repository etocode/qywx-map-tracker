const cloud = require('wx-server-sdk')
cloud.init()
exports.main = async (event, context) => {
  const db = cloud.database()
  return db.collection('tracks').where({
    openid: cloud.getWXContext().OPENID
  }).orderBy('createTime','desc').get()
}
const cloud = require('wx-server-sdk')
cloud.init()
exports.main = async (event, context) => {
  const db = cloud.database()
  return db.collection('tracks').doc(event.id).remove()
}
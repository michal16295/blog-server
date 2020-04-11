//ADDING MEMBERS

module.exports.updateAvatar = async (db, user, avatar) => {
  await db.updateMany({ owner: user }, { $set: { ownerAvatar: avatar } });
};

module.exports.searchQuery = async (
  db,
  dataId,
  search,
  offset,
  ITEMS_PER_PAGE,
  searchField,
  field
) => {
  const data = await db.aggregate([
    {
      $match: {
        [searchField]: { $regex: search, $options: "i" },
        [field]: { $in: dataId }
      }
    },
    {
      $facet: this.facet(offset, ITEMS_PER_PAGE)
    }
  ]);

  return data;
};
module.exports.getAll = async (db, search, offset, ITEMS_PER_PAGE, field) => {
  const data = await db.aggregate([
    {
      $match: {
        [field]: { $regex: search, $options: "i" }
      }
    },
    {
      $facet: this.facet(offset, ITEMS_PER_PAGE)
    }
  ]);
  return data;
};
module.exports.facet = (offset, ITEMS_PER_PAGE) => {
  let obj = {
    metadata: [
      { $count: "total" },
      { $addFields: { ITEMS_PER_PAGE: ITEMS_PER_PAGE } }
    ],
    data: [{ $skip: offset }, { $limit: ITEMS_PER_PAGE }]
  };
  return obj;
};
module.exports.isValid = db => {
  return !db[0].data || db[0].data.length === 0 || db[0].data === undefined;
};

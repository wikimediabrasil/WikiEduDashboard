export const campaignSearchParams = (search, tags) => {
  const params = {};
  if (search) params.search = search;
  if (tags.length > 0) params.label_search = tags.map(tag => tag.match).join(',');
  return params;
};

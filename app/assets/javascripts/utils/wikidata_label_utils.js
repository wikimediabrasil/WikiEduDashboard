export const wikidataLabelText = (label) => {
  if (typeof label !== 'object' || label === null) return label;

  return label.label || label.match || '';
};

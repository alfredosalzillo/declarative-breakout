export const arrayEquals = (array1, array2) => {
  if (array1 === array2) {
    return true;
  }
  if (!array1 || !array2) {
    return false;
  }
  return array1.every((value, i) => value === array2[i]);
};

export const identity = element => element;

export const dateToTaxYear = date => {
  const year = parseInt(date.split("-")[0]);
  const month = parseInt(date.split("-")[1]);
  return month < 4 ? year - 1 : year;
}
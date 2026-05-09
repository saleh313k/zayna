export const ROLES = {
  ADMIN: 0,
  SALON: 1,
  STYLIST:2,
  CUSTOMER: 3
};


export const ROLES_BY_ID = Object.fromEntries(
  Object.entries(ROLES).map(([key, value]) => [value, key])
);
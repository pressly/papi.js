'use strict';

const mockAuth = {
  id: '54f0db7308afa12b53620588',
  email: 'alex.vitiuk@pressly.com',
  username: 'alex',
  password: 'betame',
  account_id: '54f0db7308afa12b53620587',
  jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNTRmMGRiNzMwOGFmYTEyYjUzNjIwNTg4In0.CvXGDKAJYZkoH3nnEirtlGlwRzErv1ANOJ-dVkUAnjo',
  name: 'Alex',
  permissions: {
    global_permissions: [],
    hub_permissions: {
      "54f6227386f2f7000a000170":["*"],
      "54f8c8f486f2f7000a000236":["*"],
      "550358044bb240000100009c":["*"],
      "55073ed94bb24000010001d2":["*"],
      "551073f64072910001000078":["*"],
      "5540ed5d468bb00001000042":["*"]
    },
    account_permissions: {
      "54f0db7308afa12b53620587":["*"],
      "54f0db7308afa12b53620588":["*"]
    }
  },
};

const mockUser = {
  id: '54f0db7308afa12b53620588',
  email: 'alex.vitiuk@pressly.com',
  username: 'alex',
  account_id: '54f0db7308afa12b53620587'
};

const mockHub = {
  id: '5540ed5d468bb00001000042',
  uid: 'hacktheplanet',
  name: 'HackThePlanel',
  account_id: 'peter'
};

export { mockAuth, mockUser, mockHub };

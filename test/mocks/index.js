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

const hubs = [{"id":"5527e3b0ec798feb57000044","uid":"my-first-hub","name":"My First Hub","host":"","description":"","website_index_url":"","website_url":"","logo_url":"https://s3.amazonaws.com/pressly-imgrydb/dev/uploads/5b884273817b13a829b0728b0b5d2eaf.png","cover_url":"https://s3.amazonaws.com/pressly-imgrydb/dev/uploads/cff1d40e100755507e704b91ab876447.jpg","feedback_email":"","deeplinking_enabled":false,"settings":{},"tracking_id":"","published_at":null,"touch_token":"","account_id":"5527de656c21740ac8ba0394","current_app_id":"5550ca65ec798fa92a00000c","flags":0,"account_uid":"corban","account_name":"Corban","url_path":"hubs/5527e3b0ec798feb57000044/view","hub_url":"http://localhost:5331/hubs/5527e3b0ec798feb57000044/view/","pressly_hub_url":"http://localhost:5331/hubs/5527e3b0ec798feb57000044/view/"},{"id":"553aa12cec798f2487000001","uid":"yo","name":"YO","host":"","description":"","website_index_url":"","website_url":"","logo_url":"","cover_url":"","feedback_email":"","deeplinking_enabled":false,"settings":{},"tracking_id":"","published_at":null,"touch_token":"","account_id":"5527de657b5f88649e3d53fa","current_app_id":"553aa12cec798f2487000002","flags":1,"account_uid":"pressly","account_name":"pressly","url_path":"hubs/553aa12cec798f2487000001/view","hub_url":"http://localhost:5331/hubs/553aa12cec798f2487000001/view/","pressly_hub_url":"http://localhost:5331/hubs/553aa12cec798f2487000001/view/","access":{"id":"5527de656c21740ac8ba03b2","user_id":"5527de657b5f88649e3d53fb","role_id":"5527de657b5f88649e3d53f7","account_id":"5527de657b5f88649e3d53fa","status":0,"name":"owner"}},{"id":"553aa1c5ec798f2487000036","uid":"yo2","name":"YO2","host":"","description":"","website_index_url":"","website_url":"","logo_url":"","cover_url":"","feedback_email":"","deeplinking_enabled":false,"settings":{},"tracking_id":"","published_at":null,"touch_token":"","account_id":"5527de657b5f88649e3d53fa","current_app_id":"553aa1c5ec798f2487000037","flags":1,"account_uid":"pressly","account_name":"pressly","url_path":"hubs/553aa1c5ec798f2487000036/view","hub_url":"http://localhost:5331/hubs/553aa1c5ec798f2487000036/view/","pressly_hub_url":"http://localhost:5331/hubs/553aa1c5ec798f2487000036/view/","access":{"id":"5527de656c21740ac8ba03b2","user_id":"5527de657b5f88649e3d53fb","role_id":"5527de657b5f88649e3d53f7","account_id":"5527de657b5f88649e3d53fa","status":0,"name":"owner"}},{"id":"553aa2b2ec798f248700006b","uid":"do-it","name":"DO IT","host":"","description":"","website_index_url":"","website_url":"","logo_url":"","cover_url":"","feedback_email":"","deeplinking_enabled":false,"settings":{},"tracking_id":"","published_at":null,"touch_token":"","account_id":"5527de657b5f88649e3d53fa","current_app_id":"553aa2b2ec798f248700006c","flags":0,"account_uid":"pressly","account_name":"pressly","url_path":"hubs/553aa2b2ec798f248700006b/view","hub_url":"http://localhost:5331/hubs/553aa2b2ec798f248700006b/view/","pressly_hub_url":"http://localhost:5331/hubs/553aa2b2ec798f248700006b/view/","access":{"id":"5527de656c21740ac8ba03b2","user_id":"5527de657b5f88649e3d53fb","role_id":"5527de657b5f88649e3d53f7","account_id":"5527de657b5f88649e3d53fa","status":0,"name":"owner"}},{"id":"555237c9ec798fc7be000001","uid":"test-qmd","name":"TEST QMD","host":"","description":"","website_index_url":"","website_url":"","logo_url":"","cover_url":"","feedback_email":"","deeplinking_enabled":false,"settings":{},"tracking_id":"","published_at":null,"touch_token":"","account_id":"5527de657b5f88649e3d53fa","current_app_id":"555237c9ec798fc7be000002","flags":0,"account_uid":"pressly","account_name":"pressly","url_path":"hubs/555237c9ec798fc7be000001/view","hub_url":"http://localhost:5331/hubs/555237c9ec798fc7be000001/view/","pressly_hub_url":"http://localhost:5331/hubs/555237c9ec798fc7be000001/view/","access":{"id":"5527de656c21740ac8ba03b2","user_id":"5527de657b5f88649e3d53fb","role_id":"5527de657b5f88649e3d53f7","account_id":"5527de657b5f88649e3d53fa","status":0,"name":"owner"}},{"id":"5552384eec798fc7be00002f","uid":"test-2","name":"TEST 2","host":"","description":"","website_index_url":"","website_url":"","logo_url":"https://s3.amazonaws.com/pressly-imgrydb/dev/uploads/b86b4380701a4b34dd756e2fec85b6d0.png","cover_url":"","feedback_email":"","deeplinking_enabled":false,"settings":{},"tracking_id":"","published_at":null,"touch_token":"","account_id":"5527de657b5f88649e3d53fa","current_app_id":"5552384eec798fc7be000030","flags":0,"account_uid":"pressly","account_name":"pressly","url_path":"hubs/5552384eec798fc7be00002f/view","hub_url":"http://localhost:5331/hubs/5552384eec798fc7be00002f/view/","pressly_hub_url":"http://localhost:5331/hubs/5552384eec798fc7be00002f/view/","access":{"id":"5527de656c21740ac8ba03b2","user_id":"5527de657b5f88649e3d53fb","role_id":"5527de657b5f88649e3d53f7","account_id":"5527de657b5f88649e3d53fa","status":0,"name":"owner"}}];

export { hubs, mockAuth, mockUser, mockHub };

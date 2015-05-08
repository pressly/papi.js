'use strict';

const authSchemaRequest = {
  type: Object,
  content: {
    email: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    }
  }
};

const authSchemaResponse = {
    type: Object,
    content: {
      account_id: {
        type: String,
        min: 24,
        max: 24,
        required: true
      },
      avatar_url: {
        type: String
      },
      email: {
        type: String,
        required: true
      },
      id: {
        type: String,
        required: true
      },
      jwt: {
        type: String,
        required: true
      },
      name: {
        type: String,
        min: 2,
        max: 30,
        required: true
      },
      username: {
        type: String,
        required: true
      },
      permissions: {
        type: Object,
        content: {
          global_permissions: {
            type: Array,
            required: true
          },
          hub_permissions: {
            type: Object,
            required: true
          },
          account_permissions: {
            type: Object,
            required: true
          }
        }
      }
    }
};

export {
  authSchemaRequest,
  authSchemaResponse
}

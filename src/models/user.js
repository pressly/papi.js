import Model from '../model';

export default class User extends Model {
  hasAccess() {
    return this.access.status === 0;
  }
}

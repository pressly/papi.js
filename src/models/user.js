import Model from '../model';

export class User extends Model {
  hasAccess() {
    return this.access.status === 0;
  }
}

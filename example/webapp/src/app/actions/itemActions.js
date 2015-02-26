import Papi from 'papi';
import Reflux from 'reflux';

var itemActions = Reflux.createActions([
  'loadItems',
  'loadItemsSuccess',
  'loadItemsError'
]);

module.exports = itemActions;

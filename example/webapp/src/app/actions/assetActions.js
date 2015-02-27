import Papi from 'papi';
import Reflux from 'reflux';

var assetActions = Reflux.createActions([
  'loadAssets',
  'loadAssetsSuccess',
  'loadAssetsError'
]);

module.exports = assetActions;

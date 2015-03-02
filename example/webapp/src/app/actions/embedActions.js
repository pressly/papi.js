import Reflux from 'reflux';

var embedActions = Reflux.createActions([
  'loadAssets',
  'loadAssetsSuccess',
  'loadAssetsError'
]);

module.exports = embedActions;

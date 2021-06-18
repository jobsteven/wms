module.exports = function(umdConf) {
  // node
  umdConf.webpackFeatures.enableNode();
  umdConf.webpackFeatures.enableClean();
  umdConf.webpackFeatures.enableHits();

  // web
  // umdConf.devServer.host = '0.0.0.0';
  // umdConf.output.publicPath = '';
  // umdConf.historyfallback = true;

  // umdConf.webpackFeatures.enableVendors();
  // umdConf.addVendor('react');
  // umdConf.addVendor('react-dom');

  // umdConf.addParseInclude(require.resolve('react'))
  // umdConf.addParseInclude(require.resolve('react-dom'))
  // umdConf.addParseInclude(require.resolve('antd'))
};
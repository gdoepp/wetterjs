// An example configuration file
exports.config = {
  // The address of a running selenium server.
  seleniumAddress: 'http://localhost:4444/wd/hub',

  // Capabilities to be passed to the webdriver instance.

  multiCapabilities: [
{
    browserName: 'firefox'
  },
  {
    browserName:'chrome',
chromeOptions: {
     args: [ "--enable-automatation","--allow-file-access-from-files", "--user-data-dir=/tmp/chrome-gd",
      "--disable-web-security" ]
   }
  }],

//  capabilities: { browserName: 'firefox'},

  // Spec patterns are relative to the configuration file location passed
  // to protractor (in this example conf.js).
  // They may include glob patterns.
  specs: ['testE2ESimple.js'],

  // Options to be passed to Jasmine-node.
  jasmineNodeOpts: {
    showColors: true, // Use colors in the command line report.
  }
};

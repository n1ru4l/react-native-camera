/* eslint-disable no-console */
'use strict';

const meow = require('meow');
const chalk = require('chalk');

const downloadIOsVisionFramworks = require('./download-ios-vision-frameworks');

const cli = meow(
  `
    Usage
      $ react-native-camera <command>

    Commands
      download-ios-vison-frameworks - Downloads the ios vision frameworks
`,
  {
    pkg: {
      description: 'react-native-camera-cli',
    },
  },
);

(async function main() {
  const [command] = cli.input;
  try {
    switch (command) {
      case 'download-ios-vison-frameworks':
        await downloadIOsVisionFramworks();
        break;
      default:
        throw new Error(
          `ERROR: Command '${command}' not found. Run 'react-native-camera-cli --help' to receive a list of available commands.`,
        );
    }
  } catch (err) {
    console.log(chalk.red('❌  ' + err.message));
    process.exit(1);
  }
})();

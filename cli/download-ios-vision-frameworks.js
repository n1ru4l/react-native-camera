/* eslint-disable no-console */
'use strict';

const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const download = require('download');
const rimraf = require('rimraf');
const xcode = require('xcode');

function getDestinationFileName(url) {
  return url.split('/').pop();
}
const filter = file =>
  !file.path.startsWith('./copy/') &&
  !file.path.startsWith('./BarcodeDetector/') &&
  path.extname(file.path) !== '.txt';

const map = file => {
  file.path = file.path
    .replace('./Detector', './')
    .replace('./MVDataOutput', './')
    .replace(/\/Frameworks\//g, '/')
    .replace(/\/frameworks\//g, '/');
  return file;
};

const frameworks = [
  {
    name: 'Google Symbol Utilities',
    url: 'https://www.gstatic.com/cpdc/dbffca986f6337f8-GoogleSymbolUtilities-1.1.1.tar.gz',
  },
  {
    name: 'Google Utilities',
    url: 'https://dl.google.com/dl/cpdc/978f81964b50a7c0/GoogleUtilities-1.3.2.tar.gz',
  },
  {
    name: 'Google Mobile Vision',
    url: 'https://dl.google.com/dl/cpdc/df83c97cbca53eaf/GoogleMobileVision-1.1.0.tar.gz',
  },
  {
    name: 'Google Network Utilities',
    url: 'https://dl.google.com/dl/cpdc/54fd7b7ef8fd3edc/GoogleNetworkingUtilities-1.2.2.tar.gz',
  },
  {
    name: 'Google Interchange Utilities',
    url: 'https://dl.google.com/dl/cpdc/1a7f7ba905b2c029/GoogleInterchangeUtilities-1.2.2.tar.gz',
  },
];

function logInfo(msg) {
  console.log(chalk.yellow(`💫  ${msg}`));
}

function logSuccess(msg) {
  console.log(chalk.green(`✅  ${msg}`));
}

async function downloadFrameworks({ frameworksDirectory }) {
  console.log('Start downloading Libraries!');

  for (const { url } of frameworks) {
    const fileName = getDestinationFileName(url);
    console.log(`📦  Downloading and extracting ${fileName}.`);
    await download(url, frameworksDirectory, {
      extract: true,
      filename: fileName,
      map,
      filter,
    });
    logSuccess(`Downloaded an extracted ${fileName} successfully.`);
    rimraf.sync(path.resolve(frameworksDirectory, fileName));
  }
}

async function addFrameworksToProject({ frameworksDirectory, projectPath }) {
  const project = xcode.project(projectPath);
  project.parseSync();

  // @TODO: Iterate over frameworks and add them if neccessary
  project.addFramework(path.resolve(frameworksDirectory, 'GoogleInterchangeUtilities.framework'), {
    customFramework: true,
    embed: true,
    link: true,
  });

  logInfo(`Searching 'Framework' group.`);
  const mainProject = project.getPBXGroupByKey(project.getFirstProject().firstProject.mainGroup);
  if (!mainProject.children.some(children => children.comment === 'Frameworks')) {
    logInfo(`No 'Framework' group present on main group. Adding 'Framework' group to main group.`);

    const [groupKey] = Object.entries(project.hash.project.objects['PBXGroup']).find(
      ([, group]) => group.name === 'Frameworks',
    );

    project.addToPbxGroup(groupKey, project.getFirstProject().firstProject.mainGroup);
    logSuccess(`Added 'Framework' Group to main group.`);
  }

  fs.writeFileSync(projectPath, project.writeSync());
}

module.exports = async () => {
  const workingDir = process.cwd();
  let appInfo;
  let projectPath;

  logInfo('Resolving path to iOS project...');

  try {
    appInfo = require(path.resolve(workingDir, 'app.json'));
  } catch (err) {
    throw new Error(
      `Could not find file 'app.json'. Please ensure the script is run in the react-native project root.`,
    );
  }
  projectPath = path.resolve(workingDir, 'ios', `${appInfo.name}.xcodeproj`, 'project.pbxproj');
  const stats = fs.statSync(projectPath);
  if (stats.isFile === false) {
    throw new Error(
      `Could not find '${projectPath}'. Please ensure your project follows the react-native structure.`,
    );
  }

  logSuccess(`Found project at '${projectPath}'.`);

  const frameworksDirectory = path.join(workingDir, 'ios', 'Frameworks');

  await downloadFrameworks({ frameworksDirectory });
  await addFrameworksToProject({ frameworksDirectory, projectPath });
};

const axios = require("axios");
const {repos} = require("../package.json");
const downGitRepo = require("download-git-repo");
const util = require("util");
const path = require("node:path");
const ora = require('ora');
const chalk = require("chalk").default;

// 对异步函数包裹一层 loading
async function wrapLoading(fn, message, ...args) {
  const spinner = ora(message);

  spinner.start();

  try {
    const result = await fn(...args);
    spinner.succeed(message);
    return result;
  } catch (err) {
    spinner.fail(err?.message || "An error occurred");
  }
}

module.exports = async function (args, name) {
  const {template, remote} = args;
  const downloadGitRepo = util.promisify(downGitRepo);

  const remoteUrl = remote in repos ? repos[remote] : "";

  if (!remoteUrl) {
    console.log(chalk.red(`Remote repository "${remote}" not found.`));
    return process.exit(1);
  }
  
  const requestUrl = `${remoteUrl}${template}`

  await wrapLoading(
    downloadGitRepo,
    `Downloading template from ${requestUrl}...`,
    requestUrl,
    path.resolve(process.cwd(), name)
  );
};
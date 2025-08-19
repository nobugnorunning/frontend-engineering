const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer').default;
const generate = require('./generate');

// 创建目录
module.exports = async function(name, options) {
  const pwd = path.resolve(process.cwd(), name);

  // 检查目录是否存在
  if (fs.existsSync(pwd)) {
    if (options.force) {
      fs.removeSync(pwd)
    } else {
      // 询问是否覆盖
      const { action } = await inquirer.prompt([
        {
          name: "action",
          type: "confirm",
          message: "Directory already exists. Do you want to overwrite it?",
        }
      ])

      if (action) {
        fs.removeSync(pwd);
      }
    }
  }

  // 执行创建操作
  const answer = await inquirer.prompt([
    {
      name: "template",
      type: "list",
      message: "Select a template",
      choices: [
        {
          name: "Vue3 + Element Plus",
          value: "vue3-element-plus"
        },
        {
          name: "Vue2 + Element UI",
          value: "vue2-element-ui"
        },
        {
          name: "React + Ant Design",
          value: "react-ant-design"
        },
        {
          name: "React + Material UI",
          value: "react-material-ui"
        }
      ]
    },
    {
      name: "remote",
      type: "list",
      message: "Select a remote repository",
      choices: [
        {
          name: "GitHub",
          value: "github"
        },
        {
          name: "GitLab",
          value: "gitlab"
        }
      ]
    }
  ])
  
  generate(answer, name)
}
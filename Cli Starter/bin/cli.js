#! /usr/bin/env node
const { program } = require("commander");
const createAction = require('./create')

program
  .command("create <name>")
  .description("Create a new project")
  .option("-f --force", "if dir exist, overwrite it")
  .action(async (name, options) => {
    console.log(name, options)
    createAction(name, options)
  });

program.parse()
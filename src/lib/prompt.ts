import chalk from 'chalk';
import inquirer from 'inquirer';

export const askForClarification = async (searchString: string, matches: string[]) => {
  const selection = await inquirer.prompt([
    {
      type: 'list',
      name: 'target',
      message: `Which file do you want to link to for ${chalk.blue(searchString)}?`,
      choices: matches
    }
  ]);
  return selection.target;
};

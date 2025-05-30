import { faker } from '@faker-js/faker';
import inquirer, { ListQuestion, Question } from 'inquirer';
import { describe, expect, it, vi } from 'vitest';
import { askForClarification } from './prompt.js';

vi.mock('inquirer');
vi.mock('chalk', () => ({
  default: {
    blue: (str: string) => {
      return `BLUE[${str}]`;
    }
  }
}));
describe('The prompt helper', () => {
  it('calls inquirer correctly', async () => {
    const prompt = vi.mocked(inquirer.prompt);
    prompt.mockResolvedValueOnce({ target: 'does not matter' });

    const randomChoices = [faker.system.filePath(), faker.system.filePath(), faker.system.filePath()];
    await askForClarification('this is the search string', randomChoices);

    expect(prompt).toHaveBeenCalledOnce();
    const calledWith = prompt.mock.calls[0][0] as Question[];
    expect(calledWith[0].type).toEqual('list');
    expect((calledWith[0] as ListQuestion).choices).toEqual(randomChoices);
    expect(calledWith[0].message).toMatchInlineSnapshot(
      '"Which file do you want to link to for BLUE[this is the search string]?"'
    );
  });

  it('returns the selected choice', async () => {
    const prompt = vi.mocked(inquirer.prompt);

    const randomResult = faker.system.filePath();

    prompt.mockResolvedValueOnce({ target: randomResult });

    const result = await askForClarification('this is the search string', ['does not matter']);

    expect(result).toEqual(randomResult);
  });
});

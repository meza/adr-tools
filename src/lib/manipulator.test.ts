import { describe, expect, it } from 'vitest';
import { injectLink, getTitleFrom, getLinksFrom } from './manipulator.js';

describe('The ADR manipulator', () => {

  const original = '# NUMBER. TITLE\n'
    + '\n'
    + 'Date: DATE\n'
    + '\n'
    + '## Status\n'
    + '\n'
    + 'STATUS\n'
    + '\n'
    + '## Context\n'
    + '\n'
    + 'The issue motivating this decision, and any context that influences or constrains the decision.\n'
    + '\n'
    + '## Decision\n'
    + '\n'
    + 'The change that we\'re proposing or have agreed to implement.\n'
    + '\n'
    + '## Consequences\n'
    + '\n'
    + 'What becomes easier or more difficult to do and any risks introduced by the change that will need to be mitigated.\n';

  const modified = '# NUMBER. TITLE\n'
    + '\n'
    + 'Date: DATE\n'
    + '\n'
    + '## Status\n'
    + '\n'
    + 'STATUS\n'
    + '\n'
    + 'INJECTED STUFF\n'
    + '\n'
    + '## Context\n'
    + '\n'
    + 'The issue motivating this decision, and any context that influences or constrains the decision.\n'
    + '\n'
    + '## Decision\n'
    + '\n'
    + 'The change that we\'re proposing or have agreed to implement.\n'
    + '\n'
    + '## Consequences\n'
    + '\n'
    + 'What becomes easier or more difficult to do and any risks introduced by the change that will need to be mitigated.\n';

  it('can inject links to the status section', () => {
    const test = injectLink(original, 'INJECTED STUFF');
    expect(test).toEqual(modified);
  });

  it('throws an error when status cannot be found', () => {
    const noStatus = '# NUMBER. TITLE\n';
    const test = () => injectLink(noStatus, 'INJECTED STUFF');
    expect(test).toThrowError('Could not find status section');
  });

  it('adds to the status section even when there are no following headers', () => {
    const noFollowingHeaders = '## STATUS\nACCEPTED\n\n';
    const expected = '## STATUS\nACCEPTED\n\nINJECTED STUFF\n\n';
    const test = injectLink(noFollowingHeaders, 'INJECTED STUFF');
    expect(test).toEqual(expected);
  });

  it('can return the title and number', () => {
    const original = '# 2. This is the title\n';
    const test = getTitleFrom(original);
    expect(test).toEqual('2. This is the title');
  });

  it('can extract links from the status section', () => {
    const original = '## Status\n'
      + '\n'
      + 'Superseded by [3. title here](and-a-link-here.md)\n';
    const extractedLink = getLinksFrom(original);

    expect(extractedLink[0]).toEqual({
      label: 'Superseded by',
      targetNumber: '3',
      text: '3. title here',
      href: 'and-a-link-here.md',
      raw: 'Superseded by [3. title here](and-a-link-here.md)'
    });

  });

});

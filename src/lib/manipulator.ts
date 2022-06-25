import { marked } from 'marked';

const parseAdr = (markdown: string): marked.Token[] => {
  return marked.lexer(markdown);
};

const convertToMd = (tokens: marked.Token[]) => {
  return tokens.map(token => token.raw).join('');
};

export const getDetailsFrom = (adr: string) => {
  const tokens = parseAdr(adr);
  const mainHead = tokens.find(token => token.type === 'heading' && token.depth === 1);
  if (!mainHead) {
    throw new Error('No main heading found');
  }
  return (mainHead as marked.Tokens.Heading).text.trim();
};

export const injectLink = (markdown: string, link: string) => {
  const tokens = parseAdr(markdown);
  const statusIndex = tokens.findIndex(token => token.type === 'heading' && token.text.toLowerCase() === 'status');
  if (statusIndex < 0) {
    throw new Error('Could not find status section');
  }

  const statusDepth = (tokens[statusIndex] as marked.Tokens.Heading).depth;
  let followingHeadingIndex = tokens.findIndex((token, index) => token.type === 'heading' && token.depth === statusDepth && index > statusIndex);
  if (followingHeadingIndex < 0) {
    followingHeadingIndex = tokens.length;
  }
  tokens.splice(followingHeadingIndex, 0, {
    type: 'paragraph', text: link, raw: link, tokens: [
      {
        type: 'text',
        raw: link,
        text: link
      }
    ]
  });
  tokens.splice(followingHeadingIndex + 1, 0, { type: 'space', raw: '\n\n' });
  return convertToMd(tokens);
};

export default parseAdr;

import { marked } from 'marked';

const convertToMd = (tokens: marked.Token[]) => {
  return tokens.map(token => token.raw).join('');
};

export const getLinksFrom = (markdown: string) => {
  const tokens = marked.lexer(markdown);
  const linkRegex = new RegExp(/^(.*)\s\[(.*)\]\((.*)\)$/);
  const links = tokens.filter(token => token.type === 'paragraph' && linkRegex.test(token.text));

  return links.map((link) => {
    const linkToken = link as marked.Tokens.Paragraph;
    const linkMatches = linkToken.text.match(linkRegex);
    if (!linkMatches || linkMatches.length < 3) {
      throw new Error(`Could not parse link from "${linkToken.text}"`);
    }
    return {
      targetNumber: linkMatches[2].substring(0, linkMatches[2].indexOf('.')),
      label: linkMatches[1],
      href: linkMatches[3],
      text: linkMatches[2],
      raw: linkMatches[0]
    };
  });
};

export const getTitleFrom = (adr: string) => {
  const tokens = marked.lexer(adr);
  const mainHead = tokens.find(token => token.type === 'heading' && token.depth === 1);
  if (!mainHead) {
    throw new Error('No main heading found');
  }
  return (mainHead as marked.Tokens.Heading).text.trim();
};

export const supersede = (markdown: string, link: string) => {
  const tokens = marked.lexer(markdown);
  const statusIndex = tokens.findIndex(token => token.type === 'heading' && token.text.toLowerCase() === 'status');
  if (statusIndex < 0) {
    throw new Error('Could not find status section');
  }
  const statusDepth = (tokens[statusIndex] as marked.Tokens.Heading).depth;
  const followingHeadingIndex = tokens.findIndex((token, index) => token.type === 'heading' && token.depth === statusDepth && index > statusIndex);
  const followingParagraphIndex = tokens.findIndex((token, index) => token.type === 'paragraph' && index > statusIndex && index < followingHeadingIndex);

  if (followingParagraphIndex > followingHeadingIndex || followingParagraphIndex === -1) {
    throw new Error('There is no status paragraph. Please format your adr properly');
  }

  tokens[followingParagraphIndex] = {
    type: 'paragraph', text: link, raw: link, tokens: [
      {
        type: 'text',
        raw: link,
        text: link
      }
    ]
  };
  return convertToMd(tokens);
};

export const injectLink = (markdown: string, link: string) => {
  const tokens = marked.lexer(markdown);
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

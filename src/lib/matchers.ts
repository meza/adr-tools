export const filenameDetails = (filename: string) => {
  const adrFilenameRegex = /^(\d{4})-(.*)\.md$/;
  const match = filename.match(adrFilenameRegex);
  if (match) {
    const number = match[1];
    const title = match[2];
    const normalisedNumber = number.replace(/^0+/, '');
    const titleCaseTitle = title.replace('-', ' ').replace(/^(.)/, (m: string) => m.toUpperCase());

    return {
      number: normalisedNumber,
      title: titleCaseTitle,
      filename: filename
    };
  }
  throw new Error('Could not parse filename');
};

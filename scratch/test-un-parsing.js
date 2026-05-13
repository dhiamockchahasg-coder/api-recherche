
const fs = require('fs');

async function testParsing() {
  console.log('Fetching UN Sanctions XML...');
  const res = await fetch('https://scsanctions.un.org/resources/xml/en/consolidated.xml');
  const xmlString = await res.text();
  
  // In Node, we need a parser like jsdom or xmldom, but I'll use a simple regex for testing
  const q = 'Putin';
  const regex = new RegExp(`<FIRST_NAME>[^<]*${q}[^<]*</FIRST_NAME>|<SECOND_NAME>[^<]*${q}[^<]*</SECOND_NAME>`, 'gi');
  const matches = xmlString.match(regex);
  
  console.log('Matches found:', matches ? matches.length : 0);
  if (matches) {
    console.log('Samples:', matches.slice(0, 5));
  }
}

testParsing();

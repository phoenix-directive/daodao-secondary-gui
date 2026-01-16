export const useLocalhost = import.meta.env.VITE_USE_LOCALHOST_BACKEND === '1';
const isLocalhost = window.location.hostname === 'localhost';

const forceShowTeaser = false;
// Check if we should show the teaser page
const showTeaser =
  forceShowTeaser ||
  window.location.hostname === 'creda.finance' ||
  window.location.hostname === 'www.creda.finance';

export const globalConfig = {
  cdnEndpoint: 'https://nft-storage.b-cdn.net',
  nftEndpoint:
    useLocalhost && isLocalhost ? 'http://localhost:3040' : 'https://nft.erisprotocol.com',

  adminAddresses: [
    'terra1gtuvt6eh4m67tvd2dnfqhgks9ec6ff08c5vlup',
    'terra1l86ytzn2mt0h3t2sw7wks4amxvzfhw7xuv7unr',
    'terra1alxk3fmhcl0ga80gl9yj9zp3ezjm4sdh8a9l9c',
    'terra1kefa2zgjn45ctj32d3tje5jdwus7px6n2klgzl',
    'terra1gaxzcygjyz7gq8gq9tjy02qq38kcf84um9wy0a',
    'terra1wlfagw79h0tushlz7uhvg3kxg5qq6zeg6axazf',
  ],
  showTeaser,
  // Exclusive Access Phase start date (UTC)
  exclusiveAccessStartDate: new Date('2025-12-15T09:00:00Z'),
};

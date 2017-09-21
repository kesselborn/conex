// alias for document.querySelectorAll
const $ = function(s, parent){ return (parent || document).querySelectorAll(s); };

// alias for document.querySelector
const $1 = function(s, parent){ return (parent || document).querySelector(s); };

const cleanUrl = function(url) {
  return url.replace('http://','').replace('https://','').toLowerCase();
};

import { $ } from './conex-helper.js';

const params = new URLSearchParams(window.location.search);

if (params.get('debug')) {
  $('section#debug')!.style.display = 'block';
}

// if (params.get('log')) {
//   logLevel(params.get('log'));
// }

console.log('boom');
// debug('console.debug output');

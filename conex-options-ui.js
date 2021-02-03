import { $e, logLevel, debug } from './conex-helper.js';

const params = new URLSearchParams(window.location.search);


if (params.get("debug")) {
    document.body.appendChild(
        $e('a', { href: browser.runtime.getURL('/test/conex-test.html'), content: 'run test suite' })
    );
}

if (params.get("log")) {
    logLevel(params.get("log"));
}

debug('console.debug output');
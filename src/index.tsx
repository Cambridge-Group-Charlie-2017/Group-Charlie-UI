import * as React from "react";
import * as ReactDOM from "react-dom";

// Polyfills
import 'core-js/es6';
declare function require(name: string): any;
if (typeof (window as any).URLSearchParams === 'undefined') {
    (window as any).URLSearchParams = require('url-search-params');
}

import 'normalize.css';
import './index.css';

ReactDOM.render(
    <div>It works!</div>,
    document.getElementById("root")
);
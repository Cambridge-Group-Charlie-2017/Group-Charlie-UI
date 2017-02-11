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

import { Navigation, NavigationListItem } from './components/navigation';

let navigationPanel: NavigationListItem[] = [{
    text: '',
    icon: 'bars'
}, {
    text: 'New email',
    icon: 'plus'
}, {
    text: 'Folders',
    icon: 'folder-o',
    collapsible: false,
    noindent: true,
    children: []
}];

let bottomNavigationItems: NavigationListItem[] = [{
    text: 'Settings',
    icon: 'cog'
}];

let selected: NavigationListItem = null;
function render() {
    ReactDOM.render(
        <Navigation list={navigationPanel} bottomList={bottomNavigationItems} selected={selected} onSelect={e => {
            if ('folder' in e) {
                selected = e;
                render();
            }
        }} />,
        document.getElementById("root")
    );
}

import { Store, Folder } from './services/api';

function folderToListItem(f: Folder) {
    let ret: NavigationListItem = {
        text: <span>{f.name}{f.unread > 0 ? <span style={{ float: 'right' }}>{f.unread}</span> : null}</span>,
        folder: f
    };
    if (f.subfolder.length) {
        let subitems = f.subfolder.map(folderToListItem);
        ret.children = subitems;
    }
    return ret;
}

async function main() {
    let store = new Store();

    let f: Folder[] = await store.getFolders();

    navigationPanel[2].children = f.map(folderToListItem);
    render();
}

render();
main();

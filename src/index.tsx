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
import { LazyList } from './components/lazylist';
import { ItemSummary } from './components/item-summary';
import { EmailView } from './components/email-view';

import { Store, Folder, Message } from './services/api';

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
let selectedMessage: Message = null;

function onNavClick(item: NavigationListItem) {
    if ('folder' in item && selected !== item) {
        selected = item;
        selectedMessage = null;
        render();
    }
}

async function loadMessage(start: number, end: number): Promise<any[]> {
    if (!selected) {
        return [];
    }
    let folder = (selected as any).folder as Folder;

    let realStart = folder.msgnum - end + 1;
    let realEnd = folder.msgnum - start + 1;

    let messages = await folder.getMessages(realStart, realEnd);
    return messages.reverse();
}

function fastLoadMessage(start: number, end: number): any[] {
    if (!selected) {
        return [];
    }
    let folder = (selected as any).folder as Folder;

    let realStart = folder.msgnum - end + 1;
    let realEnd = folder.msgnum - start + 1;

    let messages = folder.getCachedMessage(realStart, realEnd);
    if (!messages) return null;
    return messages.reverse();
}

function renderMessage(obj: Message, id: number) {
    return <ItemSummary item={obj} selected={selectedMessage === obj} />;
}

function onSelectMessage(msg: Message) {
    if (selectedMessage === msg) {
        selectedMessage = null;
    } else {
        selectedMessage = msg;
    }
    render();
}

function render() {
    let count = 0;
    if (selected) {
        let folder = (selected as any).folder as Folder;
        count = folder.msgnum;
    }

    let lazyList = count === 0
        ? <div id="list-placeholder">{selected ? 'There are no messages in this folder.' : 'Select a folder to start.'}</div>
        : <LazyList length={count} context={selected} itemHeight={80} load={loadMessage} fastload={fastLoadMessage} render={renderMessage} onSelect={onSelectMessage} />;
    let messagePane = selectedMessage ? <div id="message"><EmailView item={selectedMessage} /></div> : null;

    ReactDOM.render(
        <div className="toplevel">
            <Navigation list={navigationPanel} bottomList={bottomNavigationItems} selected={selected} onSelect={onNavClick} />
            {lazyList}
            {messagePane}
        </div>,
        document.getElementById("root")
    );
}

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

import * as React from "react";
import * as ReactDOM from "react-dom";

// Polyfills
import 'core-js/es6';
if (typeof (window as any).URLSearchParams === 'undefined') {
    (window as any).URLSearchParams = require('url-search-params');
}

import 'normalize.css';
import './index.css';

import { Navigation, NavigationListItem } from './components/navigation';
import { LazyList } from './components/lazylist';
import { ItemSummary } from './components/item-summary';
import { EmailView } from './components/email-view';
import { EmailEditor } from './components/email-editor';
import { ToolbarButton, Toolbar } from './components/toolbar';

import { Store, Folder, LocalMessage, RemoteMessage, Message, Content } from './services/api';
import * as api from './services/api';
import { Settings } from './settings';

import { Sanitizer } from './services/sanitize';
import { linkify } from './services/linkify';

function sanitize(message: RemoteMessage, content: Content) {
    if (content.type === 'text/html') {
        let sanitizer = new class extends Sanitizer {
            sanitizeUrl(url: string) {
                url = super.sanitizeUrl(url);
                if (!url) return url;

                // This means image from attachment
                // We transform the URL then
                if (url.startsWith('cid:')) {
                    return message.getCidUrl(url.substring(4));
                }
                return url;
            }
        };
        sanitizer.protocolAllowList['cid'] = true;

        return sanitizer.sanitize(content.content);
    } else {
        return linkify(content.content);
    }
}

interface NavItem extends NavigationListItem {
    handler?: () => void;
    folder?: Folder;
};

let navigationPanel: NavItem[] = [{
    text: '',
    icon: 'bars',
    handler: onNavClickNav
}, {
    text: 'New email',
    icon: 'plus',
    handler: onNavClickNew
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

let topNavigationFold: NavItem[] = [{
    text: '',
    icon: 'bars',
    handler: onNavClickNav
}, {
    text: '',
    icon: 'plus',
    handler: onNavClickNew
}, {
    text: '',
    icon: 'folder-o'
}];

let bottomNavigationFold: NavigationListItem[] = [{
    text: '',
    icon: 'cog'
}];

let messagesInView: Message[] = [];

let folderSelected: NavItem = null;
let threadSelected: Message = null;

enum WideScreenMode {
    WideScreen,
    Desktop,
    Tablet,
    Mobile
};
let widescreenMode: WideScreenMode = null;
let widescreenModeActual: WideScreenMode = null;
let navigationPopup = false;
let showSetting = false;

/* Navigation Control */
function onNavClick(item: NavItem) {
    let handler = item.handler;
    if (handler) {
        handler();
    }

    if (item === bottomNavigationItems[0]) {
        showSetting = true;
        render();
        return;
    }
    if ('folder' in item && folderSelected !== item) {
        folderSelected = item;
        messagesInView = [];
        threadSelected = null;
        render();
    }


    if (navigationPopup) {
        document.body.removeEventListener('click', onClickWhenNavPopupOpen);
        navigationPopup = false;
        render();
    }
}

function isParentOf(element: Element, parent: Element) {
    while (element.parentElement) {
        if (element.parentElement === parent) return true;
        element = element.parentElement;
    }
    return false;
}

function onClickWhenNavPopupOpen(event: MouseEvent) {
    let target = event.target as HTMLElement;
    if (isParentOf(target, document.querySelector('.Main.navigation'))) {
        return;
    }
    document.body.removeEventListener('click', onClickWhenNavPopupOpen);

    navigationPopup = false;
    render();
}

function onNavClickNav() {
    // If these modes can naturally expand navigation panel,
    // then expand them
    if (widescreenModeActual === WideScreenMode.Tablet
        || widescreenModeActual === WideScreenMode.WideScreen) {
        widescreenMode = widescreenMode === widescreenModeActual ? widescreenModeActual + 1 : widescreenModeActual;
    } else {
        if (!navigationPopup) {
            navigationPopup = true;
            document.body.addEventListener('click', onClickWhenNavPopupOpen);
        }
    }
    render();
}

function onNavClickNew() {
    let message = new LocalMessage();
    let content = new Content();

    message.setContent(content);
    messagesInView = [message];
    render();
}

function onNavFoldClick(item: NavItem) {
    let handler = item.handler;
    if (handler) {
        handler();
    } else if (item === topNavigationFold[2]) {
        navigationPopup = true;
        document.body.addEventListener('click', onClickWhenNavPopupOpen);
        render();
    }
}

/* Message List Control */
async function loadMessage(start: number, end: number): Promise<any[]> {
    if (!folderSelected) {
        return [];
    }
    let folder = (folderSelected as any).folder as Folder;

    let realStart = folder.msgnum - end + 1;
    let realEnd = folder.msgnum - start + 1;

    let messages = await folder.getMessages(realStart, realEnd);
    return messages.reverse();
}

function fastLoadMessage(start: number, end: number): any[] {
    if (!folderSelected) {
        return [];
    }
    let folder = (folderSelected as any).folder as Folder;

    let realStart = folder.msgnum - end + 1;
    let realEnd = folder.msgnum - start + 1;

    let messages = folder.getCachedMessage(realStart, realEnd);
    if (!messages) return null;
    return messages.reverse();
}

function renderMessage(obj: Message, id: number) {
    return <ItemSummary item={obj} selected={threadSelected === obj} />;
}

function onSelectMessage(msg: Message) {
    // A click can either select or deselect a message
    if (threadSelected === msg) {
        threadSelected = null;
    } else {
        threadSelected = msg;
    }

    // Clear the view
    messagesInView = [];

    if (threadSelected) {
        let onContentLoad = (contentFetched: Content) => {
            messagesInView = [threadSelected];
            render();

            if (threadSelected.unread && threadSelected instanceof RemoteMessage) {
                threadSelected.setUnread(false).then(() => render());
            }
        }

        if (threadSelected.getContentSync()) {
            onContentLoad(threadSelected.getContentSync());
        } else {
            threadSelected.getContent().then(onContentLoad);
            render();
        }
    } else {
        render();
    }
}

/* Message Pane */
function quoteMessage(msg: RemoteMessage, content: Content) {
    let msgBody = sanitize(threadSelected as RemoteMessage, content);
    let tag = content.type === 'text/html' ? 'div' : 'pre';
    let html = '';
    html += `<b>From: </b>${msg.from}<br/>`;
    html += `<b>Sent: </b>${msg.date}<br/>`;
    html += `<b>To: </b>${msg.to}<br/>`;
    if (msg.cc.length) html += `<b>Cc: </b>${msg.cc}<br/>`;
    html += `<b>Subject: </b>${msg.subject}`;

    html += `<${tag}>${msgBody}</${tag}>`;
    return html;
}

function createReplyDraft(message: Message) {
    let firstMessage = messagesInView[0];
    if (firstMessage instanceof LocalMessage) {
        return firstMessage;
    }
    let contentFetched = message.getContentSync();
    let replyMessage = new LocalMessage();
    let content = new Content();

    content.content = `<p></p><hr>${quoteMessage(message as RemoteMessage, contentFetched)}`;

    replyMessage.inReplyTo = message.mid;
    replyMessage.setContent(content);

    messagesInView.unshift(replyMessage);
    return replyMessage;
}

function onClickReply(message: Message) {
    let replyMessage = createReplyDraft(message);

    replyMessage.to = [threadSelected.from];
    replyMessage.subject = (threadSelected.inReplyTo ? '' : 'Re: ') + threadSelected.subject;

    render();
}

function onClickReplyAll(message: Message) {
    let replyMessage = createReplyDraft(message);

    replyMessage.to = [threadSelected.from, ...threadSelected.to];
    replyMessage.cc = threadSelected.cc;
    replyMessage.bcc = threadSelected.bcc;
    replyMessage.subject = (threadSelected.inReplyTo ? '' : 'Re: ') + threadSelected.subject;

    render();
}

function onClickForward(message: Message) {
    let replyMessage = createReplyDraft(message);

    replyMessage.subject = "Fwd: " + threadSelected.subject;

    render();
}

function onClickSetUnread(message: Message, unread: boolean) {
    if (message instanceof RemoteMessage) {
        message.setUnread(unread).then(() => render());
    }
}

function onClickSetFlagged(message: Message, flagged: boolean) {
    if (message instanceof RemoteMessage) {
        message.setFlagged(flagged).then(() => render());
    }
}

function onClickSend(message: LocalMessage) {
    api.post('send', undefined, {
        to: message.to.map(t => t.serialize()),
        cc: message.cc.map(t => t.serialize()),
        bcc: message.bcc.map(t => t.serialize()),
        subject: message.subject,
        content: message.getContentSync().content,
        inReplyTo: message.inReplyTo
    }).then(() => {
        let id = messagesInView.indexOf(message);
        if (id !== -1) {
            messagesInView.splice(id, 1);
            render();
        }
    });
}

function onClickAttach(message: LocalMessage) {
    let content = message.getContentSync().content;
    // Process to text
    let textContent = new DOMParser().parseFromString(content, 'text/html').body.textContent;
    api.post('suggestion', undefined, { data: textContent }).then(file => {
        let param = new URLSearchParams();
        param.append('title', 'Select Attachment');
        param.append('file', file);
        api.get('native/select_file', param).then(file => {
            alert(file);
        });
    });
}

function onClickDiscard(message: LocalMessage) {
    let id = messagesInView.indexOf(message);
    if (id !== -1) {
        messagesInView.splice(id, 1);
        render();
    }
}


function render() {
    // Navigation panel
    let navigationPane = <Navigation className={`Main navigation${navigationPopup ? ' visible' : ''}`} list={navigationPanel} bottomList={bottomNavigationItems} selected={folderSelected} onSelect={onNavClick} />;

    let navigationFold = <Navigation className="Main navigation-fold" list={topNavigationFold} bottomList={bottomNavigationFold} onSelect={onNavFoldClick} />;

    // Message list
    let count = 0;
    if (folderSelected) {
        let folder = (folderSelected as any).folder as Folder;
        count = folder.msgnum;
    }

    let lazyList = count === 0
        ? <div id="list-placeholder">{folderSelected ? 'There are no messages in this folder.' : 'Select a folder to start.'}</div>
        : <LazyList length={count} context={folderSelected} itemHeight={80} load={loadMessage} fastload={fastLoadMessage} render={renderMessage} onSelect={onSelectMessage} />;

    // Message view
    let messagePane = null;
    if (messagesInView.length) {
        let backButton = widescreenMode < WideScreenMode.Tablet ? null :
            <ToolbarButton icon="arrow-left" text="Back" onClick={() => onSelectMessage(null)} />

        let viewId = 0, editorId = 0;
        let messageViews = messagesInView.map((msg, i) => {
            let toolbar, view, key: string;

            if (msg instanceof LocalMessage) {
                toolbar = <Toolbar>
                    {i === 0 && backButton}
                    <ToolbarButton icon="paper-plane" text="Send" onClick={() => onClickSend(msg)} />
                    <ToolbarButton icon="paperclip" text="Attach" onClick={() => onClickAttach(msg)} />
                    <ToolbarButton icon="trash-o" text="Discard" onClick={() => onClickDiscard(msg)} />
                </Toolbar>
            } else {
                toolbar = <Toolbar>
                    {i === 0 && backButton}
                    <ToolbarButton icon="reply" text="Reply" onClick={() => onClickReply(msg)} />
                    <ToolbarButton icon="reply-all" text="Reply All" onClick={() => onClickReplyAll(msg)} />
                    <ToolbarButton icon="share" text="Forward" onClick={() => onClickForward(msg)} />
                    <ToolbarButton icon="trash-o" text="Delete" />
                    {
                        msg.flagged
                            ? <ToolbarButton icon="flag" text="Unflag" onClick={() => onClickSetFlagged(msg, false)} />
                            : <ToolbarButton icon="flag-o" text="Flag" onClick={() => onClickSetFlagged(msg, true)} />
                    }
                    {
                        msg.unread
                            ? <ToolbarButton icon="envelope-open-o" text="Mark As Read" onClick={() => onClickSetUnread(msg, false)} />
                            : <ToolbarButton icon="envelope-o" text="Mark As Unread" onClick={() => onClickSetUnread(msg, true)} />
                    }
                    <ToolbarButton icon="folder-o" text="Move" />
                </Toolbar>;
            }

            if (msg instanceof LocalMessage) {
                key = `editor${editorId++}`;
                view = <EmailEditor item={msg} content={msg.getContentSync()} />;
            } else {
                key = `view${viewId++}`;
                view = <EmailView item={msg as RemoteMessage} />
            }

            return <div key={key} className="msgSection">{toolbar}{view}</div>;
        });


        messagePane = <div id="message">{messageViews}</div>
    }

    let wsClass;
    switch (widescreenMode) {
        case WideScreenMode.WideScreen: wsClass = 'display-widescreen'; break;
        case WideScreenMode.Desktop: wsClass = 'display-desktop'; break;
        case WideScreenMode.Tablet: wsClass = 'display-tablet'; break;
        default: wsClass = 'display-mobile'; break;
    }

    let mainframe = <div className={`Main ${wsClass} frame${showSetting ? ' hidden' : ''}`}>
        {navigationPane}
        {navigationFold}
        {lazyList}
        {messagePane}
    </div>;

    ReactDOM.render(
        <div className="toplevel">
            {mainframe}
            {showSetting && <Settings onBack={() => {
                showSetting = false;
                main();
            }} />}
        </div>,
        document.getElementById("root")
    );
}

function folderToListItem(f: Folder) {
    let ret: NavItem = {
        text: <span>{f.name}{f.unread > 0 ? <span style={{ float: 'right' }}>{f.unread}</span> : null}</span>,
        folder: f
    };
    if (f.subfolder.length) {
        let subitems = f.subfolder.map(folderToListItem);
        ret.children = subitems;
    }
    return ret;
}

async function reloadData() {
    let store = new Store();

    let f: Folder[] = await store.getFolders();

    navigationPanel[2].children = f.map(folderToListItem);

    // Re-set folder selected
    if (folderSelected)
        folderSelected = navigationPanel[2].children.find(
            v => (v as NavItem).folder.name === folderSelected.folder.name);

    threadSelected = null;
    messagesInView = [];

    render();
}

async function main() {
    let status = await api.get('status');

    if (status === 'INIT') {
        // The software is not ready to use
        // prompt user for account information
        showSetting = true;

        render();
        return;
    }

    await reloadData();
}

function onResize() {
    let newWidescreenMode: WideScreenMode;
    if (window.innerWidth < 560) {
        newWidescreenMode = WideScreenMode.Mobile;
    } else if (window.innerWidth < 1000) {
        newWidescreenMode = WideScreenMode.Tablet;
    } else if (window.innerWidth < 1200) {
        newWidescreenMode = WideScreenMode.Desktop;
    } else {
        newWidescreenMode = WideScreenMode.WideScreen;
    }

    if (newWidescreenMode !== widescreenMode && newWidescreenMode !== widescreenModeActual) {
        widescreenMode = newWidescreenMode;

        // Clean up if window resizes when nav popup is open
        document.body.removeEventListener('click', onClickWhenNavPopupOpen);
        navigationPopup = false;

        render();
    }
    widescreenModeActual = newWidescreenMode;
}

window.addEventListener('resize', event => {
    onResize();
});

onResize();
main();

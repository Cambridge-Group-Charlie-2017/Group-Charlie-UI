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

let messagesInView: Message[] = [];

let folderSelected: NavigationListItem = null;
let threadSelected: Message = null;


/* Navigation Control */
function onNavClick(item: NavigationListItem) {
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
        messagesInView = [];
    } else {
        threadSelected = msg;
    }

    if (threadSelected) {
        let onContentLoad = (contentFetched: Content) => {
            messagesInView = [threadSelected];
            render();

            if (threadSelected.unread && threadSelected instanceof RemoteMessage) {
                threadSelected.setUnread(false).then(() => render());
            }
        }

        // Clear the view
        messagesInView = [];

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


function render() {
    let count = 0;
    if (folderSelected) {
        let folder = (folderSelected as any).folder as Folder;
        count = folder.msgnum;
    }

    let lazyList = count === 0
        ? <div id="list-placeholder">{folderSelected ? 'There are no messages in this folder.' : 'Select a folder to start.'}</div>
        : <LazyList length={count} context={folderSelected} itemHeight={80} load={loadMessage} fastload={fastLoadMessage} render={renderMessage} onSelect={onSelectMessage} />;

    let messagePane = null;
    if (messagesInView.length) {
        let viewId = 0, editorId = 0;
        let messageViews = messagesInView.map(msg => {
            let toolbar, view, key: string;

            if (msg instanceof LocalMessage) {
                toolbar = <Toolbar>
                    <ToolbarButton icon="paper-plane" text="Send" />
                    <ToolbarButton icon="paperclip" text="Attach" />
                    <ToolbarButton icon="trash-o" text="Discard" />
                </Toolbar>
            } else {
                toolbar = <Toolbar>
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

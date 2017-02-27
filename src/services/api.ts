import { Cache } from './utils';

const BASE = 'http://localhost:6245/api';

// Naive data validation
function propCheck(shape: string[], data: any) {
    for (let name of shape) {
        if (!(name in data)) {
            return false;
        }
    }
    return true;
}

function query(method: string, endpoint: string, params: URLSearchParams, data?: any) {
    return new Promise<any>((resolve, reject) => {
        let url = `${BASE}/${endpoint}`;
        if (params) {
            url += '?' + params.toString();
        }

        let request = new XMLHttpRequest();
        request.open(method, url, true);

        request.onload = function () {
            if (request.status >= 200 && request.status < 400) {
                var data = JSON.parse(request.response);
                resolve(data);
            } else {
                reject(request.response);
            }
        };

        request.onerror = function (error) {
            reject(error);
        };

        request.send(data && JSON.stringify(data));
    });
}

export function get(endpoint: string, params: URLSearchParams = null) {
    return query('GET', endpoint, params);
}

export function post(endpoint: string, params: URLSearchParams = null, data?: any) {
    return query('POST', endpoint, params, data);
}

export function put(endpoint: string, params: URLSearchParams = null, data?: any) {
    return query('PUT', endpoint, params, data);
}

export function patch(endpoint: string, params: URLSearchParams = null) {
    return query('PATCH', endpoint, params);
}


export class Store {
    folders: Folder[];

    async getFolders() {
        function processFolder(data: any, path: any) {
            if (!(data instanceof Array)) {
                throw 'Unexpected API return value';
            }

            let ret: Folder[] = [];
            for (let i = 0; i < data.length; i++) {
                let entry = data[i];
                // Do type checking
                if (!propCheck(['name', 'unread', 'messages', 'subfolder'], entry)) {
                    throw 'Unexpected API return value format';
                }
                let folder = new Folder();
                folder.name = entry.name;
                folder.path = path + folder.name;
                folder.unread = entry.unread;
                folder.msgnum = entry.messages;

                let subfolder: Folder[] = [];
                if ('subfolder' in entry) {
                    subfolder = processFolder(entry.subfolder, folder.path + '/');
                }
                folder.subfolder = subfolder;

                ret[i] = folder;
            }
            return ret;
        }

        if (!this.folders) {
            let json = await get('folders');
            this.folders = processFolder(json, "");
        }
        return this.folders;
    }
}

export class Folder {
    name: string;
    path: string;
    unread: number;
    msgnum: number;
    subfolder: Folder[];
    messages: Cache<Message> = new Cache<Message>();

    private async uncachedGetMessages(start: number, end: number) {
        let url = `folders/${encodeURIComponent(this.path)}/messages`;
        let params = new URLSearchParams();
        params.set('start', start.toString());
        params.set('end', (end - 1).toString());
        let json = await get(url, params);

        if (!(json instanceof Array)) {
            throw 'Unexpected API return value';
        }

        return json.map((obj, i) => {
            return RemoteMessage.deserialize(obj, this, i + start);
        });
    }

    async getMessages(start: number, end: number) {
        let [dirtyStart, dirtyEnd] = this.messages.mask(start, end);
        if (dirtyStart !== dirtyEnd) {
            let msg = await this.uncachedGetMessages(dirtyStart, dirtyEnd);
            this.messages.put(dirtyStart, dirtyEnd, msg);
        }
        return this.messages.get(start, end);
    }

    getCachedMessage(start: number, end: number) {
        let [dirtyStart, dirtyEnd] = this.messages.mask(start, end);
        if (dirtyStart !== dirtyEnd) return null;
        return this.messages.get(start, end);
    }
}

export abstract class Message {
    /**
     * Folder containing this message
     */
    folder: Folder = null;
    /**
     * Id of this message within the folder
     */
    msgid: number = -1;

    // In the web side, envelope for messages
    // should be loaded already when Message is created
    from: Contact = null;
    to: Contact[] = [];
    cc: Contact[] = [];
    bcc: Contact[] = [];
    inReplyTo: string = "";

    subject: string = "";
    date: Date = null;
    summary: string = "";

    // Flags
    unread: boolean = false;
    flagged: boolean = false;
    hasAttachment: boolean = false;

    abstract getContent(): Promise<Content>;
    abstract getContentSync(): Content;
    abstract setContent(content: Content): Promise<void>;
}

export class LocalMessage extends Message {
    private content: Content;

    async getContent() {
        return this.content;
    }

    async setContent(content: Content) {
        this.content = content;
    }

    getContentSync() {
        return this.content;
    }
}

export class RemoteMessage extends Message {
    private content: Content;

    private get uid() {
        return this.folder.path + '/' + this.msgid;
    }

    async getContent() {
        if (!this.content) {
            let url = `messages/${encodeURIComponent(this.uid)}`;
            let json = await get(url);

            let content = new Content();
            content.type = json['content-type'];
            content.content = json.content;
            content.attachment = json.attachment;

            this.content = content;
        }
        return this.content;
    }

    getContentSync() {
        return this.content;
    }

    async setContent(content: Content) {
        // TODO: Server sync
        this.content = content;
    }

    getCidUrl(cid: string) {
        return `${BASE}/messages/${encodeURIComponent(this.uid)}/cid/${encodeURIComponent(cid)}`;
    }

    openAttachment(name: string) {
        let url = `messages/${encodeURIComponent(this.uid)}/att/${encodeURIComponent(name)}`;
        return get(url);
    }

    async setUnread(unread: boolean) {
        let params = new URLSearchParams();
        params.append('unread', String(unread));
        await patch(`messages/${encodeURIComponent(this.uid)}`, params);
        this.unread = unread;
    }

    async setFlagged(flagged: boolean) {
        let params = new URLSearchParams();
        params.append('flagged', String(flagged));
        await patch(`messages/${encodeURIComponent(this.uid)}`, params);
        this.flagged = flagged;
    }

    static deserialize(json: any, folder: Folder, index: number) {
        let msg = new RemoteMessage();
        msg.folder = folder;
        msg.msgid = index;
        msg.from = Contact.deserialize(json.from);
        msg.to = json.to.map(Contact.deserialize);
        msg.cc = json.cc.map(Contact.deserialize);
        msg.bcc = json.bcc.map(Contact.deserialize);
        msg.inReplyTo = json.inReplyTo;
        msg.subject = json.subject;
        msg.date = new Date(json.date);
        msg.summary = json.summary;
        msg.unread = json.unread;
        msg.flagged = json.flagged;
        msg.hasAttachment = json.hasAttachment;
        return msg;
    }
}

export class Content {
    type: string = "text/html";
    content: string = "";
    attachment: string[] = [];
}

export class Contact {
    name: string;
    address: string;

    toString() {
        if (this.name) return `${this.name} <${this.address}>`;
        return this.address;
    }

    serialize() {
        return {
            name: this.name,
            address: this.address
        };
    }

    static deserialize(json: any) {
        let contact = new Contact();
        contact.name = json.name;
        contact.address = json.address;
        return contact;
    }
}

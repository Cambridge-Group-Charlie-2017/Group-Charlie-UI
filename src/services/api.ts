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

export function get(endpoint: string, params: URLSearchParams = null) {
    return new Promise<any>((resolve, reject) => {
        let url = `${BASE}/${endpoint}`;
        if (params) {
            url += '?' + params.toString();
        }

        let request = new XMLHttpRequest();
        request.open('GET', url, true);

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

        request.send();
    });
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
            return Message.deserialize(obj, this, i + start);
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

export class Message {
    /**
     * Folder containing this message
     */
    folder: Folder;
    /**
     * Id of this message within the folder
     */
    msgid: number;

    // In the web side, envelope for messages
    // should be loaded already when Message is created
    from: Contact;
    to: Contact[];
    cc: Contact[];
    bcc: Contact[];

    subject: string;
    date: Date;
    summary: string;
    unread: boolean;

    private content: Content;

    async getContent() {
        if (!this.content) {
            let url = `folders/${encodeURIComponent(this.folder.path)}/messages/${this.msgid}`;
            let json = await get(url);

            let content = new Content();
            content.type = json['content-type'];
            content.content = json.content;

            this.content = content;
        }
        return this.content;
    }

    getCidUrl(cid: string) {
        return `${BASE}/folders/${encodeURIComponent(this.folder.path)}/messages/${this.msgid}/${encodeURIComponent(cid)}`;
    }

    static deserialize(json: any, folder: Folder, index: number) {
        let msg = new Message();
        msg.folder = folder;
        msg.msgid = index;
        msg.from = Contact.deserialize(json.from);
        msg.to = json.to.map(Contact.deserialize);
        msg.cc = json.cc.map(Contact.deserialize);
        msg.bcc = json.bcc.map(Contact.deserialize);
        msg.subject = json.subject;
        msg.date = new Date(json.date);
        msg.summary = json.summary;
        msg.unread = json.unread;
        return msg;
    }
}

export class Content {
    type: string;
    content: string;
}

export class Contact {
    name: string;
    address: string;

    toString() {
        if (this.name) return `${this.name} <${this.address}>`;
        return this.address;
    }

    static deserialize(json: any) {
        let contact = new Contact();
        contact.name = json.name;
        contact.address = json.address;
        return contact;
    }
}

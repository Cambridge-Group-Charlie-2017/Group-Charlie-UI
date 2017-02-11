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
        params.set('end', end.toString());
        let json = await get(url, params);

        if (!(json instanceof Array)) {
            throw 'Unexpected API return value';
        }

        function deserializeContact(obj: any) {
            let contact = new Contact();
            contact.name = obj.name;
            contact.address = obj.address;
            return contact;
        }

        return json.map((obj, i) => {
            let msg = new Message();
            msg.folder = this;
            msg.msgid = i + start;
            msg.from = deserializeContact(obj.from);
            msg.to = obj.to.map(deserializeContact);
            msg.cc = obj.cc.map(deserializeContact);
            msg.bcc = obj.bcc.map(deserializeContact);
            msg.subject = obj.subject;
            msg.date = new Date(obj.date);
            msg.summary = obj.summary;
            msg.unread = obj.unread;
            return msg;
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
}

export class Contact {
    name: string;
    address: string;

    toString() {
        if (this.name) return `${this.name} <${this.address}>`;
        return this.address;
    }
}

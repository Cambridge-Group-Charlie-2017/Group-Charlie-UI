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
}

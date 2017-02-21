// Matches protocol
let PROTOCOL = '([0-9A-Za-z+.-]+):/?/?';
// Matches host. We exclude some symbols here which are common in writing texts
let HOST = '([0-9.]+|\\[[0-9a-fA-F:.]+\\]|[^\\]\\[<>()/":\\s]+)';
let PORT = '(:[0-9]+)?';
let PATH = '(/[^\\]\\[<>"\\s]*)?';

let URL_REGEX = new RegExp('\\b' + PROTOCOL + HOST + PORT + PATH, "g");

function htmlEscape(text: string) {
    let node = document.createTextNode(text);
    let span = document.createElement('span');
    span.appendChild(node);
    return span.innerHTML;
}

export function linkify(content: string) {
    URL_REGEX.lastIndex = 0;
    let index = 0;
    let match: RegExpExecArray;
    let ret = '';
    while ((match = URL_REGEX.exec(content)) !== null) {
        // Capture the text before this match
        let text = content.substring(index, match.index);
        index = URL_REGEX.lastIndex;
        ret += htmlEscape(text);

        let url = match[0];
        if (match[1] === 'http' || match[1] === 'https') {
            // There are some symbols common in English, they are
            // not treated as part of URL if they are trailing.
            // If there is no left parenthesis,
            // we assume that right parenthese will then not be part of URL
            let regex = text.indexOf('(') !== -1 ? /[,;\\.:!?]+$/ : /[,;\\.:!?)]+$/;
            let submatch = regex.exec(match[0]);
            let detLength = submatch ? submatch[0].length : 0;
            if (detLength !== 0) {
                url = url.substring(0, url.length - detLength);
                index -= detLength;
            }
            url = `<a target="_blank" href="${htmlEscape(encodeURI(url))}">${htmlEscape(url)}</a>`;
        } else {
            url = htmlEscape(url);
        }
        ret += url;
    }

    let text = content.substring(index);
    ret += htmlEscape(text);

    return ret;
}

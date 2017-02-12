function listToSet(list: string[]) {
    let ret: { [id: string]: boolean; } = {};
    for (let l of list) ret[l] = true;
    return ret;
}

function getter(clazz: any, name: PropertyKey): (x: any) => any {
    let getter = Object.getOwnPropertyDescriptor(clazz.prototype, name).get;
    return x => getter.call(x);
}

/**
 * Helper functions to parse the DOM without being affected by potential clobbering attacks.
 */
class DOM {
    static documentElement: (x: Document) => HTMLElement = getter(Document, 'documentElement');
    static tagName: (x: Element) => string = getter(Element, 'tagName');
    static parentNode: (x: Node) => Node = getter(Node, 'parentNode');
    static children: (x: Element) => HTMLCollection = getter(Element, 'children');
    static attributes: (x: Element) => NamedNodeMap = getter(Element, 'attributes');
    static remove: (x: Element) => void = x => Element.prototype.remove.call(x);
    static setAttribute: (x: Element, name: string, value: string) => void = (x, name, value) => Element.prototype.setAttribute.call(x, name, value);
    static getAttribute: (x: Element, name: string) => string = (x, name) => Element.prototype.getAttribute.call(x, name);
    static removeAttribute: (x: Element, name: string) => void = (x, name) => Element.prototype.removeAttribute.call(x, name);
    static insertBefore: (x: Node, newNode: Node, refNode: Node) => void = (x, newNode, refNode) => Node.prototype.insertBefore.call(x, newNode, refNode);

    static style: (x: HTMLElement) => CSSStyleDeclaration = getter(HTMLElement, 'style');
}

export class Sanitizer {
    tagAllowList: { [tag: string]: boolean; } = listToSet([
        // Special HTML Elements
        'html', 'body', 'head',
        // HTML Elements
        'a', 'abbr', 'acronym', 'address', 'area', 'b',
        'basefont', 'bdo', 'big', 'blockquote', 'br', 'caption', 'center',
        'cite', 'code', 'col', 'colgroup', 'dd', 'del', 'dfn', 'dir', 'div', 'dl',
        'dt', 'em', 'fieldset', 'font', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i',
        'ins', 'label', 'legend', 'li', 'map', 'menu', 'nobr', 'ol', 'p', 'pre', 'q',
        's', 'samp', 'small', 'span', 'strike', 'strong', 'sub', 'sup', 'table',
        'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'tt', 'u', 'ul', 'var', 'wbr', 'img',
        'video', 'source',
        // Form Elements
        'button', 'input', 'textarea', 'select', 'option', 'optgroup',
        // SVG
        'svg', 'altglyph', 'altglyphdef', 'altglyphitem', 'animate',
        'animatecolor', 'animatetransform', 'circle', 'clippath', 'defs', 'desc',
        'ellipse', 'font', 'g', 'glyph', 'glyphref', 'hkern', 'image', 'line',
        'lineargradient', 'marker', 'mask', 'mpath', 'path', 'pattern',
        'polygon', 'polyline', 'radialgradient', 'rect', 'set', 'stop', 'switch', 'symbol',
        'text', 'textpath', 'tref', 'tspan', 'use', 'view', 'vkern', 'filter',
        // SVG Filters
        'feblend', 'fecolormatrix', 'fecomponenttransfer', 'fecomposite',
        'feconvolvematrix', 'fediffuselighting', 'fedisplacementmap',
        'feflood', 'fefunca', 'fefuncb', 'fefuncg', 'fefuncr', 'fegaussianblur',
        'feimage', 'femerge', 'femergenode', 'femorphology', 'feoffset',
        'fespecularlighting', 'fetile', 'feturbulence',
        // MathML
        'math', 'menclose', 'merror', 'mfenced', 'mfrac', 'mglyph', 'mi', 'mlabeledtr',
        'mmuliscripts', 'mn', 'mo', 'mover', 'mpadded', 'mphantom', 'mroot', 'mrow',
        'ms', 'mspace', 'msqrt', 'mstyle', 'msub', 'msup', 'msubsup', 'mtable', 'mtd',
        'mtext', 'mtr', 'munder', 'munderover', 'maligngroup', 'malignmark',
        'mprescripts', 'semantics', 'annotation', 'annotation-xml', 'none',
        'infinity', 'matrix', 'matrixrow', 'ci', 'cn', 'sep', 'apply',
        'plus', 'minus', 'eq', 'power', 'times', 'divide', 'csymbol', 'root',
        'bvar', 'lowlimit', 'uplimit',
    ]);

    attributeAllowList: { [id: string]: boolean; } = listToSet([
        // The following attributes are specially dealt:
        'name', 'id', 'class', 'style',
        // HTML Elements
        'title', 'alt', 'width', 'height',
        'align', 'nowrap', 'col', 'row', 'rowspan', 'colspan', 'cellspacing',
        'cellpadding', 'valign', 'bgcolor', 'color', 'border', 'bordercolorlight',
        'bordercolordark', 'face', 'marginwidth', 'marginheight', 'axis', 'border',
        'abbr', 'char', 'charoff', 'clear', 'compact', 'coords', 'vspace', 'hspace',
        'cellborder', 'size', 'lang', 'dir', 'usemap', 'shape', 'media',
        'background', 'src', 'poster', 'href', 'rel',
        // Attributes of Form Elements
        'type', 'rows', 'cols', 'disabled', 'readonly', 'checked', 'multiple', 'value',
        // SVG
        'accent-height', 'accumulate', 'additive', 'alignment-baseline', 'alphabetic',
        'ascent', 'attributename', 'attributetype', 'azimuth', 'basefrequency', 'baseprofile',
        'baseline-shift', 'begin', 'bias', 'by', 'clip', 'clip-path', 'clip-rule',
        'color', 'color-interpolation', 'color-interpolation-filters', 'color-profile',
        'color-rendering', 'cx', 'cy', 'd', 'dx', 'dy', 'diffuseconstant', 'direction',
        'display', 'divisor', 'dur', 'edgemode', 'elevation', 'end', 'fill', 'fill-opacity',
        'fill-rule', 'filter', 'flood-color', 'flood-opacity', 'font-family', 'font-size',
        'font-size-adjust', 'font-stretch', 'font-style', 'font-variant', 'font-weight', 'from',
        'fx', 'fy', 'g1', 'g2', 'glyph-name', 'glyphref', 'gradientunits', 'gradienttransform',
        'image-rendering', 'in', 'in2', 'k', 'k1', 'k2', 'k3', 'k4', 'kerning', 'keypoints',
        'keysplines', 'keytimes', 'lengthadjust', 'letter-spacing', 'kernelmatrix',
        'kernelunitlength', 'lighting-color', 'local', 'marker-end', 'marker-mid',
        'marker-start', 'markerheight', 'markerunits', 'markerwidth', 'maskcontentunits',
        'maskunits', 'max', 'mask', 'mode', 'min', 'numoctaves', 'offset', 'operator',
        'opacity', 'order', 'orient', 'orientation', 'origin', 'overflow', 'paint-order',
        'path', 'pathlength', 'patterncontentunits', 'patterntransform', 'patternunits',
        'points', 'preservealpha', 'r', 'rx', 'ry', 'radius', 'refx', 'refy', 'repeatcount',
        'repeatdur', 'restart', 'rotate', 'scale', 'seed', 'shape-rendering', 'show', 'specularconstant',
        'specularexponent', 'spreadmethod', 'stddeviation', 'stitchtiles', 'stop-color',
        'stop-opacity', 'stroke-dasharray', 'stroke-dashoffset', 'stroke-linecap',
        'stroke-linejoin', 'stroke-miterlimit', 'stroke-opacity', 'stroke', 'stroke-width',
        'surfacescale', 'targetx', 'targety', 'transform', 'text-anchor', 'text-decoration',
        'text-rendering', 'textlength', 'to', 'u1', 'u2', 'unicode', 'values', 'viewbox',
        'visibility', 'vert-adv-y', 'version', 'vert-origin-x', 'vert-origin-y', 'word-spacing',
        'wrap', 'writing-mode', 'xchannelselector', 'ychannelselector', 'x', 'x1', 'x2',
        'xmlns', 'y', 'y1', 'y2', 'z', 'zoomandpan',
        // MathML
        'accent', 'accentunder', 'bevelled', 'close', 'columnalign', 'columnlines',
        'columnspan', 'denomalign', 'depth', 'display', 'displaystyle', 'encoding', 'fence',
        'frame', 'largeop', 'length', 'linethickness', 'lspace', 'lquote',
        'mathbackground', 'mathcolor', 'mathsize', 'mathvariant', 'maxsize',
        'minsize', 'movablelimits', 'notation', 'numalign', 'open', 'rowalign',
        'rowlines', 'rowspacing', 'rowspan', 'rspace', 'rquote', 'scriptlevel',
        'scriptminsize', 'scriptsizemultiplier', 'selection', 'separator',
        'separators', 'stretchy', 'subscriptshift', 'supscriptshift', 'symmetric', 'voffset',
        'fontsize', 'fontweight', 'fontstyle', 'fontfamily', 'groupalign', 'edge', 'side',
    ]);

    protocolAllowList = listToSet([
        'http', 'https', 'ftp', 'mailto'
    ]);

    nsPrefix = 'x_';

    constructor() {

    }

    sanitizeUrl(url: string) {
        if (url[0] === '#') {
            // Link to anchor, add prefix to make it working
            return `#${this.nsPrefix}${url.substring(1)}`;
        }

        if (url.startsWith('data:image/')) {
            // Data URL, only allow images
            return url;
        }

        let protocol = /^([0-9A-Za-z+.-]+):/.exec(url);
        if (!protocol) {
            return null;
        }

        if (protocol[1] in this.protocolAllowList) {
            return url;
        }

        return null;
    }

    sanitizeAttributes(element: Element) {
        let attributes: Attr[] = Array.prototype.slice.call(DOM.attributes(element));
        for (let attribute of attributes) {
            if (!(attribute.name in this.attributeAllowList)) {
                // Insert a comment for debugging
                let comment = document.createComment(`attribute ${attribute.name} ignored`);
                DOM.insertBefore(DOM.parentNode(element), comment, element);
                // Remove the unauthorized attribute
                DOM.removeAttribute(element, attribute.name);
                continue;
            }
            outer: switch (attribute.name) {
                case 'id':
                    // Special sanitizing rule for id
                    // To avoid namespace collision, we will prefix id with a given prefix
                    attribute.value = this.nsPrefix + attribute.value;
                    break;
                case 'name':
                    // Special sanitizing rule for name as well
                    // This avoids namespace collision, and prevents clobbering
                    attribute.value = this.nsPrefix + attribute.value;
                    break;
                case 'class':
                    // Special sanitizing rule for class as well
                    // This avoid namespace collision
                    attribute.value = attribute.value.split(' ').map(x => this.nsPrefix + x).join(' ');
                    break;
                case 'href':
                case 'target': {
                    // Get href and sanitize
                    let href = DOM.getAttribute(element, 'href');
                    let newhref = href && this.sanitizeUrl(href);

                    if (newhref !== null)
                        DOM.setAttribute(element, 'href', href);
                    else if (href !== null) {
                        // If sanitized, emit a debug message
                        let comment = document.createComment(`url ${href} ignored`);
                        DOM.insertBefore(DOM.parentNode(element), comment, element);
                        DOM.removeAttribute(element, 'href');
                    }
                    if (href && href[0] !== '#') {
                        DOM.setAttribute(element, 'target', '_blank');
                    } else {
                        DOM.removeAttribute(element, 'target');
                    }
                    break;
                }
                case 'src': {
                    let newsrc = this.sanitizeUrl(attribute.value);
                    if (newsrc === null) {
                        // If an image is sanitized, emit a message
                        let comment = document.createComment(`url ${attribute.value} ignored`);
                        DOM.insertBefore(DOM.parentNode(element), comment, element);
                        DOM.removeAttribute(element, 'href');
                    }
                    attribute.value = newsrc || '';
                    break;
                }
                case 'fill':
                case 'filter':
                case 'stroke':
                case 'marker-start':
                case 'marker-end':
                case 'marker-mid':
                case 'clip-path':
                case 'mask':
                case 'cursor': {
                    // TODO: Sanitize URL contained if any
                    if (attribute.value.match(/url/i)) {
                        let comment = document.createComment(`attribute ${attribute.name} unimplemented`);
                        DOM.insertBefore(DOM.parentNode(element), comment, element);
                        DOM.removeAttribute(element, attribute.name);
                    }
                    break;
                }
                case 'style': {
                    if (element instanceof HTMLElement) {
                        // Special sanitizing inline styles
                        let style = DOM.style(element);
                        let propToRemove = [];
                        for (let i = 0; i < style.length; i++) {
                            let name = style[i];
                            let value: string = (style as any)[name];

                            // position: fixed needs to be changed to position: absolute
                            // to avoid certain hijacking
                            if (name === 'position' && value.includes('fixed')) {
                                style[name] = 'absolute';
                                break outer;
                            }

                            if (value.includes('behavior') || value.includes('expression')) {
                                propToRemove.push(name);
                                break outer;
                            }

                            if (attribute.value.match(/url/i)) {
                                // TODO: Sanitize URL
                                propToRemove.push(name);
                            }
                        }
                        if (propToRemove.length) {
                            propToRemove.forEach(x => style.removeProperty(x));

                            // Generate debug messages
                            let comment = document.createComment(`style ${propToRemove.join(', ')} ignored`);
                            DOM.insertBefore(DOM.parentNode(element), comment, element);
                        }
                    } else {
                        // Insert a comment for debugging
                        let comment = document.createComment('attribute style ignored');
                        DOM.insertBefore(DOM.parentNode(element), comment, element);
                        // Remove the unauthorized attribute
                        DOM.removeAttribute(element, 'style');
                    }
                    break;
                }
            }
        }
    }

    sanitizeElement(element: Element) {
        let tagName = DOM.tagName(element).toLowerCase();
        if (!(tagName in this.tagAllowList)) {
            // Insert a comment for debugging
            let comment = document.createComment(`tag ${tagName} ignored`);
            DOM.insertBefore(DOM.parentNode(element), comment, element);
            // Remove the unauthorized element
            DOM.remove(element);
            return;
        }

        this.sanitizeAttributes(element);

        let children = Array.prototype.slice.call(DOM.children(element));
        for (let child of children) {
            this.sanitizeElement(child);
        }
    }

    sanitize(html: string) {
        let parser = new DOMParser();
        let document = parser.parseFromString(html, "text/html");

        // Be careful, before sanitizing we need to avoid clobbering
        this.sanitizeElement(DOM.documentElement(document));

        // Safe to do this now as we've removed clobbering (if any)
        return document.head.innerHTML + document.body.innerHTML;
    }

}

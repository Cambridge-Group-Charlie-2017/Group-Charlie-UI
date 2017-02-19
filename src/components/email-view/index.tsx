import * as React from 'react';
import * as moment from 'moment';

import { Icon } from '../icon';

import { Message, Content } from '../../services/api';
import { linkify } from '../../services/linkify';
import { Sanitizer } from '../../services/sanitize';
import './index.css';

interface EmailViewProps {
    item: Message;
}

interface EmailViewState {
    content: Content;
    parsedContent: string;
}

export class EmailView extends React.Component<EmailViewProps, EmailViewState> {
    mounted: boolean;

    constructor(props: EmailViewProps) {
        super(props);

        this.state = {
            content: null,
            parsedContent: null,
        };
    }

    componentDidMount() {
        this.mounted = true;
        this.componentWillReceiveProps(this.props);
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    componentWillReceiveProps(props: EmailViewProps) {
        this.setState({
            content: null,
            parsedContent: null
        });
        if (this.mounted) {
            props.item.getContent().then(content => {
                let html: string;
                if (content.type === 'text/html') {
                    let sanitizer = new class extends Sanitizer {
                        sanitizeUrl(url: string) {
                            url = super.sanitizeUrl(url);
                            if (!url) return url;

                            // This means image from attachment
                            // We transform the URL then
                            if (url.startsWith('cid:')) {
                                return props.item.getCidUrl(url.substring(4));
                            }
                            return url;
                        }
                    };
                    sanitizer.protocolAllowList['cid'] = true;

                    html = sanitizer.sanitize(content.content);
                } else {
                    html = linkify(content.content);
                }
                this.setState({
                    content: content,
                    parsedContent: html,
                });
            });
        }
    }

    private openAttachment(name: string) {
        this.props.item.openAttachment(name);
    }

    getTime() {
        var m = moment(this.props.item.date);
        return m.format('ddd DD/MM/YYYY HH:mm');
    }

    render() {
        let item = this.props.item;
        return <div className="EmailView top">
            <div className="EmailView header">
                <div className="EmailView from">{item.from.toString()}</div>
                <div className="EmailView time">{this.getTime()}</div>
                <div className="EmailView to">
                    <span className="EmailView to-caption">To: </span>
                    {item.to.join('; ')}
                </div>
                {item.cc.length ? <div className="EmailView to">
                    <span className="EmailView to-caption">Cc: </span>
                    {item.cc.join('; ')}
                </div> : null}
                {item.bcc.length ? <div className="EmailView to">
                    <span className="EmailView to-caption">Bcc: </span>
                    {item.bcc.join('; ')}
                </div> : null}
            </div>
            {this.state.content ? <div className="EmailView attContainer">{
                this.state.content.attachment.map(name => <div className="EmailView attachment" onClick={() => this.openAttachment(name)} key={name}><Icon name="file-o" />{name}</div>)}
            </div> : null}
            {this.state.content ? <div className={this.state.content.type === 'text/plain' ? 'EmailView plain' : ''} dangerouslySetInnerHTML={{ __html: this.state.parsedContent }}></div> : null}
        </div>;
    }
}

import * as React from 'react';
import * as moment from 'moment';

import { Message, Content } from '../../services/api';
import { linkify } from '../../services/linkify';
import { sanitize } from '../../services/sanitize';
import './index.css';

interface EmailViewProps {
    item: Message;
}

interface EmailViewState {
    content: string,
    type: string
}

export class EmailView extends React.Component<EmailViewProps, EmailViewState> {
    mounted: boolean;

    constructor(props: EmailViewProps) {
        super(props);

        this.state = {
            content: null,
            type: null
        };
    }

    componentDidMount() {
        this.mounted = true;

        this.props.item.getContent().then(content => {
            let html: string;
            if (content.type === 'text/html') {
                html = sanitize(content.content);
            } else {
                html = linkify(content.content);
            }
            this.setState({
                content: html,
                type: content.type
            });
        });
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    componentWillReceiveProps() {
        if (this.mounted)
            this.componentDidMount();
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
            <div className={this.state.type === 'text/plain' ? 'EmailView plain' : ''} dangerouslySetInnerHTML={{ __html: this.state.content }}></div>
        </div>;
    }
}

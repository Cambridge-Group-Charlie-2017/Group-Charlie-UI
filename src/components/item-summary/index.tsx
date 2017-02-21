import * as React from 'react';
import * as moment from 'moment';

import { Message } from '../../services/api';
import { Icon } from '../icon';
import './index.css';

interface ItemSummaryProps {
    item: Message;
    selected?: boolean;
}

export class ItemSummary extends React.Component<ItemSummaryProps, {}> {
    getTime() {
        var m = moment(this.props.item.date);
        var now = moment(Date.now());
        if (m.isSame(now, 'day')) {
            return m.format('HH:mm');
        }
        if (m.isSame(now, 'year')) {
            return m.format('DD MMM');
        }
        return m.format('DD/MM/YYYY');
    }

    render() {
        let item = this.props.item;
        return <div className={`ItemSummary top${item.unread ? ' unread' : ''}${this.props.selected ? ' selected' : ''}`}>
            <div className="ItemSummary headline">
                <div className="ItemSummary contact">{item.from.name || item.from.address || '(no sender)'}</div>
                <div className="ItemSummary status">
                    {item.hasAttachment ? <Icon name="paperclip"/> : null}
                    {item.flagged ? <Icon name="flag"/> : null}
                </div>
            </div>
            <div className="ItemSummary title-line">
                <span className="ItemSummary title">{item.subject || '(no subject)'}</span>
                <span className="ItemSummary time">{this.getTime()}</span>
            </div>
            <div className="ItemSummary summary">{item.summary}</div>
        </div>;
    }
}

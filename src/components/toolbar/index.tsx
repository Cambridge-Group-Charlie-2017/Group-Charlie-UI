import './index.css';

import * as React from 'react';
import { Icon } from '../icon';

interface ToolbarButtonProps {
    text: string;
    icon?: string;
    onClick?: () => void;
}

export class ToolbarButton extends React.Component<ToolbarButtonProps, {}> {
    render() {
        return <button onClick={this.props.onClick} className="Toolbar Button button">
            <Icon name={this.props.icon} className="Toolbar Button icon" />
            {this.props.text}
        </button>
    }
}

interface ToolbarProps {

};

export class Toolbar extends React.Component<ToolbarProps, {}> {
    render() {
        return <div className="Toolbar toolbar">{this.props.children}</div>
    }
}

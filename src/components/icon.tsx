import * as React from 'react';

export interface IconProps {
    name: string;
    className?: string;
}

export class Icon extends React.Component<IconProps, {}> {
    render() {
        return <i className={`fa fa-${this.props.name} ${this.props.className || ''}`}></i>;
    }
}
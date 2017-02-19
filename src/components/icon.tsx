import * as React from 'react';

export interface IconProps extends React.HTMLAttributes<HTMLElement> {
    name: string;
    className?: string;
}

export class Icon extends React.Component<IconProps, {}> {
    render() {
        return <i {...this.props} className={`fa fa-${this.props.name} ${this.props.className || ''}`}></i>;
    }
}

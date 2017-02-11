import './index.css';

import * as React from 'react';
import { Icon } from '../icon';

export interface NavigationListItem {
    text: string | JSX.Element;
    icon?: string;
    children?: NavigationListItem[];
    collapsible?: boolean;
    noindent?: boolean;
    [others: string]: any;
}

interface NavigationProps {
    list: NavigationListItem[];
    bottomList?: NavigationListItem[];
    selected?: NavigationListItem;
    expandByDefault?: boolean;
    onSelect?: (selected: NavigationListItem) => void;
};

interface NavigationState {
    expansionMap: Map<NavigationListItem, boolean>;
}

export class Navigation extends React.Component<NavigationProps, NavigationState> {
    constructor(props: NavigationProps) {
        super(props);

        this.state = {
            expansionMap: this.computeExpansionMap(props)
        };
    }

    private buildMap<T>(map: Map<NavigationListItem, T>, def: T, items: NavigationListItem[]) {
        for (let item of items) {
            if (item.children) {
                if (item.collapsible !== false)
                    map.set(item, def);
                this.buildMap(map, def, item.children);
            }
        }
    }

    private computeExpansionMap(nextProps: NavigationProps) {
        // Create a new map
        let map = new Map<NavigationListItem, boolean>();
        this.buildMap(map, nextProps.expandByDefault !== false, nextProps.list);

        // Array.from is a workaround of TypeScript
        // incapibility to iterate iterable in ES5 mode
        if (this.state) {
            for (let [key, value] of Array.from(this.state.expansionMap.entries())) {
                if (map.has(key)) {
                    map.set(key, value);
                }
            }
        }

        return map;
    }

    componentWillReceiveProps(nextProps: NavigationProps) {
        this.setState({
            expansionMap: this.computeExpansionMap(nextProps)
        });
    }

    private onCollapseClick(event: React.MouseEvent<HTMLSpanElement>, item: NavigationListItem) {
        event.stopPropagation();

        this.state.expansionMap.set(item, !this.state.expansionMap.get(item));
        this.setState({
            expansionMap: this.state.expansionMap
        });
    }

    private onItemClick(item: NavigationListItem) {
        if (this.props.onSelect) {
            this.props.onSelect(item);
        }
    }

    private buildTree(item: NavigationListItem, indent: number, depth: number, path: string) {
        // Check if it is collapsible
        let collapsible = item.children ? item.collapsible !== false : false;
        let collapsed = collapsible && this.state.expansionMap.get(item) === false;

        // Determine the icon to use
        let icon = item.icon || (collapsible ? (collapsed ? 'caret-down' : 'caret-right') : '');

        // Build the icon component
        let iconComp = icon ? <Icon name={icon} className="Navigation icon"></Icon> : <span className="Navigation icon" />;

        // Wrap a span and add event listener if collapsible
        if (collapsible) {
            iconComp = <span className="Navigation collapse" onClick={e => this.onCollapseClick(e, item)}>{iconComp}</span>;
        }

        // Build the main component
        let comp = <div key={path} onClick={e => this.onItemClick(item)} className={`Navigation item${depth === 0 ? '' : ' subitem'}${this.props.selected === item ? ' selected' : ''}`} style={{
            paddingLeft: `${indent + 1}rem`
        }}>{iconComp}{item.text}</div>;

        // Build the subtree if there are children
        if (item.children) {
            let items: JSX.Element[] = [];

            item.children.forEach((subitem, i) => {
                items.push(...this.buildTree(
                    subitem,
                    item.noindent ? indent : indent + 1,
                    depth + 1,
                    `${path}/${i}`));
            });

            let subitems = <div key={`${path}/`} className={
                collapsed ? 'Navigation hidden' : null
            }>{items}</div>
            return [comp, subitems];
        }

        return [comp];
    }

    render() {
        let items: JSX.Element[] = [];
        this.props.list.forEach((item, i) => {
            items.push(...this.buildTree(item, 0, 0, `${i}`));
        });

        let bottomItems: JSX.Element[] = [];
        if (this.props.bottomList) {
            this.props.bottomList.forEach((item, i) => {
                bottomItems.push(...this.buildTree(item, 0, 0, `b${i}`));
            });
        }
        return <div className="Navigation panel">
            <div>{items}</div>
            {bottomItems.length ? <div className="Navigation bottom">{bottomItems}</div> : null}
        </div>;
    }
}

import * as React from 'react';

import './index.css';

interface LazyListProps {
    length: number;
    itemHeight: number;
    fastload?: (start: number, end: number) => any[];
    load: (start: number, end: number) => Promise<any[]>;
    render: (value: any, id: number) => JSX.Element;
    prefetchWindow?: [number, number];
    onSelect?: (value:any, id: number) => void;
};

interface LazyListState {
    start: number,
    end: number,
    items: any[]
}

export class LazyList extends React.Component<LazyListProps, LazyListState> {
    timeout: number = 0;
    mounted: boolean = false;

    constructor(props: LazyListProps) {
        super(props);

        this.state = {
            start: 0,
            end: 0,
            items: []
        };
    }

    componentDidMount() {
        this.mounted = true;
        this.reloadViewport(this.props);
    }

    componentWillUnmount() {
        this.mounted = false;
        clearTimeout(this.timeout);
    }

    private reloadViewport(props: LazyListProps) {
        let el = this.refs['scrollable'] as HTMLDivElement;
        this.slowAdjustViewport(0, Math.floor(el.clientHeight / this.props.itemHeight) + 1, props);
        console.info('[LazyList] Reloading viewport');
    }

    componentWillReceiveProps(props: LazyListProps) {
        if (this.mounted) {
            if (this.props.length === props.length) return;
            this.reloadViewport(props);
        }
    }

    private slowAdjustViewport(start: number, end: number, props: LazyListProps = this.props) {
        let [w1, w2] = props.prefetchWindow || [20, 20];
        let startPrefetch = Math.max(start - w1, 0);
        let endPrefetch = Math.min(end + w2, props.length);

        props.load(startPrefetch, endPrefetch).then(value => {
            let views = value.map((value, i) => {
                return props.render(value, i + startPrefetch);
            });
            this.setState({
                start: startPrefetch,
                end: endPrefetch,
                items: value
            });
        });
    }

    private fastAdjustViewport(start: number, end: number) {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = 0;
        }

        start = Math.max(start, 0);
        end = Math.min(end, this.props.length);

        // If current prefetch window does not fit
        if (start < this.state.start || end > this.state.end) {
            // If possible, call fastload and present result immediately
            if (this.props.fastload) {
                // Don't do prefetching here. Only load visible data
                let items = this.props.fastload(start, end);
                if (items) {
                    let views = items.map((value, i) => {
                        return this.props.render(value, i + start);
                    });
                    this.setState({
                        start: start,
                        end: end,
                        items: items
                    });
                }
            }
        }

        let [w1, w2] = this.props.prefetchWindow || [20, 20];
        let startPrefetch2 = Math.max(start - (w1 >>> 1), 0);
        let endPrefetch2 = Math.min(end + (w2 >>> 1), this.props.length);

        // If we still have plenty prefetched entry to use,
        // don't start prefetching immediately
        if (startPrefetch2 >= this.state.start && endPrefetch2 <= this.state.end) {
            return;
        }

        // Regardless fastload result, still can slow load after a timeout
        // So prefetch can be handled
        this.timeout = setTimeout(() => {
            this.slowAdjustViewport(start, end);
        }, 200);
    }

    private onScroll(event: React.UIEvent<HTMLDivElement>) {
        let el = event.currentTarget;

        let viewportStart = el.scrollTop;
        let viewPortEnd = viewportStart + el.clientHeight;

        let viewStart = Math.floor(viewportStart / this.props.itemHeight);
        let viewEnd = Math.floor(viewPortEnd / this.props.itemHeight) + 1;

        this.fastAdjustViewport(viewStart, viewEnd);
    }

    private onClick(value:any, id: number) {
        if (this.props.onSelect) {
            this.props.onSelect(value, id);
        }
    }

    render() {
        let items = this.state.items.map((item, i) => {
            let id = i + this.state.start;
            return <div className="LazyList wrapper" key={id} onClick={() => this.onClick(item, id)} style={{
                top: (id * this.props.itemHeight) + 'px',
                height: this.props.itemHeight + 'px'
            }}>{this.props.render(item, id)}</div>;
        });
        return <div ref="scrollable" className="LazyList panel" onScroll={e => this.onScroll(e)}>
            <div className="LazyList container" style={{
                height: (this.props.length * this.props.itemHeight) + 'px'
            }}>
                {items}
            </div>
        </div>;
    }
}

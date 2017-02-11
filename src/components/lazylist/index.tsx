import * as React from 'react';

import './index.css';

interface LazyListProps {
    length: number;
    itemHeight: number;
    fastload?: (start: number, end: number) => JSX.Element[];
    load: (start: number, end: number) => Promise<JSX.Element[]>;
    prefetchWindow?: [number, number];
};

interface LazyListState {
    start: number,
    end: number,
    items: JSX.Element[]
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
        let el = this.refs['scrollable'] as HTMLDivElement;
        this.slowAdjustViewport(0, Math.min(this.props.length, Math.floor(el.clientHeight / this.props.itemHeight) + 1));
    }

    componentWillUnmount() {
        this.mounted = false;
        clearTimeout(this.timeout);
    }

    componentWillReceiveProps() {
        if (this.mounted)
            this.componentDidMount();
    }

    private slowAdjustViewport(start: number, end: number) {
        let [w1, w2] = this.props.prefetchWindow || [20, 20];
        let startPrefetch = Math.max(start - w1, 0);
        let endPrefetch = Math.min(end + w2, this.props.length);

        this.props.load(startPrefetch, endPrefetch).then(value => {
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

        // If current prefetch window does not fit
        if (start < this.state.start || end > this.state.end) {
            // If possible, call fastload and present result immediately
            if (this.props.fastload) {
                // Don't do prefetching here. Only load visible data
                let items = this.props.fastload(start, end);
                if (items) {
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

    render() {
        let items = this.state.items.map((item, i) => {
            let id = i + this.state.start;
            return <div className="LazyList wrapper" key={id} style={{
                top: (id * this.props.itemHeight) + 'px',
                height: this.props.itemHeight + 'px'
            }}>{item}</div>;
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

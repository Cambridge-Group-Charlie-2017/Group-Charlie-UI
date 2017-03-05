import * as React from 'react';
import './index.css';

import { Message, RemoteMessage, get } from '../../services/api';

interface DataPointProps {
    color: string;
    text: string;
    position: [number, number];
}

class DataPoint extends React.Component<DataPointProps, {}> {
    render() {
        return <div className="Clusterer point" style={{
            left: `${this.props.position[0] * 100}%`,
            bottom: `${this.props.position[1] * 100}%`,
            background: this.props.color
        }}>
            <div className="tooltip"><div className="tooltipBody">{this.props.text}</div></div>
        </div>;
    }
}

class Data {
    subject: string;
    x: number;
    y: number;
    cluster: string;
}

interface ClustererProps {
    className?: string;
}

interface ClustererState {
    move: boolean;
    focus: [number, number];
    data: Data[];
    scale: number;
    legend: { [name: string]: number };
    highlightCluster: string;
}

export class ClustererStatus extends React.Component<ClustererProps, ClustererState> {
    constructor(props: ClustererProps) {
        super(props);

        get('status/clusterer').then(json => {
            let array = json as Data[];
            let map: { [name: string]: number } = {};
            let id = 0;

            array.forEach(item => {
                if (!(item.cluster in map)) {
                    map[item.cluster] = id++;
                }
            });

            let scale = this.calcScale(array);

            this.setState({ data: array, legend: map, scale: scale });
        });

        this.state = {
            move: false,
            focus: null,
            data: null,
            legend: null,
            scale: 1,
            highlightCluster: null
        };
    }

    private calcScale(data: Data[]) {
        let max = 0;
        for (let d of data) {
            max = Math.max(max, Math.abs(d.x), Math.abs(d.y));
        }
        if (max === 0) return 1;
        return 0.5 / max;
    }

    handleMove(e: React.MouseEvent<HTMLDivElement>) {
        if (!this.state.move) return;
        let bound = e.currentTarget.getBoundingClientRect();
        let x = (e.clientX - bound.left) / bound.width;
        let y = (bound.bottom - e.clientY) / bound.height;
        this.setState({
            focus: [
                Math.max(Math.min(x, 1), 0),
                Math.max(Math.min(y, 1), 0)
            ]
        });
    }

    onClick(e: React.MouseEvent<HTMLDivElement>) {
        // Temporary disable unfinished feature
        if (1 === 1) return;
        this.setState({
            move: !this.state.move
        });
        this.handleMove(e);
    }

    onMove(e: React.MouseEvent<HTMLDivElement>) {
        if (!this.state.move) return;
        this.handleMove(e);
    }

    getColor(cluster: string) {
        // TODO: need more color
        return ['red', 'yellow', 'blue', 'green', 'orange', 'purple', 'cyan', 'pink'][this.state.legend[cluster] % 8];
    }

    toggleCluster(item: string) {
        this.setState({
            highlightCluster: item == this.state.highlightCluster ? null : item
        });
    }

    render() {
        let datapoints = null;
        let legendToggles = null;

        if (this.state.data) {
            datapoints = this.state.data.filter(item =>
                !this.state.highlightCluster || item.cluster === this.state.highlightCluster
            ).map((item, i) =>
                <DataPoint color={
                    this.getColor(item.cluster)
                } position={
                    [item.x * this.state.scale + 0.5, item.y * this.state.scale + 0.5]
                } text={
                    `Subject: ${item.subject}\nCluster: ${item.cluster}\nVector: ${item.x}, ${item.y}`
                } key={i} />
                );

            legendToggles = Object.keys(this.state.legend).map(item =>
                <button onClick={() => this.toggleCluster(item)} className={`Clusterer toggle${this.state.highlightCluster === item ? ' selected' : ''}`} key={item}>
                    <span className="Clusterer legend" style={{ backgroundColor: this.getColor(item) }}></span>
                    {item}
                </button>
            );
        }

        return <div className={this.props.className}>
            <div className="Clusterer graph" onMouseDown={e => this.onClick(e)} onMouseMove={e => this.onMove(e)}>
                <div className="Clusterer interactiveWrapper">
                    {this.state.focus !== null && <div className="Clusterer focus" style={{
                        left: this.state.focus[0] * 100 + '%',
                        bottom: this.state.focus[1] * 100 + '%'
                    }} />}
                </div>
                {datapoints}
            </div>
            {legendToggles}
        </div>;
    }

}
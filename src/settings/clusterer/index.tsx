import * as React from 'react';
import './index.css';

import { Icon } from '../../components/icon';
import * as api from '../../services/api';

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
    data: Data[];
    scale: number;
    legend: { [name: string]: number };
    highlightCluster: string;
    reclustering: boolean;
}

function shuffle<T>(array: T[]) {
    for (let i = array.length; i; i--) {
        let j = Math.floor(Math.random() * i);
        [array[i - 1], array[j]] = [array[j], array[i - 1]];
    }
}

export class ClustererStatus extends React.Component<ClustererProps, ClustererState> {
    constructor(props: ClustererProps) {
        super(props);

        this.loadData();

        this.state = {
            data: null,
            legend: null,
            scale: 1,
            highlightCluster: null,
            reclustering: false
        };
    }

    private loadData() {
        api.get('status/clusterer').then(json => {
            let array = json as Data[];
            let map: { [name: string]: number } = {};
            let id = 0;

            array.forEach(item => {
                if (!(item.cluster in map)) {
                    map[item.cluster] = id++;
                }
            });

            // Without shuffling, one cluster's dot will always be on top of another
            shuffle(array);

            let scale = this.calcScale(array);

            this.setState({ data: array, legend: map, scale: scale });
        });
    }

    private calcScale(data: Data[]) {
        let max = 0;
        for (let d of data) {
            max = Math.max(max, Math.abs(d.x), Math.abs(d.y));
        }
        if (max === 0) return 1;
        return 0.5 / max;
    }

    private getColor(cluster: string) {
        return [
            'red',
            'yellow',
            'blue',
            'green',
            'orange',
            'purple',
            'aqua',
            'pink',
            'maroon',
            'navy',
            'fuchsia',
            'olive',
            'teal',
            'lime',
            'chocolate',
            'gold',
            'violet'
        ][this.state.legend[cluster]] || 'black';
    }

    private toggleCluster(item: string) {
        this.setState({
            highlightCluster: item == this.state.highlightCluster ? null : item
        });
    }

    private recluster() {
        let confirmation = confirm('Do you really want to recluster all messages? The operation is slow and it will move your messages.');
        if (confirmation) {
            this.setState({
                reclustering: true
            });
            api.post('settings/recluster').then(() => {
                this.setState({
                    reclustering: false
                });
                this.loadData();
            });
        }
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

        let button;
        if (this.state.reclustering) {
            button = <button className="Button Clusterer recluster" disabled={true}>
                <Icon name="spinner" className="fa-spin" /> Reclustering
            </button>
        } else {
            button = <button className="Button Clusterer recluster" onClick={() => this.recluster()}>Recluster</button>
        }

        return <div className={this.props.className}>
            {button}
            <div className="Clusterer graph">
                {datapoints}
            </div>
            {legendToggles}
        </div>;
    }

}
import * as React from 'react';

import * as api from '../../services/api';
import { Icon } from '../../components/icon';

interface FileWalkerProps {
    className?: string;
}

interface FileWalkerState {
    folders: string[];
    foldersChanged: string[];
}

export class FileWalkerSettings extends React.Component<FileWalkerProps, FileWalkerState> {
    constructor(props: FileWalkerProps) {
        super(props);

        this.loadData();

        this.state = {
            folders: null,
            foldersChanged: null
        };
    }

    private async loadData() {
        let json = await api.get('settings/config/filewalker.root');
        let folders = json === null ? [] : JSON.parse(json) as string[];

        this.setState({
            folders: folders,
            foldersChanged: folders.slice()
        });
    }

    private isDirty() {
        if (this.state.folders.length !== this.state.foldersChanged.length) {
            return true;
        }
        return this.state.folders.find((v, i) => this.state.foldersChanged[i] !== v) !== undefined;
    }

    private addNew() {
        api.get('native/select_folder').then(path => {
            if (path) {
                let fc = this.state.foldersChanged;
                if (fc.indexOf(path) === -1) fc.push(path);
                this.setState({
                    foldersChanged: fc
                });
            }
        });
    }

    private remove(path: string) {
        let fc = this.state.foldersChanged;
        let id = fc.indexOf(path);
        fc.splice(id, 1);
        this.setState({
            foldersChanged: fc
        });
    }

    private async apply() {
        let newConfig = JSON.stringify(this.state.foldersChanged);
        await api.put('settings/config', undefined, {
            'filewalker.root': newConfig
        });
        await this.loadData();
    }

    render() {
        if (this.state.folders === null) {
            return <div className={this.props.className}></div>;
        }
        return <div className={`FileWalkerSettings ${this.props.className ? ' ' + this.props.className : ''}`} >
            {
                this.state.foldersChanged.map((item, i) =>
                    <div className="FileWalker entry" key={i}><div className="text">{item}</div><Icon name="times" className="remove" onClick={() => this.remove(item)} /></div>
                )
            }
            <div className="FileWalker new" onClick={() => this.addNew()}><Icon name="plus" />New</div>
            <button className="Button" disabled={!this.isDirty()} onClick={() => this.apply()}>Apply</button>
        </div>;
    }

}

import '../account/index.css';
import './index.css';
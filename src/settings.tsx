import * as React from 'react';

import { Navigation, NavigationListItem } from './components/navigation';
import { AccountSettings } from './settings/account';
import { FileWalkerSettings } from './settings/filewalker';
import { ClustererStatus } from './settings/clusterer';

interface SettingsProps {
    onBack: () => void;
}

interface SettingsState {
    selectedNav: NavigationListItem;
}

export class Settings extends React.Component<SettingsProps, SettingsState> {
    navigation: NavigationListItem[] = [{
        text: '',
        icon: 'bars'
    }, {
        text: 'Back',
        icon: 'chevron-left'
    }, {
        text: 'Account',
        icon: 'user-circle-o'
    }, {
        text: 'Document Scanner',
        icon: 'file-text-o'
    }, {
        text: 'System Status',
        icon: 'desktop',
        collapsible: false,
        noindent: true,
        children: [{
            text: 'Clusterer'
        }]
    }];

    constructor(props: SettingsProps) {
        super(props);

        this.state = {
            selectedNav: this.navigation[2]
        };
    }

    onNavigation(item: NavigationListItem) {
        if (item.text === 'Back') {
            this.props.onBack();
            return;
        }
        if (item.text === '' || item.text === 'System Status') {
            return;
        }
        this.setState({
            selectedNav: item
        });
    }

    render() {
        let mainframe;
        switch (this.state.selectedNav.text) {
            case 'Account':
                mainframe = <AccountSettings className="Settings mainframe" />;
                break;
            case 'Document Scanner':
                mainframe = <FileWalkerSettings className="Settings mainframe" />;
                break;
            case 'Clusterer':
                mainframe = <ClustererStatus className="Settings mainframe" />;
                break;
        }
        return <div id="Settings">
            <Navigation className="Settings navigation" list={this.navigation} onSelect={e => this.onNavigation(e)} selected={this.state.selectedNav} />
            {mainframe}
        </div>;
    }
}

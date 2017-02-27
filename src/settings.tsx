import * as React from 'react';

import { Navigation, NavigationListItem } from './components/navigation';
import { AccountSettings } from './settings/account';

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
        return <div id="Settings">
            <Navigation className="Settings navigation" list={this.navigation} onSelect={e=>this.onNavigation(e)} selected={this.state.selectedNav} />
            <AccountSettings className="Settings mainframe" />
        </div>;
    }
}
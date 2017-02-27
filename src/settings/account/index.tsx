import * as React from 'react';
import './index.css';

import { Message, RemoteMessage, get } from '../../services/api';

interface AccountSettingsProps {
    className?: string;
}

interface AccountSettingsState {
    address: string;
    addressChanged: string;

    name: string;
    nameChanged: string;

    imapHost: string;
    imapHostChanged: string;
    imapUsername: string;
    imapUsernameChanged: string;
    imapPassword: boolean;
    imapPasswordChanged: string;

    smtpHost: string;
    smtpHostChanged: string;
    smtpUsername: string;
    smtpUsernameChanged: string;
    smtpPassword: boolean;
    smtpPasswordChanged: string;
}

interface InputBoxProps {
    label: string;
    value: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;

    type?: string;
    placeholder?: string;
}

class InputBox extends React.Component<InputBoxProps, {}> {
    render() {
        return <label className="Input wrapper">
            <span className="Input label">{this.props.label}</span>
            <input className="Input input" type={this.props.type} placeholder={this.props.placeholder} value={this.props.value} onChange={this.props.onChange} />
        </label>;
    }
}

export class AccountSettings extends React.Component<AccountSettingsProps, AccountSettingsState> {
    constructor(props: AccountSettingsProps) {
        super(props);

        this.loadData();

        this.state = {
            address: null,
            addressChanged: null,

            name: null,
            nameChanged: null,

            imapHost: null,
            imapHostChanged: null,
            imapUsername: null,
            imapUsernameChanged: null,
            imapPassword: null,
            imapPasswordChanged: null,

            smtpHost: null,
            smtpHostChanged: null,
            smtpUsername: null,
            smtpUsernameChanged: null,
            smtpPassword: null,
            smtpPasswordChanged: null
        };
    }

    private async loadData() {
        let address = await get('settings/config/mail.address');
        let name = await get('settings/config/mail.name');

        let imapHost = await get('settings/config/mail.imap.host');
        let imapUsername = await get('settings/config/mail.imap.username');
        let imapPassword = await get('settings/config/mail.imap.password') !== null;

        let smtpHost = await get('settings/config/mail.smtp.host');
        let smtpUsername = await get('settings/config/mail.smtp.username');
        let smtpPassword = await get('settings/config/mail.smtp.password') !== null;

        this.setState({
            address: address,
            addressChanged: address || '',

            name: name,
            nameChanged: name || '',

            imapHost: imapHost,
            imapHostChanged: imapHost || '',
            imapUsername: imapUsername,
            imapUsernameChanged: imapUsername || '',
            imapPassword: imapPassword,
            imapPasswordChanged: '',

            smtpHost: smtpHost,
            smtpHostChanged: smtpHost || '',
            smtpUsername: smtpUsername,
            smtpUsernameChanged: smtpUsername || '',
            smtpPassword: smtpPassword,
            smtpPasswordChanged: '',
        });
    }

    render() {
        if (this.state.imapHost === null) {
            return <div className={this.props.className}></div>;
        }
        return <div className={`AccountSettings ${this.props.className ? ' ' + this.props.className : ''}`} >
            <InputBox label="Address" value={this.state.addressChanged} onChange={(event) => this.setState({ addressChanged: event.target.value })} />
            <InputBox label="Name" value={this.state.nameChanged} onChange={(event) => this.setState({ nameChanged: event.target.value })} />
            <fieldset className="Fieldset">
                <legend className="Legend">IMAP</legend>
                <InputBox label="Host" value={this.state.imapHostChanged} onChange={(event) => this.setState({ imapHostChanged: event.target.value })} />
                <InputBox label="Username" value={this.state.imapUsername} onChange={(event) => this.setState({ imapUsernameChanged: event.target.value })} />
                <InputBox label="Password" type="password" placeholder="(password)" value={this.state.imapPasswordChanged} onChange={(event) => this.setState({ imapPasswordChanged: event.target.value })} />
            </fieldset>
            <fieldset className="Fieldset">
                <legend className="Legend">SMTP</legend>
                <InputBox label="Host" value={this.state.smtpHostChanged} onChange={(event) => this.setState({ smtpHostChanged: event.target.value })} />
                <InputBox label="Username" value={this.state.smtpUsername} onChange={(event) => this.setState({ smtpUsernameChanged: event.target.value })} />
                <InputBox label="Password" type="password" placeholder="(password)" value={this.state.smtpPasswordChanged} onChange={(event) => this.setState({ smtpPasswordChanged: event.target.value })} />
            </fieldset>
        </div>;
    }

}
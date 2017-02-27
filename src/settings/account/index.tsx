import * as React from 'react';
import './index.css';

import { Message, RemoteMessage } from '../../services/api';
import * as api from '../../services/api';

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

interface InputBoxProps extends React.ChangeTargetHTMLProps<HTMLInputElement> {
    label: string;
}

interface InputBoxState {
    focus: boolean;
}

class InputBox extends React.Component<InputBoxProps, InputBoxState> {

    constructor(prop: InputBoxProps) {
        super(prop);

        this.state = {
            focus: false
        };
    }

    render() {
        let props = Object.assign({}, this.props);
        delete props['label'];

        return <label className={`Input wrapper${this.state.focus ? ' focus' : ''}`}>
            <span className="Input label">{this.props.label}</span>
            <input className="Input input" {...props}
                onFocus={() => this.setState({ focus: true })}
                onBlur={() => this.setState({ focus: false })} />
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
        let address = await api.get('settings/config/mail.address');
        let name = await api.get('settings/config/mail.name');

        let imapHost = await api.get('settings/config/mail.imap.host');
        let imapUsername = await api.get('settings/config/mail.imap.username');
        let imapPassword = await api.get('settings/config/mail.imap.password') !== null;

        let smtpHost = await api.get('settings/config/mail.smtp.host');
        let smtpUsername = await api.get('settings/config/mail.smtp.username');
        let smtpPassword = await api.get('settings/config/mail.smtp.password') !== null;

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

    private isDirty() {
        let keys = ['address', 'name', 'imapHost', 'imapUsername', 'smtpHost', 'smtpUsername'];
        let state = this.state as any;
        for (let key of keys) {
            if (state[key + 'Changed'] && state[key] !== state[key + 'Changed']) {
                return true;
            }
        }
        if (state.imapPasswordChanged) return true;
        if (state.smtpPasswordChanged) return true;
        return false;
    }

    private async apply() {
        let map: { [name: string]: string } = {};

        if (this.state.addressChanged && this.state.address !== this.state.addressChanged) {
            map['mail.address'] = this.state.addressChanged;
        }
        if (this.state.nameChanged && this.state.name !== this.state.nameChanged) {
            map['mail.name'] = this.state.nameChanged;
        }

        if (this.state.imapHostChanged && this.state.imapHost !== this.state.imapHostChanged) {
            map['mail.imap.host'] = this.state.imapHostChanged;
        }
        if (this.state.imapUsernameChanged && this.state.imapUsername !== this.state.imapUsernameChanged) {
            map['mail.imap.username'] = this.state.imapUsernameChanged;
        }
        if (this.state.imapPasswordChanged) {
            map['mail.imap.password'] = this.state.imapPasswordChanged;
        }

        if (this.state.smtpHostChanged && this.state.smtpHost !== this.state.smtpHostChanged) {
            map['mail.smtp.host'] = this.state.smtpHostChanged;
        }
        if (this.state.smtpUsernameChanged && this.state.smtpUsername !== this.state.smtpUsernameChanged) {
            map['mail.smtp.username'] = this.state.smtpUsernameChanged;
        }
        if (this.state.smtpPasswordChanged) {
            map['mail.smtp.password'] = this.state.smtpPasswordChanged;
        }

        await api.put('settings/config', undefined, map);
        await this.loadData();
        await api.post('settings/changeAccount');
    }

    render() {
        if (this.state.imapHostChanged === null) {
            return <div className={this.props.className}></div>;
        }
        return <div className={`AccountSettings ${this.props.className ? ' ' + this.props.className : ''}`} >
            <InputBox
                label="Address"
                type="email"
                value={this.state.addressChanged}
                onChange={(event) => this.setState({ addressChanged: event.target.value })} />
            <InputBox
                label="Name"
                value={this.state.nameChanged}
                onChange={(event) => this.setState({ nameChanged: event.target.value })} />
            <fieldset className="Fieldset">
                <legend className="Legend">IMAP</legend>
                <InputBox
                    label="Host"
                    type="url"
                    value={this.state.imapHostChanged}
                    onChange={(event) => this.setState({ imapHostChanged: event.target.value })} />
                <InputBox
                    label="Username"
                    spellCheck={false}
                    value={this.state.imapUsernameChanged}
                    onChange={(event) => this.setState({ imapUsernameChanged: event.target.value })} />
                <InputBox
                    label="Password"
                    type="password"
                    placeholder="(password)"
                    value={this.state.imapPasswordChanged}
                    onChange={(event) => this.setState({ imapPasswordChanged: event.target.value })} />
            </fieldset>
            <fieldset className="Fieldset">
                <legend className="Legend">SMTP</legend>
                <InputBox
                    label="Host"
                    type="url"
                    value={this.state.smtpHostChanged}
                    onChange={(event) => this.setState({ smtpHostChanged: event.target.value })} />
                <InputBox
                    label="Username"
                    spellCheck={false}
                    value={this.state.smtpUsernameChanged}
                    onChange={(event) => this.setState({ smtpUsernameChanged: event.target.value })} />
                <InputBox
                    label="Password"
                    type="password"
                    placeholder="(password)"
                    value={this.state.smtpPasswordChanged}
                    onChange={(event) => this.setState({ smtpPasswordChanged: event.target.value })} />
            </fieldset>
            <button className="Button" disabled={!this.isDirty()} onClick={() => this.apply()}>Apply</button>
        </div>;
    }

}
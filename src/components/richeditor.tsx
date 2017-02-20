import * as React from 'react';

import 'tinymce';

interface RichEditorProps {
    content?: string;
    onChange?: (editor: RichEditor) => void;
}

interface RichEditorStates {
    content: string;
}

export class RichEditor extends React.Component<RichEditorProps, RichEditorStates> {

    private editor: tinymce.Editor;

    constructor(props: RichEditorProps) {
        super(props);

        this.state = {
            content: ''
        };
    }

    shouldComponentUpdate() {
        // Never allow re-rendering of this component
        // Otherwise TinyMCE will be broken
        // Logic for handling changing content is in componentWillReceiveProps
        return false;
    }

    componentWillReceiveProps(props: RichEditorProps) {
        let content = props.content || '';
        if (this.state.content !== content) {
            if (this.editor) {
                console.info('[RichEditor] Reloading content');
                this.editor.setContent(content);
                this.editor.undoManager.clear();
                this.setState({
                    content: content
                });
            }
        }
    }

    getContent() {
        return this.state.content;
    }

    private handleChange() {
        this.setState({
            content: this.editor.getContent()
        });

        if (this.props.onChange) {
            this.props.onChange(this);
        }
    }

    private setup() {
        console.info('[RichEditor] Setting up');
        let textarea = this.refs['editor'] as HTMLDivElement;
        tinymce.init({
            target: textarea,
            height: 200,
            menubar: false,
            plugins: [
                'advlist anchor autolink code colorpicker',
                'contextmenu directionality image link paste',
                'searchreplace table textcolor wordcount'
            ],
            toolbar: [
                'undo redo | styleselect | fontselect fontsizeselect | searchreplace table anchor code',
                'bold italic underline forecolor backcolor superscript subscript | bullist numlist outdent indent alignleft aligncenter alignright alignjustify | link image'
            ],
            setup: (editor: tinymce.Editor) => {
                editor.once('init', () => {
                    this.editor = editor;
                    this.componentWillReceiveProps(this.props);
                });

                editor.on('change', () => this.handleChange());
            }
        });
    }

    private teardown() {
        if (this.editor) {
            this.editor.remove();
        }
    }

    componentDidMount() {
        this.setup();
    }

    componentWillUnmount() {
        console.info('[RichEditor] Unmounting');
        if (this.editor) {
            this.editor.remove();
        } else {
            console.warn('[RichEditor] Tearing down before initialized might leak memory');
        }
    }

    render() {
        return <div>
            <div ref="editor"></div>
        </div>;
    }
}
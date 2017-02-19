declare namespace tinymce {

  namespace util {
    export interface Observable {
      fire(name: string, args?: any, bubble?: boolean): any;
      hasEventListeners(name: string): any;
      off(name?: string, callback?: () => void): this;
      on(name: string, callback: () => void, first?: boolean): this;
      once(name: string, callback: () => void): this;
    }
  }

  export interface EditorObservable extends util.Observable {

  }

  interface AddButtonSettings {
    text?: string;
    icon?: string;
    image?: string;
    tooltip?: string;
    onclick?: () => void;
    onpostrender?: () => void;
    cmd?: string;
  }

  export interface Editor extends EditorObservable {
    addButton(name: string, settings: AddButtonSettings): void;

    destroy(automatic?: boolean): void;

    focus: (skip_focus?: boolean) => void;

    getContainer(): Element;
    getContent(args?: any): string;

    getDoc(): Document;

    hide(): void;

    remove: () => void;

    setContent: (content: string, args?: any) => string;

    show: () => void;
  }

  export interface Static {
    init: (settings: any) => Promise<tinymce.Editor>;
  }
}

declare var tinymce: tinymce.Static;

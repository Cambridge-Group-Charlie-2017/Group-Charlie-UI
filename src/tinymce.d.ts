declare namespace tinymce {

  namespace util {
    export interface Observable<Self extends Observable<Self>> {
      fire(name: string, args?: any, bubble?: boolean): any;
      hasEventListeners(name: string): any;
      off(name?: string, callback?: () => void): Self;
      on(name: string, callback: () => void, first?: boolean): Self;
      once(name: string, callback: () => void): Self;
    }
  }

  export interface EditorObservable<Self extends EditorObservable<Self>> extends util.Observable<Self> {

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

  export interface Editor extends EditorObservable<Editor> {
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

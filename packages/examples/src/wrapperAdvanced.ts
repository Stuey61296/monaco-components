import { MonacoEditorLanguageClientWrapper, UserConfig, WrapperConfig } from 'monaco-editor-wrapper';
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution.js';
import 'monaco-editor/esm/vs/language/typescript/monaco.contribution.js';

import { buildWorkerDefinition } from 'monaco-editor-workers';
buildWorkerDefinition('../../../node_modules/monaco-editor-workers/dist/workers', import.meta.url, false);

const wrapper42 = new MonacoEditorLanguageClientWrapper();
const wrapper43 = new MonacoEditorLanguageClientWrapper();
const wrapper44 = new MonacoEditorLanguageClientWrapper();

const wrapper42Config: UserConfig = {
    id: '42',
    htmlElement: document.getElementById('monaco-editor-root-42') as HTMLElement,
    wrapperConfig: {
        serviceConfig: {
            // enable quick access "F1" and add required keybindings service
            enableQuickaccessService: true,
            enableKeybindingsService: true,
            debugLogging: true
        }
    } as WrapperConfig,
    languageClientConfig: {
        enabled: true,
        useWebSocket: true,
        webSocketConfigOptions: {
            host: 'localhost',
            port: 3000,
            path: 'sampleServer',
            secured: false
        }
    },
    editorContentConfig: {
        languageId: 'text/plain',
        useDiffEditor: true,
        codeOriginal: `This line is equal.
This number is different 2002
Misspeelled!
Same again.`,
        code: `This line is equal.
This number is different 2022
Misspelled!
Same again.`
    }
};

const wrapper43Config: UserConfig = {
    id: '43',
    htmlElement: document.getElementById('monaco-editor-root-43') as HTMLElement,
    wrapperConfig: {
        serviceConfig: {
            // enable quick access "F1" and add required keybindings service
            enableQuickaccessService: true,
            enableKeybindingsService: true,
            debugLogging: true
        }
    } as WrapperConfig,
    languageClientConfig: {
        enabled: false,
    },
    editorContentConfig: {
        languageId: 'text/plain',
        useDiffEditor: true,
        codeOriginal: 'This line is equal.\nThis number is different 3022.\nMisspelled!Same again.',
        code: 'This line is equal.\nThis number is different 3002.\nMisspelled!Same again.',
        editorOptions: {
            lineNumbers: 'off'
        },
        diffEditorOptions: {
            lineNumbers: 'off'
        }
    }
};

const wrapper44Config: UserConfig = {
    id: '44',
    htmlElement: document.getElementById('monaco-editor-root-44') as HTMLElement,
    wrapperConfig: {
        serviceConfig: {
            // enable quick access "F1" and add required keybindings service
            enableQuickaccessService: true,
            enableKeybindingsService: true,
            debugLogging: true
        }
    } as WrapperConfig,
    languageClientConfig: {
        enabled: false,
    },
    editorContentConfig: {
        languageId: 'javascript',
        useDiffEditor: false,
        theme: 'vs-dark',
        code: `function logMe() {
    console.log('Hello monaco-editor-wrapper!');
};`,
        editorOptions: {
            minimap: {
                enabled: true
            }
        }
    }
};

const startWrapper42 = async () => {
    await wrapper42.start(wrapper42Config);
    console.log('wrapper42 was started.');
};

const startWrapper43 = async () => {
    await wrapper43.start(wrapper43Config);
    console.log('wrapper43 was started.');
};
const startWrapper44 = async () => {
    await wrapper44.start(wrapper44Config);
    console.log('wrapper44 was started.');

};

const sleepOne = (milliseconds: number) => {
    setTimeout(async () => {
        alert(`Updating editors after ${milliseconds}ms`);

        // TODO: Update model can only work on same editor
        wrapper42Config.editorContentConfig.languageId = 'javascript';
        wrapper42Config.editorContentConfig.useDiffEditor = false;
        wrapper42Config.editorContentConfig.code = `function logMe() {
    console.log('Hello swap editors!');
};`;
        const w42Start = wrapper42.start(wrapper42Config);

        const w43Start = wrapper43.updateDiffModel({
            languageId: 'javascript',
            code: 'text 5678',
            codeOriginal: 'text 1234'
        });

        wrapper44Config.editorContentConfig.languageId = 'text/plain';
        wrapper44Config.editorContentConfig.useDiffEditor = true;
        wrapper44Config.editorContentConfig.codeOriginal = 'oh la la la!';
        wrapper44Config.editorContentConfig.code = 'oh lo lo lo!';
        // This affects all editors globally and is only effective
        // if it is not in contrast to one configured later
        wrapper44Config.editorContentConfig.theme = 'vs-light';
        const w44Start = wrapper44.start(wrapper44Config);

        await w42Start;
        console.log('Restarted wrapper42.');
        await w43Start;
        console.log('Updated diffmodel of wrapper43.');
        await w44Start;
        console.log('Restarted wrapper44.');
    }, milliseconds);
};

const sleepTwo = (milliseconds: number) => {
    setTimeout(async () => {
        alert(`Updating last editor after ${milliseconds}ms`);

        wrapper44Config.editorContentConfig.useDiffEditor = false;
        wrapper44Config.editorContentConfig.theme = 'vs-dark';

        await wrapper44.start(wrapper44Config);
        console.log('Restarted wrapper44.');
    }, milliseconds);
};

try {
    await startWrapper42();
    await startWrapper43();
    await startWrapper44();

    // change the editors config, content or swap normal and diff editors after five seconds
    sleepOne(5000);

    // change last editor to regular mode
    sleepTwo(10000);
} catch (e) {
    console.error(e);
}


import { buildWorkerDefinition } from 'monaco-editor-workers';
buildWorkerDefinition('../../../node_modules/monaco-editor-workers/dist/workers', import.meta.url, false);

import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
import * as vscode from 'vscode';
import { MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper/allLanguages';
import { StandaloneServices } from 'vscode/services';
import getNotificationServiceOverride from 'vscode/service-override/notifications';
import getDialogServiceOverride from 'vscode/service-override/dialogs';
import getKeybindingsServiceOverride from 'vscode/service-override/keybindings';
// import { getMonacoCss } from 'monaco-editor-wrapper/monaco-css';

StandaloneServices.initialize({
    ...getNotificationServiceOverride(document.body),
    ...getDialogServiceOverride(),
    ...getKeybindingsServiceOverride(),
});

const languageId = 'typescript';
const codeOrg = `function sayHello(): string {
    return "Hello";
};`;
let codeMain = `function sayGoodbye(): string {
    return "Goodbye";
};`;
const wrapper = new MonacoEditorLanguageClientWrapper({
    useVscodeConfig: false,
    theme: 'vs-dark',
    content: {
        languageId: languageId,
        code: codeMain,
        useDiffEditor: false,
        codeModified: codeOrg
    }
});

function startEditor() {
    if (wrapper.isStarted()) {
        alert('Editor was already started!');
        return;
    }

    const editorConfig = wrapper.getEditorConfig();
    configureCodeEditors();

    const monacoEditorConfig = {
        glyphMargin: true,
        guides: {
            bracketPairs: true
        },
        lightbulb: {
            enabled: true
        }
    } as monaco.editor.IEditorOptions & monaco.editor.IGlobalEditorOptions;

    editorConfig.setMonacoEditorOptions(monacoEditorConfig);
    editorConfig.setMonacoDiffEditorOptions(monacoEditorConfig);

    toggleSwapDiffButton(true);
    wrapper.startEditor(document.getElementById('monaco-editor-root') as HTMLElement)
        .then((s: unknown) => {
            console.log(s);
            logEditorInfo(wrapper);

            vscode.commands.getCommands().then((x) => {
                console.log('Currently registered # of vscode commands: ' + x.length);
            });
        })
        .catch((e: Error) => console.error(e));
}

function configureCodeEditors() {
    const runtimeConfig = wrapper.getEditorConfig().getRuntimeConfig();
    if (runtimeConfig.content.useDiffEditor) {
        runtimeConfig.content.code = codeOrg;
        runtimeConfig.content.codeModified = codeMain;
    } else {
        runtimeConfig.content.code = codeMain;
    }
}

function saveMainCode(saveFromDiff: boolean, saveFromMain: boolean) {
    if (saveFromDiff) {
        codeMain = wrapper.getDiffCode()!;
    }
    if (saveFromMain) {
        codeMain = wrapper.getMainCode()!;
    }
}

function swapEditors() {
    const runtimeConfig = wrapper.getEditorConfig().getRuntimeConfig();
    runtimeConfig.content.useDiffEditor = !runtimeConfig.content.useDiffEditor;
    saveMainCode(!runtimeConfig.content.useDiffEditor, false);
    configureCodeEditors();

    wrapper.startEditor(document.getElementById('monaco-editor-root') as HTMLElement)
        .then((s: string) => {
            console.log(s);
            logEditorInfo(wrapper);
        })
        .catch((e: Error) => console.error(e));
}

async function disposeEditor() {
    wrapper.reportStatus();
    toggleSwapDiffButton(false);
    const useDiffEditor = wrapper.getEditorConfig().getRuntimeConfig().content.useDiffEditor;
    saveMainCode(useDiffEditor, !useDiffEditor);
    await wrapper.dispose()
        .then(() => {
            console.log(wrapper.reportStatus().join('\n'));
        })
        .catch((e: Error) => console.error(e));
}

function toggleSwapDiffButton(enabled: boolean) {
    const button = document.getElementById('button-swap') as HTMLButtonElement;
    if (button !== null) {
        button.disabled = !enabled;
    }
}

function logEditorInfo(client: MonacoEditorLanguageClientWrapper) {
    console.log(`# of configured languages: ${monaco.languages.getLanguages().length}`);
    console.log(`Main code: ${client.getMainCode()}`);
    console.log(`Modified code: ${client.getDiffCode()}`);
}

document.querySelector('#button-start')?.addEventListener('click', startEditor);
document.querySelector('#button-swap')?.addEventListener('click', swapEditors);
document.querySelector('#button-dispose')?.addEventListener('click', disposeEditor);

startEditor();

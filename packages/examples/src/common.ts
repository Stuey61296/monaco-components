import { ModelUpdate, MonacoEditorLanguageClientWrapper, UserConfig } from 'monaco-editor-wrapper';
import { languages } from 'monaco-editor/esm/vs/editor/editor.api.js';

export const wrapper = new MonacoEditorLanguageClientWrapper();

export const startEditor = async (userConfig: UserConfig, code: string, codeOriginal?: string) => {
    if (wrapper.isStarted()) {
        alert('Editor was already started!');
        return;
    }
    configureCodeEditors(userConfig, code, codeOriginal);
    toggleSwapDiffButton(true);
    await restartEditor(userConfig);
};

export const updateModel = async (modelUpdate: ModelUpdate) => {
    if (wrapper.getMonacoEditorWrapper()?.getEditorConfig().useDiffEditor) {
        await wrapper?.updateDiffModel(modelUpdate);
    } else {
        await wrapper?.updateModel(modelUpdate);
    }
};

export const swapEditors = async (userConfig: UserConfig, code: string, codeOriginal?: string) => {
    userConfig.editorConfig.useDiffEditor = !userConfig.editorConfig.useDiffEditor;
    saveMainCode(!userConfig.editorConfig.useDiffEditor);
    configureCodeEditors(userConfig, code, codeOriginal);
    await restartEditor(userConfig);
};

export const disposeEditor = async (userConfig: UserConfig) => {
    wrapper.reportStatus();
    toggleSwapDiffButton(false);
    const useDiffEditor = userConfig.editorConfig.useDiffEditor;
    const codeMain = saveMainCode(useDiffEditor);

    await wrapper.dispose();
    return codeMain;
};

const restartEditor = async (userConfig: UserConfig) => {
    await wrapper.start(userConfig);
    logEditorInfo(userConfig);
};

const configureCodeEditors = (userConfig: UserConfig, code: string, codeOriginal?: string) => {
    if (userConfig.editorConfig.useDiffEditor) {
        userConfig.editorConfig.code = code;
        userConfig.editorConfig.codeOriginal = codeOriginal;
    } else {
        userConfig.editorConfig.code = code;
    }
};

const saveMainCode = (saveFromDiff: boolean) => {
    if (saveFromDiff) {
        return wrapper.getModel(true)!.getValue();
    } else {
        return wrapper.getModel()!.getValue();
    }
};

const toggleSwapDiffButton = (enabled: boolean) => {
    const button = document.getElementById('button-swap') as HTMLButtonElement;
    if (button !== null) {
        button.disabled = !enabled;
    }
};

const logEditorInfo = (userConfig: UserConfig) => {
    console.log(`# of configured languages: ${languages.getLanguages().length}`);
    console.log(`Main code: ${wrapper.getModel(true)!.getValue()}`);
    if (userConfig.editorConfig.useDiffEditor) {
        console.log(`Modified code: ${wrapper.getModel()!.getValue()}`);
    }
};

import { StandaloneServices } from 'vscode/services';
import getModelEditorServiceOverride from 'vscode/service-override/modelEditor';
import getNotificationServiceOverride from 'vscode/service-override/notifications';
import getDialogsServiceOverride from 'vscode/service-override/dialogs';
import getConfigurationServiceOverride, { updateUserConfiguration as vscodeUpdateUserConfiguration } from 'vscode/service-override/configuration';
import getKeybindingsServiceOverride, { updateUserKeybindings } from 'vscode/service-override/keybindings';
import getTextmateServiceOverride, { ITMSyntaxExtensionPoint, setGrammars } from 'vscode/service-override/textmate';
import getLanguagesServiceOverride, { IRawLanguageExtensionPoint, setLanguages as vscodeSetLanguages } from 'vscode/service-override/languages';
import getTokenClassificationServiceOverride from 'vscode/service-override/tokenClassification';
import getLanguageConfigurationServiceOverride, { setLanguageConfiguration as vscodeSetLanguageConfiguration } from 'vscode/service-override/languageConfiguration';
import getThemeServiceOverride from 'vscode/service-override/theme';

import { loadAllDefaultThemes } from 'monaco-languageclient/themeLocalHelper';

export type MonacoVscodeApiActivtion = {
    basePath: string,
    enableModelEditorService: boolean;
    // notificationService and dialogsService are enabled by default
    enableConfigurationService: boolean;
    enableKeybindingsService: boolean;
    enableTextmateService: boolean;
    // theme service is required
    enableTokenClassificationService: boolean;
    enableLanguageConfigurationService: boolean;
};

export type ExtendedITMSyntaxExtensionPoint = {
    content: Promise<string>
} & ITMSyntaxExtensionPoint;

export class VscodeApiConfig {

    private activationConfig: MonacoVscodeApiActivtion | undefined;

    private userConfigurationJson: string | undefined;
    private keybindingsJson: string | undefined;

    // grammars
    private grammarsConfig: {
        grammarMap: Map<string, ExtendedITMSyntaxExtensionPoint>,
    } = { grammarMap: new Map<string, ExtendedITMSyntaxExtensionPoint>() };

    private languageConfig: {
        languages?: (Array<Partial<IRawLanguageExtensionPoint>>)
        path?: string,
        getConfiguration?: () => Promise<string>
    } = {};

    async init(input?: MonacoVscodeApiActivtion) {
        console.log(window.location.href);
        this.activationConfig = {
            basePath: input?.basePath ?? '.',
            enableModelEditorService: input?.enableModelEditorService ?? true,
            enableConfigurationService: input?.enableConfigurationService ?? true,
            enableKeybindingsService: input?.enableKeybindingsService ?? true,
            enableTextmateService: input?.enableTextmateService ?? true,
            enableTokenClassificationService: input?.enableTokenClassificationService ?? true,
            enableLanguageConfigurationService: input?.enableLanguageConfigurationService ?? true,
        };

        const onigFileUrl = new URL(this.activationConfig?.basePath + '/resources/wasm/onig.wasm', window.location.href).href;
        const responseOnig = await fetch(onigFileUrl);
        const modelService = this.activationConfig.enableModelEditorService ? getModelEditorServiceOverride(async (model, options) => {
            console.log('trying to open a model', model, options);
            return undefined;
        }) : undefined;
        const configurationService = this.activationConfig.enableModelEditorService ? getConfigurationServiceOverride() : undefined;
        const keybindingsService = this.activationConfig.enableKeybindingsService ? getKeybindingsServiceOverride() : undefined;

        const textmateService = this.activationConfig.enableTextmateService ? getTextmateServiceOverride(async () => {
            return await responseOnig.arrayBuffer();
        }) : undefined;
        const tokenClassificationService = this.activationConfig.enableTokenClassificationService ? getTokenClassificationServiceOverride() : undefined;
        let languageConfigurationService;
        let languageService;
        if (tokenClassificationService) {
            languageConfigurationService = getLanguageConfigurationServiceOverride();
            languageService = getLanguagesServiceOverride();
        }

        StandaloneServices.initialize({
            ...modelService,
            ...getNotificationServiceOverride(),
            ...getDialogsServiceOverride(),
            ...configurationService,
            ...keybindingsService,
            ...textmateService,
            ...getThemeServiceOverride(),
            ...tokenClassificationService,
            ...languageConfigurationService,
            ...languageService
        });
        console.log('Basic init of VscodeApiConfig was completed.');
    }

    async setup() {
        if (this.languageConfig.languages) {
            vscodeSetLanguages(this.languageConfig.languages);
        }

        if (this.languageConfig.path && this.languageConfig.getConfiguration) {
            vscodeSetLanguageConfiguration(this.languageConfig.path, this.languageConfig.getConfiguration);
        }

        if (this.activationConfig?.enableLanguageConfigurationService && this.grammarsConfig.grammarMap) {
            const contentFunc = (grammar: ExtendedITMSyntaxExtensionPoint) => {
                const def = this.grammarsConfig.grammarMap.get(grammar.language ?? '');
                if (def) {
                    return def.content;
                } else {
                    return Promise.reject(new Error(`Grammar language ${grammar.language} not found!`));
                }
            };
            setGrammars(Array.from(this.grammarsConfig.grammarMap.values()), contentFunc);
        }

        const themesUrl = new URL(this.activationConfig?.basePath + '/resources/themes', window.location.href).href;
        await loadAllDefaultThemes(themesUrl);

        if (this.userConfigurationJson) {
            void vscodeUpdateUserConfiguration(this.userConfigurationJson);
        }

        if (this.activationConfig?.enableKeybindingsService && this.keybindingsJson) {
            void updateUserKeybindings(this.keybindingsJson);
        }
    }

    setUserConfiguration(configurationJson: string) {
        this.userConfigurationJson = configurationJson;
    }

    setGrammar(languageId: string, grammar: ExtendedITMSyntaxExtensionPoint) {
        this.grammarsConfig.grammarMap.set(languageId, grammar);
    }

    setLanguages(languages: Array<Partial<IRawLanguageExtensionPoint>>): void {
        this.languageConfig.languages = languages;
    }

    setLanguageConfiguration(path: string, getConfiguration: () => Promise<string>): void {
        this.languageConfig.path = path;
        this.languageConfig.getConfiguration = getConfiguration;
    }

    setUserKeybindings(keybindingsJson: string) {
        this.keybindingsJson = keybindingsJson;
    }
}

import * as DocumentModels from 'document-model-libs/document-models';
import { Action, DocumentModel } from 'document-model/document';
import { module as DocumentModelLib } from 'document-model/document-model';
import { atom, useAtomValue } from 'jotai';
import { loadable } from 'jotai/utils';
import { useFeatureFlag } from 'src/hooks/useFeatureFlags';

export const LOCAL_DOCUMENT_MODELS = import.meta.env.LOCAL_DOCUMENT_MODELS;

export const documentModelsMap: Record<string, DocumentModel> = {
    DocumentModel: DocumentModelLib as DocumentModel,
    ...(DocumentModels as Record<string, DocumentModel>),
};

export const documentModels = Object.values(documentModelsMap);

const asyncDocumentModelsAtom = atom(async () => {
    let newDocumentModelsMap = { ...documentModelsMap };
    if (LOCAL_DOCUMENT_MODELS) {
        try {
            const localModule = (await import(
                'LOCAL_DOCUMENT_MODELS'
            )) as unknown as Record<string, DocumentModel>;
            console.log('New local document models', localModule);
            newDocumentModelsMap = { ...documentModelsMap, ...localModule };
        } catch (e) {
            console.error('OI', LOCAL_DOCUMENT_MODELS, 'IO');
            console.error('Error loading local document models', e);
        }
    }
    return Object.values(newDocumentModelsMap);
});

export const documentModelsAtom = loadable(asyncDocumentModelsAtom); // atom(documentModels);

export const useDocumentModels = () => useAtomValue(documentModelsAtom);

function getDocumentModel<S = unknown, A extends Action = Action>(
    documentType: string,
    documentModels: DocumentModel[] | undefined,
) {
    return documentModels?.find(d => d.documentModel.id === documentType) as
        | DocumentModel<S, A>
        | undefined;
}

export function useDocumentModel<S = unknown, A extends Action = Action>(
    documentType: string,
) {
    const documentModels = useDocumentModels();
    return getDocumentModel<S, A>(
        documentType,
        documentModels.state === 'hasData' ? documentModels.data : undefined,
    );
}

export const useGetDocumentModel = () => {
    const documentModels = useDocumentModels();
    return (documentType: string) =>
        getDocumentModel(
            documentType,
            documentModels.state === 'hasData'
                ? documentModels.data
                : undefined,
        );
};

/**
 * Returns an array of filtered document models based on the enabled and disabled editors (feature flag).
 * If enabledEditors is set to '*', returns all document models.
 * If disabledEditors is set to '*', returns an empty array.
 * If disabledEditors is an array, filters out document models whose IDs are included in the disabledEditors array.
 * If enabledEditors is an array, filters document models whose IDs are included in the enabledEditors array.
 * @returns {Array<DocumentModel>} The filtered document models.
 */
export const useFilteredDocumentModels = () => {
    const asyncDocumentModels = useDocumentModels();
    const { config } = useFeatureFlag();
    const { enabledEditors, disabledEditors } = config.editors;

    if (asyncDocumentModels.state !== 'hasData') {
        return undefined;
    }
    const _documentModels = asyncDocumentModels.data;
    const documentModels = _documentModels.filter(
        model => model.documentModel.id !== 'powerhouse/document-drive',
    );

    if (enabledEditors === '*') {
        return documentModels;
    }

    if (disabledEditors === '*') {
        return [];
    }

    if (disabledEditors) {
        return documentModels.filter(
            d => !disabledEditors.includes(d.documentModel.id),
        );
    }

    if (enabledEditors) {
        return documentModels.filter(d =>
            enabledEditors.includes(d.documentModel.id),
        );
    }

    return documentModels;
};

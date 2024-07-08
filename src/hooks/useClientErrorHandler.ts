import { PullResponderTrigger } from 'document-drive';
import {
    PullResponderTriggerData,
    Trigger,
} from 'document-model-libs/document-drive';
import { useCallback, useRef, useState } from 'react';
import { useDocumentDriveServer } from './useDocumentDriveServer';

export type ClientErrorHandler = {
    strandsErrorHandler: (
        driveId: string,
        trigger: Trigger,
        status: number,
        errorMessage: string,
    ) => Promise<void>;
};

const DELAY_LIMIT = 100000;

const isListenerIdNotFound = (errorMessage: string, listenerId?: string) => {
    if (!listenerId) return false;

    return errorMessage
        .toLocaleLowerCase()
        .includes(`transmitter ${listenerId} not found`);
};

export const useClientErrorHandler = (): ClientErrorHandler => {
    const [handlingInProgress, setHandlingInProgress] = useState<string[]>([]);
    const [pullResponderTriggerMap, setPullResponderTriggerMap] = useState<
        Map<string, PullResponderTrigger>
    >(new Map());
    const { addTrigger, removeTrigger, registerNewPullResponderTrigger } =
        useDocumentDriveServer();

    const pullResponderRegisterDelay = useRef<Map<string, number>>(new Map());

    const handleStrands400 = useCallback(
        async (driveId: string, trigger: Trigger, handlerCode: string) => {
            setHandlingInProgress(state => [...state, handlerCode]);

            const triggerData =
                trigger.data as unknown as PullResponderTriggerData;

            try {
                let pullResponderTrigger =
                    pullResponderTriggerMap.get(handlerCode);

                if (!pullResponderTrigger) {
                    pullResponderTrigger =
                        await registerNewPullResponderTrigger(
                            driveId,
                            triggerData.url,
                            {
                                pullInterval:
                                    Number(triggerData.interval) || 3000,
                            },
                        );

                    pullResponderTriggerMap.set(
                        handlerCode,
                        pullResponderTrigger,
                    );
                    setPullResponderTriggerMap(pullResponderTriggerMap);
                }

                await removeTrigger(driveId, trigger.id);
                await addTrigger(driveId, pullResponderTrigger);

                pullResponderRegisterDelay.current.delete(handlerCode);
            } catch (error) {
                const delay =
                    pullResponderRegisterDelay.current.get(handlerCode) || 1;
                pullResponderRegisterDelay.current.set(
                    handlerCode,
                    delay === DELAY_LIMIT ? delay : delay * 10,
                );

                console.error(error);
            } finally {
                setHandlingInProgress(state =>
                    state.filter(code => code !== handlerCode),
                );
            }
        },
        [
            pullResponderTriggerMap,
            removeTrigger,
            addTrigger,
            pullResponderRegisterDelay,
            registerNewPullResponderTrigger,
        ],
    );

    const strandsErrorHandler: ClientErrorHandler['strandsErrorHandler'] =
        async (driveId, trigger, status, errorMessage) => {
            switch (status) {
                case 400: {
                    if (
                        isListenerIdNotFound(
                            errorMessage,
                            trigger.data?.listenerId,
                        )
                    ) {
                        const handlerCode = `strands:${driveId}:${status}`;

                        if (handlingInProgress.includes(handlerCode)) return;
                        if (!trigger.data) return;

                        const delay =
                            pullResponderRegisterDelay.current.get(
                                handlerCode,
                            ) || 0;

                        setTimeout(
                            () =>
                                handleStrands400(driveId, trigger, handlerCode),
                            delay,
                        );
                    }

                    break;
                }
            }
        };

    return { strandsErrorHandler };
};
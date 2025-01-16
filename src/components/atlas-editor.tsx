import {
    AtlasFeedbackIssuesAction,
    AtlasFeedbackIssuesLocalState,
    AtlasFeedbackIssuesState,
} from '@powerhousedao/atlas-feedback-issues/document-model';
import { AtlasFeedbackIssues } from '@powerhousedao/atlas-feedback-issues/editors';
import { EditorProps } from 'document-model/document';
import { useState } from 'react';
import { useScopes } from 'src/store/atlas';

function AtlasFeedbackIssuesContainer(
    props: EditorProps<
        AtlasFeedbackIssuesState,
        AtlasFeedbackIssuesAction,
        AtlasFeedbackIssuesLocalState
    >,
) {
    const scopes = useScopes();
    const [selectedIssuePhid, setSelectedIssuePhid] = useState<
        string | null
    >(null);
    const [selectedNotionId, setSelectedNotionId] = useState<string | null>(
        null
    );
    const [selectedCommentPhid, setSelectedCommentPhid] = useState<string | null>(
        null
    );
    return (
        <AtlasFeedbackIssues.Component
            {...props}
            selectedIssuePhid={selectedIssuePhid}
            setSelectedIssuePhid={setSelectedIssuePhid}
            selectedNotionId={selectedNotionId}
            setSelectedNotionId={setSelectedNotionId}
            selectedCommentPhid={selectedCommentPhid}
            setSelectedCommentPhid={setSelectedCommentPhid}
            scopes={scopes}
        />
    );
}

export const AtlasFeedbackIssuesEditor = {
    ...AtlasFeedbackIssues,
    Component: AtlasFeedbackIssuesContainer,
};

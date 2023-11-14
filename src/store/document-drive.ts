import {
    DriveTreeItem,
    TreeItem,
    traverseDriveById,
} from '@powerhousedao/design-system';
import { Document } from 'document-model/document';
import { atom, useAtom, useAtomValue } from 'jotai';
import { selectAtom } from 'jotai/utils';
import { useEffect, useMemo, useState } from 'react';
import { useDocumentDrive } from 'src/hooks/useDocumentDrive';

export function findDeepestSelectedPath<T extends string = string>(
    drives: TreeItem<T>[]
) {
    let deepestPath: TreeItem[] = [];
    const currentDepth = 0;
    let maxDepth = -1;

    function dfs(node: TreeItem<T>, path: TreeItem<T>[], depth: number) {
        // Add the current node to the path
        path.push(node);

        // If this node is selected and deeper than the previous found, update the deepest path
        if (node.isSelected && depth > maxDepth) {
            maxDepth = depth;
            deepestPath = path.slice(); // Copy the current path
        }

        // Continue to child nodes
        node.children?.forEach(child => {
            dfs(child, path.slice(), depth + 1); // Use a copy of the path for each child
        });
    }

    // Start DFS from the root node
    for (const drive of drives) {
        dfs(drive, [], currentDepth);
    }

    return deepestPath;
}

export const drivesAtom = atom<DriveTreeItem[]>([]);

export const useDrives = () => useAtom(drivesAtom);

export const useSelectedDrive = () =>
    useAtomValue(
        useMemo(
            () =>
                selectAtom(drivesAtom, drives => {
                    const selected = findDeepestSelectedPath(drives);
                    if (selected.length) {
                        return selected[0];
                    } else if (drives.length) {
                        return drives[0];
                    } else {
                        return undefined;
                    }
                }),
            []
        )
    );

export const useSelectedPath = () =>
    useAtomValue(
        useMemo(
            () =>
                selectAtom(drivesAtom, drives => {
                    const path = findDeepestSelectedPath(drives);
                    return path.length
                        ? path
                        : drives.length
                        ? [drives[0]]
                        : [];
                }),
            []
        )
    );

export const useFileNodeDocument = (drive?: string, path?: string) => {
    const { openFile, updateFile } = useDocumentDrive();
    const [selectedDocument, setSelectedDocument] = useState<
        Document | undefined
    >();

    async function fetchDocument(drive: string, path: string) {
        try {
            const document = await openFile(drive, path);
            setSelectedDocument(document);
        } catch (error) {
            setSelectedDocument(undefined);
            console.error(error);
        }
    }

    useEffect(() => {
        if (drive && path) {
            fetchDocument(drive, path);
        } else {
            setSelectedDocument(undefined);
        }
    }, [drive, path]);

    async function saveDocument() {
        if (drive && path && selectedDocument) {
            await updateFile(selectedDocument, drive, path);
            await fetchDocument(drive, path);
        }
    }

    return [selectedDocument, setSelectedDocument, saveDocument] as const;
};

export const useSelectFolder = () => {
    const [, setDrives] = useDrives();

    return (drive: string, path: string) => {
        setDrives(drives =>
            traverseDriveById(drives, drive, treeItem => {
                if (treeItem.id === path) {
                    treeItem.expanded = !treeItem.expanded;
                    treeItem.isSelected = !treeItem.isSelected;
                } else {
                    treeItem.isSelected = false;
                }
                return treeItem;
            })
        );
    };
};
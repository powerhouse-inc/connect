'use server';
import { ViewNode, ViewNodeMap } from '@powerhousedao/mips-parser';
import { atom, useAtomValue } from 'jotai';
import { atomWithLazy } from 'jotai/utils';
import { logger } from 'src/services/logger';

const ATLAS_BASE_URL =
    import.meta.env.PH_CONNECT_ATLAS_BASE_URL ||
    'https://mips-portal-staging-beta.vercel.app';

async function fetchViewNodeMap(): Promise<ViewNodeMap> {
    const url = new URL('/api/view-node-tree', ATLAS_BASE_URL);
    try {
        const result = await fetch(url);
        const nodeMap = await result.json();
        return nodeMap as ViewNodeMap;
    } catch (error) {
        logger.error(error);
        return {};
    }
}

const lazyScopesAtom = atomWithLazy(fetchViewNodeMap);

const scopesAtom = atom(async get => {
    const map = await get(lazyScopesAtom);
    const scopes = Object.values(map).filter(
        node => node?.type === 'scope',
    ) as ViewNode[];
    return scopes;
});

export const useScopes = () => useAtomValue(scopesAtom);

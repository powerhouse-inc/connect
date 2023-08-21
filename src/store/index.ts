import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { themeAtom } from './theme';

export const sidebarCollapsedAtom = atomWithStorage('sidebar-collapsed', false);

export const userAtom = atom<string | undefined>(undefined);

export * from './attestation';
export * from './tabs';
export * from './theme';
export default { themeAtom, sidebarCollapsedAtom, userAtom };

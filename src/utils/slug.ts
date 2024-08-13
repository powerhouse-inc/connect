export function makeNodeSlugFromNodeName(name: string) {
    return encodeURIComponent(name.replaceAll(/\s/g, '-'));
}

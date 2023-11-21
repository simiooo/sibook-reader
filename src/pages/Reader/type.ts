export interface SubItem {
    id: string;
    href: string;
    label: string;
    subitems: SubItem[];
    parent?: string;
}

export interface Item extends SubItem {
    subitems: SubItem[];
}

export interface RootObject {
    id: string;
    href: string;
    label: string;
    subitems: Item[];
}
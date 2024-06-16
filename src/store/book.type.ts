export type Book = Partial<{
    id: number;
    objectId: string;
    uploadDate: string;
    uploadBy: string;
    objectName: string;
    objectSize: number;
    objectType: string;
    thumbnailUrl: string;
    islandId: string;
    ownerId: string;
}>
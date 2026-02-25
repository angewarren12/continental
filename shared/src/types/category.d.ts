export interface Category {
    id: number;
    name: string;
    mainCategory?: 'food' | 'drink' | 'service';
    description?: string;
    icon?: string;
    color: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}
export interface CategoryCreationAttributes {
    name: string;
    mainCategory: 'food' | 'drink' | 'service';
    description?: string;
    icon?: string;
    color?: string;
}
export interface CategoryUpdateAttributes {
    name?: string;
    mainCategory?: 'food' | 'drink' | 'service';
    description?: string | null;
    icon?: string | null;
    color?: string;
    isActive?: boolean;
}
export declare const DEFAULT_CATEGORIES: readonly [{
    readonly name: "Bières";
    readonly mainCategory: "drink";
    readonly description: "Bières locales et importées";
    readonly icon: "LocalBar";
    readonly color: "#bd0f3b";
}, {
    readonly name: "Vins";
    readonly mainCategory: "drink";
    readonly description: "Vins rouges, blancs et rosés";
    readonly icon: "WineBar";
    readonly color: "#8B0000";
}, {
    readonly name: "Soft drinks";
    readonly mainCategory: "drink";
    readonly description: "Boissons non alcoolisées";
    readonly icon: "LocalDrink";
    readonly color: "#FF6B6B";
}, {
    readonly name: "Cocktails";
    readonly mainCategory: "drink";
    readonly description: "Cocktails et boissons mixtes";
    readonly icon: "SportsBar";
    readonly color: "#bd0f3b";
}, {
    readonly name: "Eaux";
    readonly mainCategory: "drink";
    readonly description: "Eaux minérales et gazeuses";
    readonly icon: "WaterDrop";
    readonly color: "#2196F3";
}];
//# sourceMappingURL=category.d.ts.map
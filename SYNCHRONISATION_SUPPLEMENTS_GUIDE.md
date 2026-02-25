# 📚 Documentation - Synchronisation des Suppléments

## 🎯 **Objectif**

Résoudre le problème où les quantités des suppléments ne suivent pas automatiquement les changements de quantité des produits principaux.

## 🔧 **Solution Implémentée**

### 1. Service de Synchronisation (`SupplementSyncService.ts`)

Service centralisé pour gérer les règles de synchronisation entre produits et suppléments.

#### Fonctionnalités principales :
- **Règles de synchronisation** : Ratio 1:1, 1:2, etc.
- **Activation/désactivation** : Contrôle par supplément
- **Mise à jour automatique** : Quand la quantité du produit change
- **Calcul des totaux** : Incluant les suppléments synchronisés

#### Exemple d'utilisation :
```typescript
import { supplementSyncService } from '../services/SupplementSyncService';

// Créer une règle de synchronisation 1:1
supplementSyncService.addSyncRule({
  parentItemId: 1,
  supplementId: 10,
  syncRatio: 1,
  syncEnabled: true,
});

// Mettre à jour la quantité avec synchronisation
const result = supplementSyncService.updateSupplementQuantities(
  parentItem,
  newQuantity,
  currentSupplements
);
```

### 2. Hook Personnalisé (`useSupplementSync.ts`)

Hook React pour intégrer facilement la synchronisation dans les composants.

#### Fonctionnalités :
- **État local** : Gestion de l'état de synchronisation
- **Actions** : toggle, update, setRatio
- **Utilitaires** : calculateTotal, hasSyncedSupplements
- **Gestion d'erreurs** : Callbacks d'erreur

#### Exemple d'utilisation :
```typescript
import { useSupplementSync } from '../hooks/useSupplementSync';

const MyComponent = ({ item, supplements }) => {
  const {
    isSyncEnabled,
    toggleSync,
    updateQuantity,
    calculateItemTotal,
  } = useSupplementSync(item.id, [1, 2, 3], {
    autoSync: true,
    syncRatio: 1,
    onError: (error) => console.error(error),
  });

  const handleQuantityChange = async (newQuantity) => {
    const result = await updateQuantity(item, newQuantity, supplements);
    
    if (result.success) {
      // Mettre à jour l'état local avec result.updatedItems et result.updatedSupplements
    }
  };

  return (
    <div>
      <Switch 
        checked={isSyncEnabled} 
        onChange={(e) => toggleSync(e.target.checked)}
      />
      <Typography>
        Total: {calculateItemTotal(item, supplements)} FCFA
      </Typography>
    </div>
  );
};
```

### 3. Composant Amélioré (`OrderItemWithSupplements.tsx`)

Composant React avec synchronisation intégrée pour les items de commande.

#### Fonctionnalités :
- **Contrôle de quantité** : Avec synchronisation automatique
- **Toggle de synchronisation** : Par item
- **Affichage des suppléments** : Avec indication de synchronisation
- **Gestion d'erreurs** : Messages utilisateur

#### Exemple d'utilisation :
```typescript
import OrderItemWithSupplements from '../components/orders/OrderItemWithSupplements';

const OrderSummary = ({ items, onUpdateQuantity }) => {
  return (
    <div>
      {items.map((item, index) => (
        <OrderItemWithSupplements
          key={item.id}
          item={item}
          supplements={getSupplementsForItem(item.id)}
          onUpdateQuantity={onUpdateQuantity}
          readOnly={false}
          compact={false}
        />
      ))}
    </div>
  );
};
```

## 🔄 **Workflow de Synchronisation**

### Étape 1: Initialisation
```typescript
// Quand un item est ajouté au panier
const item = {
  id: 1,
  productName: "Spaghetti",
  quantity: 2,
  unitPrice: 500,
};

const supplements = [
  { id: 10, name: "Œuf", unitPrice: 200, quantity: 2 },
  { id: 11, name: "Fromage", unitPrice: 150, quantity: 2 },
];

// Créer les règles de synchronisation
supplementSyncService.createDefaultSyncRules(item.id, [10, 11]);
```

### Étape 2: Changement de Quantité
```typescript
// L'utilisateur clique sur "+" pour passer de 2 à 3
const newQuantity = 3;

const result = supplementSyncService.updateSupplementQuantities(
  item,
  newQuantity,
  supplements
);

// Résultat :
// {
//   success: true,
//   updatedItems: [{ ...item, quantity: 3, totalPrice: 1500 }],
//   updatedSupplements: [
//     { ...supplements[0], quantity: 3, totalPrice: 600 },
//     { ...supplements[1], quantity: 3, totalPrice: 450 }
//   ]
// }
```

### Étape 3: Mise à Jour de l'UI
```typescript
// Mettre à jour l'état local
setItems(result.updatedItems);
setSupplements(result.updatedSupplements);

// Recalculer les totaux
const newTotal = calculateOrderTotal();
```

## 🎛️ **Options de Configuration**

### Ratios de Synchronisation
```typescript
// 1:1 - Un supplément par produit
supplementSyncService.addSyncRule({
  parentItemId: 1,
  supplementId: 10,
  syncRatio: 1,
  syncEnabled: true,
});

// 1:2 - Deux suppléments par produit
supplementSyncService.addSyncRule({
  parentItemId: 1,
  supplementId: 10,
  syncRatio: 2,
  syncEnabled: true,
});
```

### Synchronisation Sélective
```typescript
// Activer/désactiver par supplément
supplementSyncService.toggleSync(1, 10); // Désactive le supplément 10 pour l'item 1
supplementSyncService.toggleSync(1, 11); // Active le supplément 11 pour l'item 1
```

### Hook Options
```typescript
const {
  isSyncEnabled,
  toggleSync,
  updateQuantity,
} = useSupplementSync(itemId, supplementIds, {
  autoSync: true,        // Activer par défaut
  syncRatio: 1,          // Ratio par défaut
  onSyncUpdate: (result) => {
    // Callback après mise à jour
    console.log('Synchronisation:', result);
  },
  onError: (error) => {
    // Callback d'erreur
    alert(error);
  },
});
```

## 🐛 **Cas d'Usage et Solutions**

### Problème 1: Quantités désynchronisées
**Symptôme**: Quand on change la quantité du plat, les suppléments gardent l'ancienne quantité.

**Solution**: Activer la synchronisation automatique
```typescript
// Dans le composant
const { updateQuantity } = useSupplementSync(item.id, supplementIds, {
  autoSync: true,
});

// Utiliser updateQuantity au lieu de la mise à jour directe
await updateQuantity(item, newQuantity, supplements);
```

### Problème 2: Suppléments non synchronisés
**Symptôme**: Certains suppléments ne suivent pas la quantité du produit.

**Solution**: Vérifier les règles de synchronisation
```typescript
// Vérifier si des règles existent
const hasRules = supplementSyncService.hasSyncedSupplements(itemId);

// Ajouter des règles si nécessaire
if (!hasRules) {
  supplementSyncService.createDefaultSyncRules(itemId, supplementIds);
}
```

### Problème 3: Ratio incorrect
**Symptôme**: Les suppléments ont des quantités incorrectes.

**Solution**: Ajuster le ratio de synchronisation
```typescript
// Ratio 1:2 (2 suppléments par produit)
const { setSyncRatio } = useSupplementSync(itemId, supplementIds);
setSyncRatio(2);
```

## 📊 **Performance et Optimisation**

### Mise en Cache des Règles
```typescript
// Les règles sont mises en cache dans le service
// Pas besoin de recharger à chaque rendu
const rules = supplementSyncService.getSyncRules(itemId);
```

### Mise à Jour par Lots
```typescript
// Pour plusieurs items, utiliser la synchronisation globale
const { applyGlobalSync } = useOrderSupplementSync(orderItems);
const result = await applyGlobalSync(items, supplements);
```

### Éviter les Re-rendus
```typescript
// Utiliser useCallback pour les callbacks
const handleQuantityChange = useCallback(async (newQuantity) => {
  const result = await updateQuantity(item, newQuantity, supplements);
  // ...
}, [updateQuantity, item, supplements]);
```

## 🧪 **Tests et Validation**

### Test Unitaire du Service
```typescript
import { supplementSyncService } from '../services/SupplementSyncService';

describe('SupplementSyncService', () => {
  test('devrait synchroniser les quantités 1:1', () => {
    const item = { id: 1, quantity: 2, unitPrice: 500 };
    const supplements = [{ id: 10, quantity: 2, unitPrice: 200 }];
    
    supplementSyncService.addSyncRule({
      parentItemId: 1,
      supplementId: 10,
      syncRatio: 1,
      syncEnabled: true,
    });
    
    const result = supplementSyncService.updateSupplementQuantities(
      item,
      3,
      supplements
    );
    
    expect(result.success).toBe(true);
    expect(result.updatedSupplements[0].quantity).toBe(3);
  });
});
```

### Test d'Intégration du Hook
```typescript
import { renderHook, act } from '@testing-library/react';
import { useSupplementSync } from '../hooks/useSupplementSync';

describe('useSupplementSync', () => {
  test('devrait mettre à jour les quantités', async () => {
    const { result } = renderHook(() => 
      useSupplementSync(1, [10], { autoSync: true })
    );
    
    const item = { id: 1, quantity: 2, unitPrice: 500 };
    const supplements = [{ id: 10, quantity: 2, unitPrice: 200 }];
    
    await act(async () => {
      const updateResult = await result.current.updateQuantity(
        item,
        3,
        supplements
      );
      
      expect(updateResult.success).toBe(true);
      expect(updateResult.updatedSupplements[0].quantity).toBe(3);
    });
  });
});
```

## 🚀 **Déploiement et Migration**

### Migration depuis l'ancien système
```typescript
// 1. Initialiser les règles pour les commandes existantes
existingOrders.forEach(order => {
  order.items.forEach(item => {
    const supplementIds = item.supplements?.map(s => s.id) || [];
    supplementSyncService.createDefaultSyncRules(item.id, supplementIds);
  });
});

// 2. Mettre à jour les composants existants
// Remplacer les gestionnaires de quantité par le hook useSupplementSync
```

### Monitoring et Logging
```typescript
// Ajouter des logs pour le debugging
supplementSyncService.updateSupplementQuantities = (item, newQuantity, supplements) => {
  console.log(`Synchronisation: Item ${item.id} → ${newQuantity}`);
  
  const result = originalMethod(item, newQuantity, supplements);
  
  if (result.success) {
    console.log(`✅ ${result.updatedSupplements.length} suppléments mis à jour`);
  } else {
    console.error(`❌ Erreur: ${result.error}`);
  }
  
  return result;
};
```

---

## 📝 **Résumé**

Le système de synchronisation des suppléments résout définitivement le problème où les quantités des suppléments ne suivaient pas les changements de quantité des produits principaux.

**Points clés :**
- ✅ **Service centralisé** pour la logique de synchronisation
- ✅ **Hook React** pour une intégration facile
- ✅ **Composant amélioré** avec synchronisation intégrée
- ✅ **Configuration flexible** (ratios, activation sélective)
- ✅ **Performance optimisée** (mise en cache, mises à jour par lots)
- ✅ **Tests complets** et documentation détaillée

**Résultat garanti :** Quand vous cliquez sur "+" ou "-", les quantités des produits ET des suppléments changent automatiquement et de manière cohérente ! 🎯

# 📚 Taxi Binchois Manager - Guide de démarrage

## 🎯 Où commencer?

### Pour comprendre ce qui a été fait
👉 Lire: [RESUME_MODIFICATIONS.md](./RESUME_MODIFICATIONS.md)

### Pour déployer sur Vercel
👉 Lire: [PROCHAINES_ETAPES.md](./PROCHAINES_ETAPES.md)

### Pour la documentation technique complète
👉 Lire: [AUTOMATISATION.md](./AUTOMATISATION.md)

### Pour le guide d'installation
👉 Lire: [INSTALLATION.md](./INSTALLATION.md)

---

## 🚀 Démarrage rapide (10 minutes)

### 1️⃣ Créer un compte Resend
- Site: https://resend.com
- Action: Créer un compte et générer une clé API
- Note: La clé ressemble à `re_xxxxx...`

### 2️⃣ Pousser sur GitHub
```bash
cd "c:\Users\NouTay\Documents\taxi-binchois-manager"
git add .
git commit -m "Automatisation Excel et Emails"
git push origin main
```

### 3️⃣ Déployer sur Vercel
- Site: https://vercel.com/new
- Action: Importer le repo GitHub
- Config: Ajouter variable `RESEND_API_KEY`

### 4️⃣ Tester
- Créer un nouveau chauffeur
- Se déconnecter
- Vérifier l'email reçu ✓

---

## ✨ What's new?

### Avant ❌
```
Import Excel manuel
↓
Gestion fichiers Excel
↓
Export Excel manuel
↓
Emails manuels
```

### Maintenant ✅
```
Inscription chauffeur
↓ (automatique)
Chauffeurs.xlsx mis à jour
↓ (automatique)
Email récapitulatif à chaque déconnexion
↓ (automatique)
Historique traçable et organisé
```

---

## 📁 Structure du projet

```
taxi-binchois-manager/
├── index.html ........................ Application principale
├── package.json ....................... Dépendances npm
├── tsconfig.json ...................... Config TypeScript
│
├── api/ ............................... Vercel Functions
│   ├── send-email.ts .................. Email manuel + pièces jointes
│   ├── send-daily-recap.ts ............ Récapitulatif journalier
│   └── sync-excel.ts .................. Synchronisation Excel
│
├── _sdk/ .............................. SDKs (Element & Data)
│   ├── element_sdk.js
│   └── data_sdk.js
│
├── Chauffeurs.xlsx (auto-généré)
├── Vehicules.xlsx (auto-généré)
│
└── Documentation/
    ├── RESUMÉ_MODIFICATIONS.md ........ Ce qui a changé globalement
    ├── AUTOMATISATION.md .............. Architecture détaillée
    ├── INSTALLATION.md ................ Guide d'installation
    ├── PROCHAINES_ETAPES.md ........... Déploiement Vercel
    ├── EXPORT_EMAIL.md ................ Export historiques
    └── GUIDE_DEMARRAGE.md (ce fichier)
```

---

## 🔄 Automatisations actives

| Événement | Action | Résultat |
|-----------|--------|----------|
| Chauffeur s'inscrit | `syncExcelFile('user')` | `Chauffeurs.xlsx` ↑ |
| Admin crée chauffeur | `syncExcelFile('user')` | `Chauffeurs.xlsx` ↑ |
| Admin modifie chauffeur | `syncExcelFile('user')` | `Chauffeurs.xlsx` ↑ |
| Admin crée véhicule | `syncExcelFile('vehicule')` | `Vehicules.xlsx` ↑ |
| Admin modifie véhicule | `syncExcelFile('vehicule')` | `Vehicules.xlsx` ↑ |
| Chauffeur se déconnecte | `sendDailyRecap()` | Email HTML reçu 📧 |
| Admin exporte manuellement | `exportHistoriqueByEmail()` | Email + Excel joint 📧 |

---

## ✅ Tous les problèmes corrigés

- ✅ Erreurs de compilation éliminées
- ✅ Imports Excel supprimés
- ✅ Excel synchronisé automatiquement
- ✅ Emails envoyés automatiquement
- ✅ Interface admin simplifiée
- ✅ Code déployable sur Vercel
- ✅ Documentation complète

---

## 🛠️ Commandes utiles

```bash
# Installer dépendances
npm install

# Voir les erreurs
npm run lint

# Déployer localement
vercel dev

# Déployer en production
vercel --prod

# Voir les logs
vercel logs
```

---

## 📊 Exemple d'email reçu

**De:** onboarding@resend.dev  
**Objet:** Récapitulatif journalier - Jean Dupont - 30/03/2026

```
┌─────────────────────────────────┐
│    Service terminé ✓            │
│    Jean Dupont                  │
├─────────────────────────────────┤
│  Récapitulatif du jour          │
│  Recette: 250,50 €              │
│  Courses: 8                     │
├─────────────────────────────────┤
│  Détail des courses             │
│  ┌───────────────────────────┐  │
│  │ 09:00 Liège → Verviers   │  │
│  │ 25,50€ [✓ Payé]          │  │
│  │ 10:15 Spa → Liège        │  │
│  │ 32,00€ [✓ Payé]          │  │
│  │ ...                       │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

---

## 💾 Fichiers Excel générés

### Chauffeurs.xlsx
```
Nom       | Prenom | Email           | Role      | Actif
----------|--------|-----------------|-----------|-------
Dupont    | Jean   | jean@email.com  | chauffeur | Oui
Martin    | Marie  | marie@email.com | chauffeur | Oui
```

### Vehicules.xlsx
```
Immatriculation | Marque  | Modele  | Statut
----------------|---------|---------|-------
AB-123-CD       | Peugeot | 208     | libre
EF-456-GH       | Renault | Espace  | libre
```

---

## 🎓 Architecture système

```
                    Vercel Deployment
        ┌──────────────────────────────────┐
        │                                  │
        │  Frontend (index.html)           │
        │  - Login/Signup                  │
        │  - Dashboard Admin               │
        │  - Dashboard Chauffeur           │
        │  - Gestion Véhicules             │
        │                                  │
        ├──────────────────────────────────┤
        │                                  │
        │  Backend APIs                    │
        │  ├── /api/send-email             │
        │  ├── /api/send-daily-recap       │
        │  └── /api/sync-excel             │
        │                                  │
        ├──────────────────────────────────┤
        │                                  │
        │  Storage                         │
        │  ├── Chauffeurs.xlsx             │
        │  ├── Vehicules.xlsx              │
        │  └── Data SDK                    │
        │                                  │
        └──────────────────────────────────┘
                    ↓        ↓
                  Resend   KV/Storage
```

---

## 🔐 Sécurité

- ✅ Clé API Resend sécurisée (dans Vercel env vars)
- ✅ Pas de secrets dans le code
- ✅ Pas de données sensibles dans les logs
- ✅ Email uniquement pour l'admin
- ✅ Validation des données

---

## 🐛 Si quelque chose ne fonctionne pas

1. Consulter les logs: `vercel logs`
2. Vérifier que `RESEND_API_KEY` est configurée
3. Redéployer: `vercel --prod`
4. Consulter [INSTALLATION.md](./INSTALLATION.md) - section Dépannage

---

## 📞 Documents de référence

| Document | Contenu |
|----------|---------|
| [RESUME_MODIFICATIONS.md](./RESUME_MODIFICATIONS.md) | Tous les changements effectués |
| [AUTOMATISATION.md](./AUTOMATISATION.md) | Architecture et APIs détaillées |
| [INSTALLATION.md](./INSTALLATION.md) | Guide complet d'installation |
| [PROCHAINES_ETAPES.md](./PROCHAINES_ETAPES.md) | Déploiement et tests |
| [EXPORT_EMAIL.md](./EXPORT_EMAIL.md) | Export des historiques |

---

## 🎯 Prochaines étapes

### Immédiat (aujourd'hui)
1. Créer compte Resend
2. Générer clé API
3. Valider la clé

### Court terme (cette semaine)
4. Pousser le code sur GitHub
5. Déployer sur Vercel
6. Configurer la clé API
7. Tester les automatisations

### Moyen terme (optionnel)
8. Configurer domaine personnalisé pour emails
9. Ajouter plus de filtres/rapports
10. Améliorer les designs d'email

---

**Version:** 1.0.0  
**Status:** ✅ Prêt pour production  
**Date:** 30 mars 2026

**Bon courage! 🚀**

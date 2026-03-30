# 🚕 Taxi Binchois Manager - Installation & Déploiement

## ✅ Installation locale

### Étape 1: Cloner ou préparer le projet

```bash
cd taxi-binchois-manager
```

### Étape 2: Installer les dépendances

```bash
npm install
```

Cela installera:
- `resend` - Service d'envoi d'emails
- `xlsx` - Génération de fichiers Excel
- `@vercel/node` - Fonctions Vercel
- `typescript` - Support TypeScript

### Étape 3: Vérifier les fichiers

```bash
npm run build  # Si vous avez un script build
```

## 🚀 Déploiement sur Vercel

### Prérequis

1. **Compte Vercel** - https://vercel.com
2. **Compte Resend** - https://resend.com (pour les emails)
3. **Git installé** - https://git-scm.com
4. **Clé API Resend**

### Étape 1: Configurer Resend

1. Créer un compte sur [resend.com](https://resend.com)
2. Générer une clé API
3. Copier la clé (elle ressemble à: `re_xxxxxxxxxxxxxxxxxxxxx`)

### Étape 2: Pousser sur GitHub

```bash
# Initialiser le repo git si nécessaire
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/VOTRE_USERNAME/taxi-binchois-manager.git
git push -u origin main
```

### Étape 3: Déployer sur Vercel

#### Option A: Via l'interface Vercel (Recommandé)

1. Aller sur https://vercel.com
2. Cliquer sur "Add New..." → "Project"
3. Importer le repo GitHub
4. Configurer:
   - **Framework Preset:** Other
   - **Build Command:** (laisser vide)
   - **Install Command:** `npm install`
5. Ajouter la variable d'environnement:
   - **Name:** `RESEND_API_KEY`
   - **Value:** (coller votre clé API Resend)
6. Cliquer sur "Deploy"

#### Option B: Via CLI Vercel

```bash
npm i -g vercel

# Login
vercel login

# Configurer les variables d'environnement
vercel env add RESEND_API_KEY
# (entrer la clé API Resend)

# Déployer
vercel --prod
```

### Étape 4: Vérifier le déploiement

Après le déploiement, vous verrez une URL comme:
```
https://taxi-binchois-manager.vercel.app
```

Vérifier que:
- ✅ L'app se charge
- ✅ Vous pouvez vous connecter
- ✅ L'admin dashboard fonctionne

## 📧 Configuration des emails

### Test d'envoi d'email

1. Créer un nouveau chauffeur
2. Se déconnecter en tant que chauffeur
3. Vérifier la boîte mail de l'admin

Les emails doivent arriver de:
- **From:** onboarding@resend.dev (domain de test Resend)
- **To:** email de l'admin

### Production - Domaine personnalisé (Optionnel)

Pour envoyer depuis votre propre domaine:

1. Dans Resend Dashboard
2. Ajouter votre domaine
3. Configurer les records DNS
4. Modifier `api/send-email.ts` et `api/send-daily-recap.ts`
5. Remplacer `from: 'onboarding@resend.dev'` par `from: 'noreply@votredomaine.com'`

## 📁 Fichiers Excel générés

Les fichiers Excel se mettent à jour automatiquement dans le dossier racine:

### Chauffeurs.xlsx
- Se remplit automatiquement quand:
  - Un chauffeur s'inscrit
  - Un chauffeur est créé par l'admin
  - Un chauffeur est modifié
- **Colonnes:** Nom, Prenom, Email, Role, Actif

### Vehicules.xlsx
- Se remplit automatiquement quand:
  - Un véhicule est ajouté
  - Un véhicule est modifié
- **Colonnes:** Immatriculation, Marque, Modele, Statut

## 🔍 Monitoring & Logs

### Voir les logs Vercel

```bash
# Voir les logs en temps réel
vercel logs

# Voir les logs spécifiques d'une fonction
vercel logs /api/send-daily-recap
```

### Dépannage

#### Erreur: "Cannot find module 'xlsx'"

```bash
npm install xlsx
vercel deploy --prod
```

#### Erreur: "RESEND_API_KEY not found"

1. Vérifier que la variable est configurée dans Vercel
2. Aller à Project Settings → Environment Variables
3. Ajouter: `RESEND_API_KEY=re_xxxxx`
4. Redéployer: `vercel --prod`

#### Les emails ne s'envoient pas

1. Vérifier que le `RESEND_API_KEY` est valide
2. Vérifier les logs: `vercel logs`
3. Tester l'API directement:

```bash
curl -X POST https://votre-app.vercel.app/api/send-daily-recap \
  -H "Content-Type: application/json" \
  -d '{
    "chauffeurName":"Test",
    "adminEmail":"admin@email.com",
    "totalRecette":100,
    "nbCourses":1
  }'
```

#### Les fichiers Excel ne se mettent pas à jour

1. Vérifier les logs: `vercel logs /api/sync-excel`
2. Vérifier que `xlsx` est installé localement: `npm list xlsx`
3. Redéployer: `npm install && vercel deploy --prod`

## 📊 Architecture

```
┌─────────────────────────────────────────┐
│        Frontend (index.html)            │
│        - Signup chauffeurs              │
│        - Dashboard admin                │
│        - Gestion véhicules              │
└──────────────┬──────────────────────────┘
               │
        ┌──────▼──────┐
        │  Data SDK   │ (Vercel KV/Storage)
        └──────┬──────┘
               │
    ┌──────────┼──────────┐
    │          │          │
    ▼          ▼          ▼
┌────────┐ ┌──────────┐ ┌──────────────┐
│ Signup │ │ Add User │ │ Add Vehicule │
│ Driver │ │  (Admin) │ │  (Admin)     │
└────────┘ └──────────┘ └──────────────┘
    │          │          │
    └──────────┼──────────┘
               │
    ┌──────────▼─────────────┐
    │  syncExcelFile(type)   │
    └──────────┬─────────────┘
               │
    ┌──────────▼──────────────────┐
    │  POST /api/sync-excel      │
    │  - Récupère les données    │
    │  - Génère Excel            │
    │  - Sauvegarde le fichier   │
    └────────────────────────────┘


┌──────────────────────────────┐
│   Chauffeur se déconnecte    │
└──────────┬───────────────────┘
           │
    ┌──────▼───────────────┐
    │  sendDailyRecap()    │
    └──────┬───────────────┘
           │
    ┌──────▼────────────────────────┐
    │  POST /api/send-daily-recap   │
    │  - Calcule recette du jour    │
    │  - Génère HTML email          │
    │  - Envoie via Resend          │
    └───────────────────────────────┘
```

## 📝 Checklist avant la production

- [ ] Compte Vercel créé
- [ ] Compte Resend créé
- [ ] Clé API Resend générée
- [ ] Git repo configuré
- [ ] `npm install` exécuté
- [ ] Pas d'erreurs TypeScript
- [ ] Déployé sur Vercel
- [ ] `RESEND_API_KEY` configurée dans Vercel
- [ ] Redéployé après config des env vars
- [ ] Test d'inscription chauffeur ✓
- [ ] Test de déconnexion chauffeur ✓
- [ ] Test d'ajout véhicule ✓
- [ ] Vérifier que Chauffeurs.xlsx s'est mis à jour ✓
- [ ] Vérifier que Vehicules.xlsx s'est mis à jour ✓
- [ ] Vérifier que l'email récapitulatif a été reçu ✓

## 🎯 Cas d'usage

### Inscription d'un nouveau chauffeur

```bash
1. Chauffeur remplit le formulaire d'inscription
2. Clique sur "S'inscrire"
3. SDK crée l'utilisateur en base
4. syncExcelFile('user') est appelé
5. POST /api/sync-excel reçoit les données
6. Chauffeurs.xlsx est généré/mis à jour
7. Chauffeur peut se connecter
```

### Ajout d'un véhicule par l'admin

```bash
1. Admin remplit: Immatriculation, Marque, Modèle
2. Clique sur "Enregistrer"
3. SDK crée le véhicule en base
4. syncExcelFile('vehicule') est appelé
5. POST /api/sync-excel reçoit les données
6. Vehicules.xlsx est généré/mis à jour
7. Véhicule apparaît dans la liste
```

### Déconnexion d'un chauffeur

```bash
1. Chauffeur clique sur "Déconnexion"
2. SDK crée une notification
3. sendDailyRecap() récupère les courses du jour
4. POST /api/send-daily-recap génère le mail HTML
5. Email est envoyé à l'admin via Resend
6. Chauffeur est déconnecté
7. Page revient à la connexion
```

## 📞 Support

Pour toute question:
1. Vérifier les logs: `vercel logs`
2. Consulter AUTOMATISATION.md
3. Vérifier la status Resend: https://status.resend.com

---

**Version:** 1.0.0  
**Dernière mise à jour:** 30 mars 2026

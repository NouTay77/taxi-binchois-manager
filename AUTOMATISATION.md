# Taxi Binchois Manager - Automatisation complète

## Résumé des modifications

Ce document décrit l'automatisation mise en place pour le système Taxi Binchois Manager.

### 🔧 Changements effectués

#### 1. **Suppression des imports Excel**

- Les fonctions `importData()`, `syncFromUrl()` et `exportToExcel()` ont été supprimées
- Les champs d'import de fichiers Excel ont été retirés de l'interface

#### 2. **Synchronisation automatique des fichiers Excel**

**Chauffeurs.xlsx** - Se met à jour automatiquement quand:

- ✅ Un nouveau chauffeur s'inscrit (via signup)
- ✅ Un nouveau chauffeur est créé par l'admin
- ✅ Un chauffeur existant est modifié

**Vehicules.xlsx** - Se met à jour automatiquement quand:

- ✅ Un nouveau véhicule est ajouté
- ✅ Un véhicule existant est modifié
- ✅ Les données sont supprimées

#### 3. **Envoi automatique des emails**

**Lors de la déconnexion d'un chauffeur:**

- 📧 Un récapitulatif journalier est envoyé à l'admin
- 📊 Contient: nom du chauffeur, total recette du jour, nombre de courses, détail de chaque course
- 📋 Le mail est formaté en HTML avec design professionnel

**Lors de l'export manuel:**

- 📧 Export des historiques courses/services avec pièce jointe Excel

### 📁 Structure des fichiers

```
api/
├── send-email.ts           # API pour envoyer des emails (export manuel)
├── send-daily-recap.ts     # API pour envoyer le récapitulatif journalier
└── sync-excel.ts           # API pour synchroniser les fichiers Excel

Chauffeurs.xlsx            # Se met à jour auto
Vehicules.xlsx             # Se met à jour auto
```

### 🚀 API Endpoints

#### 1. POST `/api/sync-excel`

Synchronise les fichiers Excel avec les données actuelles

**Payload:**

```json
{
  "type": "user" | "vehicule",
  "data": [
    { "nom": "Dupont", "prenom": "Jean", "email": "jean@email.com", ... },
    ...
  ]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Fichier Chauffeurs.xlsx mis à jour avec 5 enregistrements",
  "file": "Chauffeurs.xlsx"
}
```

#### 2. POST `/api/send-daily-recap`

Envoie le récapitulatif journalier du chauffeur

**Payload:**

```json
{
  "chauffeurName": "Jean Dupont",
  "chauffeurEmail": "jean@email.com",
  "adminEmail": "admin@email.com",
  "totalRecette": 250.50,
  "nbCourses": 8,
  "courses": [
    {
      "heure_prise_en_charge": "09:00",
      "commune_prise_en_charge": "Liège",
      "commune_fin_course": "Verviers",
      "prix": 25.50,
      "client_paye": true
    },
    ...
  ],
  "date": "30/03/2026"
}
```

#### 3. POST `/api/send-email`

Envoie un email avec pièce jointe (export manuel)

**Payload:**

```json
{
  "to": "email@example.com",
  "subject": "Sujet",
  "htmlContent": "<p>Corps HTML</p>",
  "attachmentName": "file.xlsx",
  "attachmentBase64": "base64_data"
}
```

### 🔄 Flux d'automatisation

```
┌─────────────────────────────────────────┐
│    Événement: Nouveau chauffeur         │
└──────────────┬──────────────────────────┘
               │
         ┌─────▼─────┐
         │ SDK Create │
         └─────┬─────┘
               │
    ┌──────────▼──────────┐
    │ syncExcelFile('user')│
    └──────────┬──────────┘
               │
    ┌──────────▼──────────────────────┐
    │ POST /api/sync-excel             │
    │ - Collecte tous les chauffeurs   │
    │ - Génère Chauffeurs.xlsx         │
    │ - Sauvegarde le fichier          │
    └──────────────────────────────────┘


┌─────────────────────────────────────────┐
│  Événement: Chauffeur se déconnecte     │
└──────────────┬──────────────────────────┘
               │
         ┌─────▼──────────┐
         │ logout()       │
         └─────┬──────────┘
               │
      ┌────────▼─────────┐
      │ Créer notification│
      └────────┬─────────┘
               │
   ┌───────────▼────────────┐
   │ sendDailyRecap()       │
   └───────────┬────────────┘
               │
  ┌────────────▼──────────────────────┐
  │ POST /api/send-daily-recap         │
  │ - Récupère les courses du jour     │
  │ - Calcule la recette totale        │
  │ - Envoie email récapitulatif HTML  │
  └───────────────────────────────────┘
```

### 📧 Exemple de mail reçu

**Sujet:** Récapitulatif journalier - Jean Dupont - 30/03/2026

**Contenu:**

```
Service terminé ✓
Jean Dupont

Récapitulatif du jour
├── Recette du jour: 250.50 €
└── Nombre de courses: 8

Détail des courses
┌────────┬──────────────────┬────────┐
│ Heure  │ Trajet           │ Montant│
├────────┼──────────────────┼────────┤
│ 09:00  │ Liège → Verviers │ 25.50€ │
│ 10:15  │ Spa → Liège      │ 32.00€ │
│ ...    │ ...              │ ...    │
└────────┴──────────────────┴────────┘
```

### 🛠️ Configuration requise

#### Variables d'environnement Vercel

Ajouter les variables d'environnement dans les paramètres Vercel:

```
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

**Obtenir la clé API:**

1. Créer un compte sur [resend.com](https://resend.com)
2. Générer une clé API
3. Copier-coller la clé dans les variables Vercel

### 📦 Dépendances

```json
{
  "dependencies": {
    "resend": "^3.0.0",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@vercel/node": "^3.0.0",
    "typescript": "^5.0.0"
  }
}
```

### 🚀 Déploiement

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer les variables d'environnement dans Vercel
vercel env add RESEND_API_KEY

# 3. Déployer
vercel deploy --prod
```

### ✅ Checklist après déploiement

- [X] Configurer `RESEND_API_KEY` dans Vercel
- [ ] Tester l'inscription d'un nouveau chauffeur
  - [ ] Vérifier que `Chauffeurs.xlsx` est mis à jour
  - [ ] Vérifier que le fichier contient les bonnes colonnes
- [ ] Tester l'ajout d'un véhicule
  - [ ] Vérifier que `Vehicules.xlsx` est mis à jour
- [ ] Tester la déconnexion d'un chauffeur
  - [ ] Vérifier que l'email récapitulatif est reçu par l'admin
  - [ ] Vérifier le format et le contenu du mail
- [ ] Tester l'export manuel
  - [ ] Export courses → pièce jointe Excel
  - [ ] Export services → pièce jointe Excel

### 📝 Notes importantes

1. **Permissions**: Seuls les admins reçoivent le récapitulatif journalier
2. **Synchronisation**: Les fichiers Excel se mettent à jour en temps quasi-réel
3. **Récupération des données**: Les courses du jour sont filtrées par date
4. **HTML email**: Les mails sont formatés en HTML pour une meilleure présentation
5. **Gestion d'erreur**: Les erreurs sont loggées dans la console serveur

### 🐛 Dépannage

**Problème:** Les fichiers Excel ne se mettent pas à jour

- Vérifier que l'API `/api/sync-excel` répond correctement
- Vérifier les logs Vercel: `vercel logs`
- Vérifier que `xlsx` est installé: `npm list xlsx`

**Problème:** Les emails ne sont pas reçus

- Vérifier que `RESEND_API_KEY` est configurée
- Vérifier que l'email admin existe
- Vérifier les logs: `vercel logs`
- Tester avec curl:

```bash
curl -X POST https://votre-domaine.vercel.app/api/send-daily-recap \
  -H "Content-Type: application/json" \
  -d '{"chauffeurName":"Test","adminEmail":"admin@email.com","totalRecette":100,"nbCourses":1}'
```

**Problème:** Erreur "Cannot find module 'xlsx'"

```bash
npm install xlsx
vercel deploy --prod
```

### 🔗 Fichiers modifiés

1. `index.html` - Ajout des fonctions helper et modification des événements
2. `api/send-email.ts` - Support pour HTML content
3. `api/sync-excel.ts` - Nouvelle API pour synchroniser Excel
4. `api/send-daily-recap.ts` - Nouvelle API pour les récapitulatifs
5. `package.json` - Ajout de la dépendance xlsx

### 📊 Fichiers Excel générés

#### Chauffeurs.xlsx

| Nom    | Prenom | Email          | Role      | Actif |
| ------ | ------ | -------------- | --------- | ----- |
| Dupont | Jean   | jean@email.com | chauffeur | Oui   |

#### Vehicules.xlsx

| Immatriculation | Marque  | Modele | Statut |
| --------------- | ------- | ------ | ------ |
| AB-123-CD       | Peugeot | 208    | libre  |

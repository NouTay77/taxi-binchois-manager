# 🚀 Étapes suivantes - Taxi Binchois Manager

## Immédiatement à faire

### 1. Créer un compte Resend (⏱️ 5 minutes)

1. Aller sur https://resend.com
2. Créer un compte avec votre email
3. Confirmer l'email
4. Aller à "API Keys"
5. Cliquer "Create API Key"
6. Copier la clé (commence par `re_`)

### 2. Créer un compte Vercel (⏱️ 5 minutes)

1. Aller sur https://vercel.com
2. Créer un compte avec GitHub
3. Autoriser l'accès à vos repos

### 3. Pousser le code sur GitHub (⏱️ 5 minutes)

```bash
cd "c:\Users\NouTay\Documents\taxi-binchois-manager"
git add .
git commit -m "Automatisation complète - Chauffeurs et Vehicules Excel + Emails journaliers"
git push origin main
```

### 4. Déployer sur Vercel (⏱️ 5 minutes)

1. Aller sur https://vercel.com/new
2. Importer le repo `taxi-binchois-manager`
3. Framework: **Other**
4. Build Command: **(laisser vide)**
5. Install Command: `npm install`
6. Output Directory: **(laisser vide)**
7. Cliquer "Deploy"

### 5. Configurer l'API Key Resend (⏱️ 2 minutes)

Après le déploiement:

1. Aller à "Project Settings"
2. Aller à "Environment Variables"
3. Ajouter une nouvelle variable:
   - Name: `RESEND_API_KEY`
   - Value: (coller votre clé `re_...`)
4. Cliquer "Save"
5. Aller à "Deployments"
6. Cliquer le bouton "..." sur le déploiement
7. Cliquer "Redeploy"

### 6. Tester l'application (⏱️ 10 minutes)

Une fois redéployée:

#### Test 1: Inscription chauffeur
```
1. Aller à l'URL Vercel
2. Cliquer "S'inscrire (Chauffeur)"
3. Remplir: Nom, Prénom, Email, Mot de passe
4. Cliquer "S'inscrire"
5. ✓ Vérifier que Chauffeurs.xlsx a été créé/mis à jour
```

#### Test 2: Se connecter et déconnecter
```
1. Se connecter avec le nouveau chauffeur
2. Dashboard s'affiche
3. Cliquer "Déconnexion"
4. ✓ Vérifier que l'email récapitulatif a été reçu par l'admin
   (Chercher l'email avec sujet "Récapitulatif journalier")
```

#### Test 3: Ajouter un véhicule (admin)
```
1. Créer un compte admin (Setup)
   - Email: votre@email.com
   - Mot de passe: au moins 6 caractères
2. Se connecter
3. Aller à "Véhicules" 
4. Cliquer "Ajouter"
5. Remplir: Immatriculation, Marque, Modèle
6. Cliquer "Enregistrer"
7. ✓ Vérifier que Vehicules.xlsx a été mis à jour
```

#### Test 4: Export historiques (manuel)
```
1. En tant qu'admin, aller à "Historique"
2. Descendre à "Gestion des données"
3. Cliquer "Exporter par mail" (Courses ou Services)
4. ✓ Vérifier que l'email a été reçu avec fichier Excel joint
```

## Configuration optionnelle

### Domaine personnalisé pour les emails (⏱️ 15 minutes)

Au lieu d'envoyer depuis `onboarding@resend.dev`, utiliser votre domaine:

1. **Dans Resend:**
   - Dashboard → Domains
   - Ajouter votre domaine
   - Configurer les records DNS (CNAME, SPF, DKIM)

2. **Dans le code:**
   - Modifier `api/send-email.ts` ligne 4
   - Changer `from: 'onboarding@resend.dev'` en `from: 'noreply@votredomaine.com'`
   - Modifier `api/send-daily-recap.ts` ligne 16
   - Changer `from: 'onboarding@resend.dev'` en `from: 'noreply@votredomaine.com'`
   - Redéployer: `git push`, puis redéployer dans Vercel

## Monitoring & Maintenance

### Voir les logs

```bash
# Voir tous les logs récents
vercel logs

# Voir les logs d'une fonction API
vercel logs /api/sync-excel
vercel logs /api/send-daily-recap
vercel logs /api/send-email
```

### Mettre à jour le code

```bash
# Faire vos modifications
# Puis:
git add .
git commit -m "Description des changements"
git push origin main
# → Redéploiement automatique sur Vercel !
```

## Dépannage rapide

### Problème: Les emails ne s'envoient pas
- Vérifier que `RESEND_API_KEY` est configurée dans Vercel
- Vérifier que le chauffeur a au moins 1 course du jour
- Consulter les logs: `vercel logs`

### Problème: Chauffeurs.xlsx ne se met pas à jour
- Vérifier la console: `vercel logs /api/sync-excel`
- Vérifier que `xlsx` est installé: `npm list xlsx`
- Redéployer: `vercel deploy --prod`

### Problème: La page d'inscription échoue
- Vérifier les logs: `vercel logs`
- Vérifier que la limite de 999 données n'est pas atteinte
- Vérifier que l'email n'existe pas déjà

## Checkpoints clés

- [ ] Clé API Resend générée et configurée
- [ ] Code poussé sur GitHub
- [ ] Déployé sur Vercel
- [ ] `RESEND_API_KEY` configurée dans Vercel
- [ ] Re-déployé après config des env vars
- [ ] Test inscription chauffeur ✓
- [ ] Test déconnexion chauffeur ✓
- [ ] Chauffeurs.xlsx créé/mis à jour ✓
- [ ] Email récapitulatif reçu ✓
- [ ] Test ajout véhicule ✓
- [ ] Vehicules.xlsx créé/mis à jour ✓
- [ ] Export manuel fonctionne ✓

## Support & Aide

### Documentation
- [AUTOMATISATION.md](./AUTOMATISATION.md) - Architecture complète
- [INSTALLATION.md](./INSTALLATION.md) - Guide détaillé
- [RESUME_MODIFICATIONS.md](./RESUME_MODIFICATIONS.md) - Tous les changements

### Services support
- **Vercel:** https://vercel.com/support
- **Resend:** https://resend.com/docs
- **Node.js:** https://nodejs.org/docs

### Logs & Debugging
```bash
# Logs en temps réel
vercel logs --follow

# Logs d'une fonction spécifique
vercel logs /api/send-daily-recap --follow

# Logs avec filtrage
vercel logs | grep "error"
```

## Timeline recommandée

| Temps | Tâche | Durée |
|------|-------|-------|
| J+0 | Créer compte Resend | 5 min |
| J+0 | Créer compte Vercel | 5 min |
| J+0 | Pousser code GitHub | 5 min |
| J+0 | Déployer sur Vercel | 5 min |
| J+0 | Configurer RESEND_API_KEY | 2 min |
| J+0 | Tests complets | 15 min |
| J+1 | Monitoring & ajustements optionnels | Variable |

**Total: ~40 minutes** pour être en production

---

**Bonne chance! 🚀**

Pour toute question, consultez les fichiers de documentation ou les logs Vercel.

# Taxi Binchois Manager - Export par Mail

## Changements effectués

### Suppression des imports Excel
- Les fonctions `importData()`, `syncFromUrl()` et `exportToExcel()` ont été supprimées
- Les entrées d'import Excel pour les courses et services ont été retirées de l'interface
- La prise en charge des fichiers `.xlsx/.xls` n'est plus disponible en import

### Nouveau système d'export automatique par mail
- Les historiques des **courses** et **services** peuvent maintenant être exportés automatiquement par mail
- Les fichiers Excel sont générés et envoyés directement à `tayanenourrdine@gmail.com`
- Les mails sont envoyés via le service **Resend**

## Configuration requise

### Pour déployer sur Vercel

1. **Installer Resend API Key:**
   - Créer un compte sur [resend.com](https://resend.com)
   - Générer une clé API
   - Ajouter la variable d'environnement `RESEND_API_KEY` dans les variables Vercel

2. **Configurer les variables d'environnement:**
   ```
   RESEND_API_KEY=your_resend_api_key_here
   ```

3. **Installer les dépendances:**
   ```bash
   npm install
   ```

4. **Déployer:**
   ```bash
   vercel deploy
   ```

## Utilisation

### Pour exporter les historiques par mail

1. Dans le dashboard admin, section "Gestion des données"
2. Cliquer sur "Exporter par mail" pour **Historique courses** ou **Historique services**
3. Un fichier Excel sera généré et envoyé automatiquement à `tayanenourrdine@gmail.com`

### Fichiers générés

- **Historique Courses:** `Historique_Courses.xlsx`
  - Colonnes: Chauffeur, Prise en charge, Commune départ, Fin course, Commune arrivée, Prix, Payé, Montant impayé

- **Historique Services:** `Historique_Services.xlsx`
  - Colonnes: Chauffeur, Début service, Fin service, Km début, Km fin

## API Endpoint

**POST** `/api/send-email`

### Payload
```json
{
  "to": "email@example.com",
  "subject": "Sujet du mail",
  "message": "Corps du message",
  "attachmentName": "Historique_Courses.xlsx",
  "attachmentBase64": "base64_encoded_file_content"
}
```

### Response
```json
{
  "success": true,
  "messageId": "email_id_from_resend"
}
```

## Architecture

- **Frontend:** HTML5 + Tailwind CSS + Lucide Icons
- **Backend API:** Vercel Functions (Node.js + TypeScript)
- **Service Email:** Resend
- **Base de données:** Vercel KV/Storage

## Notes

- Les droits d'accès à cet export sont limités à l'admin
- Les fichiers Excel sont générés dynamiquement sans stockage local
- Les mails sont envoyés de manière sécurisée via Resend

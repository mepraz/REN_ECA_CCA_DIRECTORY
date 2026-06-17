# Google Drive OAuth Setup

1. Start the backend:

   ```powershell
   npm.cmd run dev
   ```

2. Sign in to the portal as `MAIN_ADMIN`.

3. Open this URL in the same browser:

   ```text
   http://localhost:5000/api/google/auth
   ```

4. Complete the Google consent screen.

5. The callback saves `GOOGLE_REFRESH_TOKEN` into `backend/.env`.

6. Restart the backend before uploading event images.

Drive uploads are enabled when all of these env vars exist:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:5000/api/google/callback
GOOGLE_DRIVE_FOLDER_ID=
GOOGLE_REFRESH_TOKEN=
```

Images are saved in two places when Drive is configured:

- A local copy is written to `GOOGLE_DRIVE_UPLOAD_DIR`.
- The uploaded Drive file is created inside `GOOGLE_DRIVE_FOLDER_ID`.

The connected Google account must be able to add files to that Drive folder. If the folder is in a Shared Drive, the account still needs write access there.

To check the connection, sign in as `MAIN_ADMIN` and open:

```text
http://localhost:5000/api/google/status
```

The response includes `folder.name`, `folder.canAddChildren`, or `folderError`.

---
tags: [build-guide, mobile]
step: 53
---
# Step 53: Test Unc as an app on your phone, for free (session 44)

**Why this way:** [[ADR-053 Free phone testing with a tunnel]] · background: [[Publishing as an App]]

**Is it optional?** Yes. It's only for testing: nothing is published, nothing is paid, and your PC is the server (it must stay on, and the address changes every time). It matters because it's the closest you can get to the real app without paying: an installed icon, full screen, and on Android a real `.apk`.

## What you need (all free)
- Your PC with Unc (folder `C:\Users\a.baqer\Unc-APP`, branch `main` or `claude/vibrant-edison-r9o798`).
- **cloudflared**, Cloudflare's free tunnel program. No account needed for quick tunnels. Install it once in a Command Prompt:
  ```
  winget install --id Cloudflare.cloudflared
  ```
  Close and reopen the Command Prompt afterwards so it knows the new command.
  The first time you use `winget`, it may ask **"Do you agree to all the source agreements terms? [Y] Yes [N] No"** about the `msstore` source (the Microsoft Store's terms, and sending your country code). That's Windows' own installer asking once; type `Y` and press Enter. To skip that question, use the community source only:
  ```
  winget install --id Cloudflare.cloudflared --source winget
  ```

## 1. Run Unc the way it runs online (window 1)
Stop `npm run live` first if it's running (click it, **Ctrl + C**, then `Y`): it uses the same port. Then:
```
cd Unc-APP
npm run build
npm run seed
npm start
```
- Check the line before the `>` says `C:\Users\a.baqer\Unc-APP`. A new Command Prompt always starts in `C:\Users\a.baqer`, and there npm says *"Could not read package.json"* ([[Mistakes and Fixes#M14]]). If `cd Unc-APP` says it can't find the path, type `dir` to see where the folder is.
- `npm run build` makes the finished website (`client/dist`), which the server then serves on port 4000.
- `npm run seed` is optional: it adds the demo members (password `Password123`), so you can log in straight away on the phone.
- Wait for `Unc API listening on http://localhost:4000`, and the window must **stay busy** (no new `>` prompt). If it says *"Could not start Unc: Port 4000 is already in use"*, another Unc window (`npm run live`, `npm run dev`) is still running: stop that one with Ctrl + C first ([[Mistakes and Fixes#M103]]). Can't find that window? Use another port instead (two separate lines in Command Prompt):
  ```
  set PORT=4001
  npm start
  ```
  and in step 2 use `cloudflared tunnel --url http://localhost:4001`. To see what holds port 4000: `netstat -ano | findstr :4000` (the last number is the program's PID; `taskkill /PID <that number> /F` stops it).

## 2. Give it a public https address (window 2)
```
cloudflared tunnel --url http://localhost:4000
```
After a few seconds it prints an address like `https://something-words.trycloudflare.com`. Copy it. Keep both windows open while testing.

## 3. Install it on your phone
- **Android (Chrome):** open the address → menu ⋮ → **Install app** (or "Add to Home screen").
- **iPhone (Safari):** open the address → Share → **Add to Home Screen**.

Unc now opens from its own icon, full screen, like an app. Log in as `buyer@demo.local` or `vendor@demo.local`.

## 4. (Android only) A real app file, still free
1. On your PC open **https://www.pwabuilder.com**, paste the trycloudflare address, press **Start**.
2. **Package for stores** → **Android** → **Generate** → download the zip.
3. Inside the zip is an `.apk` file. Send it to your Android phone (email, Google Drive or a cable). Open it and allow "install unknown apps" when asked.

That is the same kind of package that would go to Google Play later. Two limits:
- this test app shows a thin address bar at the top, because the domain isn't verified (`assetlinks.json` comes with a real domain);
- it only works while this tunnel address is running.

## Limits of this free test
- Your PC must stay on with both windows open. Closing them stops the app.
- The address is **different every time** you start cloudflared, so you install again (and make a new `.apk`) each time.
- Anyone with the address can open it, so share it only with testers. Use demo data, not real ID documents.
- Phone push notifications need push keys (`VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` in `.env`, see [[Push Notifications]]); without them everything else works.
- iPhone: a real App Store-style app can't be tested for free without a Mac; the Home Screen install is the free iPhone test.

## When you're done
Window 2: **Ctrl + C** (the address stops working). Window 1: **Ctrl + C**. Go back to `npm run live` if you like.

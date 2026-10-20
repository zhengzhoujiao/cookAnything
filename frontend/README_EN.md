# ElectronicRecipe frontend

Vue 3, TypeScript, Tailwind CSS and Three.js. The frontend reuses [liu-ziting/what-to-eat](https://github.com/liu-ziting/what-to-eat), originally authored by liuziting. Upstream licensing is pending verification; see [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md).

Use Node.js 22. Run `npm ci`, `npm run dev`, or `npm run build` in this directory. See the root README for Python/MongoDB setup and administrator initialization.

Only public routing settings belong in frontend environment variables. Provider credentials and model settings are managed through the authenticated backend administration page at `/JManage`. Never place provider credentials in VITE-prefixed variables. Older browser configuration stores are removed at application startup.

See [DEPLOY.md](../DEPLOY.md) for standalone deployment, HTTPS and public endpoint access controls.

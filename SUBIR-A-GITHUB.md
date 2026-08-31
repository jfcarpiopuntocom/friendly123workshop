# Subir este laboratorio a GitHub (Pages)

Paquete: **friendly-123-lab-1.7.53**  
Shell: `f123-shell-v166`  
Fecha: 31 de agosto de 2026

La app se sirve **desde `docs/`**. En GitHub Pages: Settings → Pages → Deploy from a branch → folder `/docs`.

## Pasos

1. Crea un repositorio vacío.
2. Descomprime este zip. Debe quedar `friendly-123-lab/docs/index.html`.
3. En esa carpeta:

```
git init
git add .
git commit -m "friendly-123 lab 1.7.53 shell v166"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
git push -u origin main
```

4. Pages: source = `main`, folder = `/docs`.
5. Si un aparato tenía un Service Worker viejo, recarga dos veces o usa incógnito. Shell nuevo: `f123-shell-v166`.

Hashes en `INTEGRIDAD-2026-08-31.txt`.

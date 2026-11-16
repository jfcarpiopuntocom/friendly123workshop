# friendly-123 assembled v783 — entrada compartida

Orden de JFC, 16 noviembre 2026: todo el coding de esta misión pasa al repositorio friendly123workshop, organizado en subcarpetas. Los paths de un contenedor no son una entrega. Código y evidencia deben quedar en commits accesibles; Notion enlaza esos commits.

Este primer checkpoint rescata exactamente el trabajo Team revisado que otras sesiones no podían descargar:

- [Parche exacto revisado](checkpoints/team-reviewed/candidate.patch): SHA256 `987b1d2c83666b7729c4c31a36a41d12a3ff47bc16e40639a4b6e033c811fa62`.
- [Fuentes importadas y licencias](checkpoints/team-reviewed/imported-sources.tar.gz): SHA256 `04e799e4271c2ffbde84058cbee992115555854c4bfb8ed9aa8b4171ae776817`.
- [Procedencia y hashes](checkpoints/team-reviewed/provenance.json), [explicación de implementación](checkpoints/team-reviewed/README.md), [evidencia original](checkpoints/team-reviewed/evidence).

Base del parche: `friendly-123@f6276adac490f0610e130afec0615f98acd4b32b`. No aplicarlo sobre v781. La base histórica está archivada en el repo privado de injertos; la siguiente entrega añade la candidata reconstruida completa, para que no dependa de reconstruir ese archivo ni de otro entorno.

Qué acredita este checkpoint: 71 pruebas focales y tres Chromium, con dos carreras de ACK Team corregidas y revisión independiente. Los logs son originales sintéticos; extensiones .txt para conservarlos pese al ignore *.log del repo. No contiene licencias, PIN ni claves reales.

Estado: código de laboratorio, sin despliegue ni activación de clientes. NO migración completa. La continuación del emisor WS y relay privado sigue en curso; dos pruebas del relay todavía están rojas y NO forman parte de este checkpoint revisado. El objetivo siguiente es navegador según la orden vigente: PWA/Workbox aplazados.

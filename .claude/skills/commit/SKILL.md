---
name: commit
description: Crea un commit de git siguiendo las reglas del proyecto. Solo se usa cuando el usuario escribe /commit.
disable-model-invocation: true
---

# /commit

Si el usuario escribió algo después de /commit, úsalo como pista para el mensaje: $ARGUMENTS

## Pasos
1. Ejecuta `git status` y `git diff` para ver qué cambió.
2. Revisa que entre los cambios no haya claves ni archivos `.env*`. Si los hay, detente y avisa.
3. Agrega solo los archivos relacionados con el cambio (`git add <archivo>`). No uses `git add .` sin revisar.
4. Escribe el mensaje en español con el formato `tipo(alcance): descripción corta`.
   - Tipos: feat, fix, docs, test, refactor, chore, style.
   - Si el cambio pertenece a un ticket, su id va al inicio: `[E2-T03] feat(dominio): función que calcula si una sesión cabe`.
5. Muestra el mensaje y la lista de archivos antes de confirmar.
6. Ejecuta `git commit` y muestra el resultado con `git log --oneline -1`.

No hagas `git push` a menos que el usuario lo pida.
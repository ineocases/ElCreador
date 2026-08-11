# El Creador

Juego de simulación de carrera de creador de contenido, ejecutable directamente en el navegador.

## Cómo ejecutarlo

Por usar módulos ES (`type="module"`), algunos navegadores bloquean los archivos si se abre `index.html` directamente mediante `file://`.

La forma recomendada es levantar un servidor local desde la carpeta:

```bash
python -m http.server 8000
```

Luego abrir:

http://localhost:8000

También puedes usar VS Code + Live Server.

## Estructura

- `index.html`: entrada
- `css/styles.css`: interfaz
- `js/app.js`: aplicación principal
- `js/router.js`: router base
- `js/utils.js`: utilidades
- `engine/`: estado, algoritmo y eventos
- `components/`: componentes reutilizables
- `data/`: datos JSON

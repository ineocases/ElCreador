# Integración v16 → mejoras de setup y correcciones

Se incorporaron al proyecto base de mejoras, sin reemplazar su arquitectura ni sus correcciones de código:

- `data/creators.js`: dataset completo de 329 creadores de v16.
- `data/eventsExpansion.js`: los 20 eventos de v16 (ya coincidían con la base).
- `data/generator/formats.js`: formatos de v16.
- `data/generator/topics.js`: temas/nichos de v16.
- `data/items/items.js`: equipamiento de v16.

Se conservaron los sistemas/código del proyecto de destino, incluyendo sus correcciones de setup, sponsors, simulación, colaboraciones, rivalidades, noticias y guardado.

La propiedad `esCoscuArmyEligible` del proyecto de destino se conserva como metadato calculado a partir del país y no altera el dataset de creadores.

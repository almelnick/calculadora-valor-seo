# Calculadora de valor SEO

Herramienta gratuita y open source para proyectar **cuánto vale el canal orgánico de un
sitio web**: visitas, pedidos o leads y el valor mensual en tres escenarios, con el costo
equivalente de comprar ese mismo resultado en Google Ads.

**Pruébala en vivo:** [alanmelnick.com/herramientas/calculadora-valor-seo](https://www.alanmelnick.com/herramientas/calculadora-valor-seo) ·
[English version](en/README.md) (carpeta `en/`, en USD)

## Qué calcula

```
Volumen de búsqueda × CTR por posición × ajuste AI Overviews × conversión × valor
= Valor SEO / mes
```

- **Dos modos**: ecommerce (pedidos × ticket promedio) y leads/servicios (leads × valor de lead).
- **Modo incremental**: si ya posicionas, valoriza solo el tráfico de subir de posición —
  no el canal completo. Es la diferencia entre vender humo y proyectar honesto.
- **Ajuste por AI Overviews**: descuento configurable (−15% a −40%) según tu mix de
  keywords, porque el CTR orgánico cae en búsquedas con respuesta de IA.
- **Tres escenarios**: conservador (−40%), base y optimista (+40%).
- **Rampa de maduración**: acumulado a 12 meses asumiendo que el canal alcanza el 100%
  del valor en el mes 9 (rampa lineal).
- **Costo equivalente en Ads**: visitas × CPC (ecommerce) o leads × CPL (servicios) —
  el valor de reemplazo del orgánico.
- **Compartir**: la proyección se copia como texto o como URL con los parámetros incluidos.

## Uso

Es un sitio estático sin dependencias ni build: abre `index.html` en el navegador, o
sírvelo con cualquier hosting estático (Vercel, Netlify, GitHub Pages).

```bash
git clone https://github.com/almelnick/calculadora-valor-seo.git
cd calculadora-valor-seo
open index.html
```

## Estructura

| Archivo | Qué hace |
|---|---|
| `index.html` | Página completa: formulario + panel de resultados |
| `app.js` | Lógica pura (`calculateSEO`) + cableado DOM, JS vanilla |
| `styles.css` | Design tokens + estilos, CSS nativo sin frameworks |

La lógica de cálculo (`calculateSEO`) está separada del DOM: puedes importarla o
copiarla para usar la proyección en otro contexto.

## Supuestos y honestidad

Los CTR por posición vienen de curvas públicas de la industria (posición 1 ≈ 27%,
posición 2 ≈ 15%, etc.) y son promedios: tu SERP puede ser distinta. La estimación es
referencial y **no constituye una garantía de resultados** — el disclaimer completo está
en la propia herramienta. Si quieres la proyección con tu data real (Search Console,
GA4, tu cuenta de Ads), [agenda un diagnóstico gratuito](https://www.alanmelnick.com/diagnostico).

## Autor

**[Alan Melnick](https://www.alanmelnick.com)** — consultor de marketing digital en
Chile y LATAM: [SEO](https://www.alanmelnick.com/servicios/seo),
[Google Ads](https://www.alanmelnick.com/servicios/google-ads),
[Meta Ads](https://www.alanmelnick.com/servicios/meta-ads) y
[growth marketing](https://www.alanmelnick.com/servicios/growth-marketing).
[LinkedIn](https://www.linkedin.com/in/almelnick/)

## Licencia

[MIT](LICENSE) — úsala, modifícala y compártela libremente. Si la usas en tu sitio,
una mención con enlace es bienvenida.

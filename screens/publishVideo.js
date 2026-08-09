// screens/publishVideo.js

import { renderHeaderHud } from "../components/HeaderHud.js";
import { gameState } from "../engine/gameState.js";
import {
  generarVideos,
  procesarPublicacionVideo
} from "../engine/videoSystem.js";


export function renderPublishVideo(el) {

  const container =
    el || document.createElement("div");

  if (!el) {

    container.id = "publishScreen";

  }


  /*
   * Generamos las 6 opciones.
   */

  const videos =
    generarVideos(gameState.player);


  const gratuitos =
    videos.filter(video => video.tipo === "gratis");

  const medios =
    videos.filter(video => video.tipo === "medio");

  const caros =
    videos.filter(video => video.tipo === "caro");


  function renderVideoCard(video) {

    return `

      <div
        class="video-option"
        style="
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 18px;
          margin-bottom: 12px;
        "
      >

        <div
          style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:10px;
          "
        >

          <div>

            <h2
              style="
                margin:0 0 7px;
                color:white;
              "
            >

              ${video.titulo}

            </h2>

            <div
              style="
                color:var(--text-muted);
                font-size:0.9rem;
              "
            >

              ${video.formato}
              ·
              ${video.tema}

            </div>

          </div>


          <div
            style="
              text-align:right;
              white-space:nowrap;
            "
          >

            <strong
              style="
                color:
                ${
                  video.costo === 0
                    ? "#43d17a"
                    : "var(--accent-red)"
                };
              "
            >

              ${
                video.costo === 0
                  ? "GRATIS"
                  : "$" + video.costo.toLocaleString()
              }

            </strong>

          </div>

        </div>


        <div
          style="
            margin-top:14px;
            display:flex;
            justify-content:space-between;
            align-items:center;
          "
        >

          <span
            style="
              color:var(--text-muted);
              font-size:0.85rem;
            "
          >

            Riesgo:
            ${"⭐".repeat(
              Math.max(
                1,
                Math.min(
                  5,
                  Math.ceil(video.riesgo / 20)
                )
              )
            )}

          </span>


          <button
            class="select-video"
            data-video-id="${video.id}"
            style="
              padding:10px 16px;
              background:var(--accent-red);
              color:white;
              border:none;
              border-radius:8px;
              font-weight:bold;
              cursor:pointer;
            "
          >

            Elegir

          </button>

        </div>

      </div>

    `;

  }


  container.innerHTML = `

    ${
      typeof renderHeaderHud === "function"
        ? renderHeaderHud()
        : ""
    }


    <div
      style="
        max-width:700px;
        margin:30px auto;
        padding:25px;
        color:#fff;
      "
    >

      <div
        style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-bottom:25px;
        "
      >

        <div>

          <h1
            style="
              font-family:var(--font-heading);
              color:var(--accent-red);
              margin:0;
              text-transform:uppercase;
            "
          >

            📹 Elegí tu próximo video

          </h1>

          <p
            style="
              color:var(--text-muted);
              margin-top:8px;
            "
          >

            El juego genera las ideas según tu nicho.

          </p>

        </div>


        <a
          href="#dashboard"
          style="
            color:var(--text-muted);
            text-decoration:none;
          "
        >

          ← Volver

        </a>

      </div>


      ${
        gratuitos.length
          ? `

            <h3
              style="
                color:#43d17a;
                text-transform:uppercase;
              "
            >

              🟢 Gratis

            </h3>

            ${gratuitos.map(renderVideoCard).join("")}

          `
          : ""
      }


      ${
        medios.length
          ? `

            <h3
              style="
                color:#f0b429;
                text-transform:uppercase;
                margin-top:30px;
              "
            >

              🟡 Producción media

            </h3>

            ${medios.map(renderVideoCard).join("")}

          `
          : ""
      }


      ${
        caros.length
          ? `

            <h3
              style="
                color:var(--accent-red);
                text-transform:uppercase;
                margin-top:30px;
              "
            >

              🔴 Gran producción

            </h3>

            ${caros.map(renderVideoCard).join("")}

          `
          : ""
      }

    </div>

  `;


  /*
   * Botones de selección.
   */

  const buttons =
    container.querySelectorAll(".select-video");


  buttons.forEach(button => {

    button.addEventListener("click", () => {

      const id =
        button.dataset.videoId;

      const video =
        videos.find(
          item => item.id === id
        );


      if (!video) {

        alert("No se pudo encontrar el video.");

        return;

      }


      /*
       * Comprobar dinero.
       */

      if (
        video.costo >
        gameState.player.dinero
      ) {

        alert(
          "No tenés suficiente dinero para producir este video."
        );

        return;

      }


      /*
       * Pagar producción.
       */

      gameState.player.dinero -=
        video.costo;


      /*
       * Publicar.
       *
       * El título ya viene generado
       * por el sistema.
       */

      const resultado =
		procesarPublicacionVideo(
        video.titulo,
        video.formato,
        video.tema,
        video
	 );


      /*
       * Guardamos información adicional
       * para la pantalla de resultados.
       */

      gameState.lastVideo = video;

      gameState.lastVideoResult =
        resultado;


      /*
       * Ir al resultado.
       */

      window.location.hash =
        "#videoResult";

    });

  });


  return container;

}


export const publishVideoScreen = {

  render: renderPublishVideo

};


export default publishVideoScreen;
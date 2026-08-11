// js/admin.js
async function checkAdmin(){
  auth.onAuthStateChanged(async user=>{
    if(!user) return;
    const doc = await db.collection("users").doc(user.uid).get();
    if(!doc.exists || !doc.data().admin){
      document.getElementById("admin-gate").innerHTML = "❌ No sos admin.";
      return;
    }
    loadEvents();
  });
}
async function addEvent(){
  await db.collection("events").add({
    titulo: document.getElementById("ev-titulo").value,
    texto: document.getElementById("ev-texto").value,
    tipo: document.getElementById("ev-tipo").value,
    nichos: ["*"],
    opciones: [
      { label: document.getElementById("ev-op1").value, efectos:{heat:+5} },
      { label: document.getElementById("ev-op2").value, efectos:{heat:-5} }
    ]
  });
  alert("✅ Evento guardado");
  loadEvents();
}
async function loadEvents(){
  const snap = await db.collection("events").get();
  const list = document.getElementById("ev-list");
  list.innerHTML = snap.docs.map(d=>`<div>📌 ${d.data().titulo}</div>`).join("") || "No hay eventos todavía.";
}
checkAdmin();

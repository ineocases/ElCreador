// screens/store.js
import gameState from '../engine/gameState.js';
import saveManager from '../engine/saveManager.js';

// Lista estática de mejoras (Podés agregar más luego)
const storeItems = [
    { id: 'luces', name: 'Aro de Luz RGB', cost: 100, qualityBoost: 0.1 },        // +10% vistas
    { id: 'microfono', name: 'Micrófono Condenser', cost: 300, qualityBoost: 0.2 }, // +20% vistas
    { id: 'camara', name: 'Cámara 4K', cost: 600, qualityBoost: 0.3 },            // +30% vistas
    { id: 'pc', name: 'PC Master Race', cost: 1500, qualityBoost: 0.5 }           // +50% vistas
];

export const storeScreen = {
    render() {
        const container = document.getElementById('storeContainer');
        const moneyDisplay = document.getElementById('storeMoney');
        
        if (!container) return;
        
        // 1. Mostrar saldo actual
        if (moneyDisplay) {
            moneyDisplay.innerText = `Saldo disponible: US$${gameState.player.money}`;
        }
        
        container.innerHTML = ''; // Limpiamos la tienda

        // 2. Generamos los botones de compra
        storeItems.forEach(item => {
            // Si el jugador ya tiene el objeto en su inventario, no lo mostramos (o pasamos de largo)
            if (gameState.inventory[item.id]) return; 

            // Creamos la tarjeta del producto
            const itemDiv = document.createElement('div');
            itemDiv.className = 'store-item'; // Dale estilo con CSS a esta clase
            itemDiv.innerHTML = `
                <h4>${item.name}</h4>
                <p>Costo: US$${item.cost}</p>
                <p>Mejora tus vistas en: +${item.qualityBoost * 100}%</p>
            `;

            const btnBuy = document.createElement('button');
            
            // Verificamos si tiene saldo suficiente
            if (gameState.player.money >= item.cost) {
                btnBuy.innerText = 'Comprar equipo';
                btnBuy.onclick = () => {
                    // Descontar plata
                    gameState.player.money -= item.cost;
                    
                    // Guardar en el inventario del estado
                    gameState.inventory[item.id] = true;
                    
                    // Aplicar la mejora permanente al canal
                    gameState.player.quality += item.qualityBoost;
                    
                    // Guardar partida instantáneamente y recargar la tienda
                    saveManager.saveLocal();
                    this.render();
                };
            } else {
                btnBuy.innerText = 'No alcanza';
                btnBuy.disabled = true; // Botón apagado
            }

            itemDiv.appendChild(btnBuy);
            container.appendChild(itemDiv);
        });
        
        // 3. Botón para salir de la tienda
        const btnBack = document.createElement('button');
        btnBack.innerText = "Volver al Panel";
        btnBack.style.marginTop = "20px";
        btnBack.onclick = () => window.location.hash = '#dashboard';
        
        container.appendChild(btnBack);
    }
};
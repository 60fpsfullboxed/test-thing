/**
 * ESP Emergency Fix
 * This script forces ESP to work regardless of game state
 */

(function() {
    console.log('[ESP FIX] Applying emergency ESP fix...');
    
    // Force ESP rendering at regular intervals
    function forceESP() {
        if (!window.player || !window.mainContext) return;
        
        try {
            // Draw lines to all players
            window.mainContext.save();
            window.mainContext.lineWidth = 3;
            
            const players = window.players || [];
            const ais = window.ais || [];
            
            for (let i = 0; i < players.length; i++) {
                const target = players[i];
                if (!target || target.sid === window.player.sid) continue;
                
                // Calculate screen positions
                const playerX = window.player.x2 || window.player.x;
                const playerY = window.player.y2 || window.player.y;
                const targetX = target.x2 || target.x;
                const targetY = target.y2 || target.y;
                
                const playerScreenX = (playerX - window.camX) * window.camScale;
                const playerScreenY = (playerY - window.camY) * window.camScale;
                const targetScreenX = (targetX - window.camX) * window.camScale;
                const targetScreenY = (targetY - window.camY) * window.camScale;
                
                // Draw line from player to target
                window.mainContext.beginPath();
                window.mainContext.strokeStyle = "#FF0000";
                window.mainContext.moveTo(playerScreenX, playerScreenY);
                window.mainContext.lineTo(targetScreenX, targetScreenY);
                window.mainContext.stroke();
            }
            
            window.mainContext.restore();
            console.log('[ESP FIX] ESP lines drawn to', players.length, 'players');
        } catch (e) {
            console.error('[ESP FIX] Error drawing ESP:', e);
        }
    }
    
    // Run ESP every 100ms
    setInterval(forceESP, 100);
    
    // Also try to hook into animation frame
    const oldRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = function(callback) {
        return oldRAF(function() {
            const result = callback.apply(this, arguments);
            forceESP();
            return result;
        });
    };
    
    // Create a button to force toggle ESP
    const button = document.createElement('button');
    button.textContent = 'Force ESP';
    button.style.position = 'absolute';
    button.style.top = '10px';
    button.style.right = '10px';
    button.style.zIndex = '9999';
    button.style.backgroundColor = 'red';
    button.style.color = 'white';
    button.style.padding = '5px';
    button.style.border = 'none';
    button.style.cursor = 'pointer';
    button.onclick = forceESP;
    document.body.appendChild(button);
    
    console.log('[ESP FIX] ESP emergency fix loaded');
})();

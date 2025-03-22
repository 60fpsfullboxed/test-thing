/**
 * UnoReversed ESP Module
 * Enhanced ESP visualization for MooMoo.io
 * Author: Zylex
 */

(function() {
    console.log('[UNO ESP] Loading ESP module...');
    
    // ESP Configuration
    const ESP_CONFIG = {
        enabled: true,
        alwaysOn: true,
        lineWidth: 2,
        colors: {
            enemy: "#FF0000",
            ally: "#00FF00",
            ai: "#FFFF00",
            danger: "#FF00FF",
            resource: "#00FFFF"
        },
        renderDistance: 2000,
        showDistance: true,
        showHealth: true,
        showNames: true,
        dangerThreshold: 300,
        showResources: true
    };

    // Function to safely access game objects
    function getGameObjects() {
        return {
            player: window.player,
            players: window.players || [],
            ais: window.ais || [],
            gameObjects: window.gameObjects || [],
            mainContext: window.mainContext,
            camX: window.camX || 0,
            camY: window.camY || 0,
            camScale: window.camScale || 1,
            inGame: window.inGame || false,
            UTILS: window.UTILS
        };
    }
    
    // Helper functions
    function getDist(a, b) {
        try {
            return Math.hypot((b.y2 || b.y) - (a.y2 || a.y), (b.x2 || b.x) - (a.x2 || a.x));
        } catch (e) {
            return Infinity;
        }
    }
    
    function isTeammate(player, target) {
        if (!player || !target) return false;
        if (player.sid === target.sid) return true;
        return player.team && target.team && player.team === target.team;
    }

    // Main ESP rendering function
    function renderESP() {
        const game = getGameObjects();
        if (!ESP_CONFIG.enabled || !game.player || !game.player.alive || !game.inGame) return;

        const { player, players, ais, mainContext, camX, camY, camScale } = game;
        
        mainContext.save();
        mainContext.lineWidth = ESP_CONFIG.lineWidth;
        
        // Draw lines to players
        for (let i = 0; i < players.length; i++) {
            const target = players[i];
            if (!target || !target.active || !target.alive || target.sid === player.sid) continue;
            
            // Calculate distance
            const distance = getDist(player, target);
            if (distance > ESP_CONFIG.renderDistance) continue;
            
            // Calculate screen positions
            const playerScreenX = (player.x - camX) * camScale;
            const playerScreenY = (player.y - camY) * camScale;
            const targetScreenX = (target.x - camX) * camScale;
            const targetScreenY = (target.y - camY) * camScale;
            
            // Determine if target is dangerous (close enough)
            const isDangerous = distance < ESP_CONFIG.dangerThreshold;
            
            // Determine color based on team relationship
            const isAlly = isTeammate(player, target);
            const colorKey = isAlly ? "ally" : (isDangerous ? "danger" : "enemy");
            const lineColor = ESP_CONFIG.colors[colorKey];
            
            // Calculate opacity based on distance
            const opacity = Math.max(0.3, 1 - (distance / ESP_CONFIG.renderDistance));
            
            // Draw line from player to target
            mainContext.beginPath();
            mainContext.strokeStyle = lineColor.replace("#", "rgba(").replace(/([0-9A-F]{2})/gi, '$1,') + opacity + ")";
            mainContext.lineWidth = ESP_CONFIG.lineWidth * (isDangerous ? 1.5 : 1);
            mainContext.moveTo(playerScreenX, playerScreenY);
            mainContext.lineTo(targetScreenX, targetScreenY);
            mainContext.stroke();
            
            // Show additional information
            if (ESP_CONFIG.showDistance || ESP_CONFIG.showNames) {
                mainContext.fillStyle = lineColor;
                mainContext.font = `${isDangerous ? "bold " : ""}14px Ubuntu`;
                mainContext.textAlign = "center";
                
                let yOffset = targetScreenY - 30;
                
                // Show name if available
                if (ESP_CONFIG.showNames && target.name) {
                    mainContext.fillText(target.name, targetScreenX, yOffset);
                    yOffset -= 15;
                }
                
                // Show distance
                if (ESP_CONFIG.showDistance) {
                    const distText = Math.round(distance) + (isDangerous ? " [!]" : "");
                    mainContext.fillText(distText, targetScreenX, yOffset);
                }
                
                // Draw health bar if available
                if (ESP_CONFIG.showHealth && target.health !== undefined) {
                    const barWidth = 40;
                    const barHeight = 4;
                    const barX = targetScreenX - barWidth/2;
                    const barY = targetScreenY + 20;
                    
                    // Background
                    mainContext.fillStyle = "#000000";
                    mainContext.fillRect(barX, barY, barWidth, barHeight);
                    
                    // Health fill
                    const healthPercent = target.health / 100;
                    let fillColor = "#00FF00";
                    if (healthPercent < 0.7) fillColor = "#FFFF00";
                    if (healthPercent < 0.3) fillColor = "#FF0000";
                    
                    mainContext.fillStyle = fillColor;
                    mainContext.fillRect(barX, barY, barWidth * healthPercent, barHeight);
                }
            }
        }
        
        // Draw lines to AI enemies
        for (let i = 0; i < ais.length; i++) {
            const ai = ais[i];
            if (!ai || !ai.active || !ai.alive) continue;
            
            // Calculate screen positions
            const playerScreenX = (player.x - camX) * camScale;
            const playerScreenY = (player.y - camY) * camScale;
            const aiScreenX = (ai.x - camX) * camScale;
            const aiScreenY = (ai.y - camY) * camScale;
            
            // Calculate distance
            const distance = getDist(player, ai);
            if (distance > ESP_CONFIG.renderDistance) continue;
            
            // Calculate opacity based on distance
            const opacity = Math.max(0.3, 1 - (distance / ESP_CONFIG.renderDistance));
            
            // AI enemies are always drawn in yellow
            const lineColor = ESP_CONFIG.colors.ai;
            
            // Draw line from player to AI
            mainContext.beginPath();
            mainContext.strokeStyle = lineColor.replace("#", "rgba(").replace(/([0-9A-F]{2})/gi, '$1,') + opacity + ")";
            mainContext.lineWidth = ESP_CONFIG.lineWidth;
            mainContext.moveTo(playerScreenX, playerScreenY);
            mainContext.lineTo(aiScreenX, aiScreenY);
            mainContext.stroke();
            
            // Draw AI info
            if (ESP_CONFIG.showDistance || ESP_CONFIG.showNames) {
                mainContext.fillStyle = lineColor;
                mainContext.font = "14px Ubuntu";
                mainContext.textAlign = "center";
                
                let yOffset = aiScreenY - 30;
                
                // Show name if available
                if (ESP_CONFIG.showNames && ai.name) {
                    mainContext.fillText(ai.name || "AI", aiScreenX, yOffset);
                    yOffset -= 15;
                }
                
                // Show distance
                if (ESP_CONFIG.showDistance) {
                    mainContext.fillText(Math.round(distance) + "", aiScreenX, yOffset);
                }
            }
        }
        
        // Draw lines to important resources
        if (ESP_CONFIG.showResources) {
            const resources = (game.gameObjects || []).filter(obj => 
                obj.active && (obj.name === "food" || obj.name?.includes("stone") || obj.name?.includes("gold"))
            );
            
            for (let i = 0; i < resources.length; i++) {
                const resource = resources[i];
                if (!resource) continue;
                
                const distance = getDist(player, resource);
                if (distance > ESP_CONFIG.renderDistance / 2) continue; // Show resources at shorter range
                
                // Only show if looking for resources and not in combat
                if (players.filter(p => !isTeammate(player, p) && getDist(player, p) < ESP_CONFIG.dangerThreshold).length > 0) {
                    continue;
                }
                
                // Calculate screen positions
                const playerScreenX = (player.x - camX) * camScale;
                const playerScreenY = (player.y - camY) * camScale;
                const resourceScreenX = (resource.x - camX) * camScale;
                const resourceScreenY = (resource.y - camY) * camScale;
                
                // Calculate opacity based on distance
                const opacity = Math.max(0.2, 0.6 - (distance / ESP_CONFIG.renderDistance));
                
                // Draw line to resource
                mainContext.beginPath();
                mainContext.strokeStyle = ESP_CONFIG.colors.resource.replace("#", "rgba(").replace(/([0-9A-F]{2})/gi, '$1,') + opacity + ")";
                mainContext.lineWidth = ESP_CONFIG.lineWidth * 0.7;
                mainContext.moveTo(playerScreenX, playerScreenY);
                mainContext.lineTo(resourceScreenX, resourceScreenY);
                mainContext.stroke();
            }
        }
        
        mainContext.restore();
    }

    // Handle key presses for toggling ESP features
    function handleKeyControls(event) {
        if (event.key === 'v' || event.keyCode === 86) {
            ESP_CONFIG.enabled = !ESP_CONFIG.enabled;
            showStatusMessage();
        } else if (event.key === 'b') {
            ESP_CONFIG.showDistance = !ESP_CONFIG.showDistance;
        } else if (event.key === 'n') {
            ESP_CONFIG.showHealth = !ESP_CONFIG.showHealth;
        } else if (event.key === 'r') {
            ESP_CONFIG.showResources = !ESP_CONFIG.showResources;
        }
    }

    // Display status message using game's built-in function
    function showStatusMessage() {
        const game = getGameObjects();
        if (game.player && game.player.alive && window.ShowSettingTextGreen) {
            window.ShowSettingTextGreen(2, ESP_CONFIG.enabled ? "ESP Enabled" : "ESP Disabled");
        }
    }
    
    // Initialize the ESP system
    function initESP() {
        const game = getGameObjects();
        if (!game.mainContext || !window.renderer) {
            setTimeout(initESP, 1000); // Retry until game elements are ready
            return;
        }
        
        console.log('[UNO ESP] ESP module initialized!');
        
        // Add event listener for key controls
        document.addEventListener('keydown', handleKeyControls);
        
        // Hook into game's render loop
        if (window.renderer && typeof window.renderer.render === 'function') {
            const originalRender = window.renderer.render;
            window.renderer.render = function() {
                originalRender.apply(this, arguments);
                if (ESP_CONFIG.enabled || ESP_CONFIG.alwaysOn) {
                    renderESP();
                }
            };
        } else {
            // Fallback to our own render loop
            setInterval(function() {
                const game = getGameObjects();
                if (game.player && game.player.alive && game.inGame && game.mainContext) {
                    if (ESP_CONFIG.enabled || ESP_CONFIG.alwaysOn) {
                        renderESP();
                    }
                }
            }, 1000/60); // 60fps
        }
        
        // Add ESP controls to Visual settings menu
        setTimeout(() => {
            const visualTab = document.getElementById("Visual");
            if (visualTab) {
                // ESP controls are already added in the main script
                console.log('[UNO ESP] ESP controls already present in UI');
            }
        }, 1000);
    }
    
    // Create a global API for the ESP module
    window.unoESP = {
        config: ESP_CONFIG,
        toggle: function() {
            ESP_CONFIG.enabled = !ESP_CONFIG.enabled;
            showStatusMessage();
            return ESP_CONFIG.enabled;
        },
        render: renderESP
    };
    
    // Start initialization
    if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(initESP, 500);
    } else {
        document.addEventListener("DOMContentLoaded", () => setTimeout(initESP, 500));
    }
})();

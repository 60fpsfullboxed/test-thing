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
        lineWidth: 2, // Reduced line width for better visibility
        dotSize: 2, // Smaller dot size
        colors: {
            enemy: "#FF0000",
            ally: "#00FF00",
            ai: "#FFFF00",
            danger: "#FF00FF",
            resource: "#00FFFF"
        },
        renderDistance: 1600, // Maximum view distance for ESP
        showDistance: true,
        showHealth: true,
        showNames: true,
        dangerThreshold: 300,
        showResources: true
    };

    // Debugging variables
    let debugMode = true;
    let lastRenderTime = 0;
    let renderCount = 0;

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

    // Log player positions for debugging
    function logPlayerPositions() {
        const game = getGameObjects();
        if (!game.player || !game.players.length) return;
        
        console.log("Player position:", {
            x: game.player.x,
            y: game.player.y,
            x2: game.player.x2, 
            y2: game.player.y2
        });
        
        console.log("Other players:", game.players.length);
        game.players.slice(0, 3).forEach((p, i) => {
            console.log(`Player ${i}:`, {
                name: p.name,
                active: p.active,
                alive: p.alive,
                x: p.x,
                y: p.y,
                x2: p.x2,
                y2: p.y2
            });
        });
    }

    // Main ESP rendering function
    function renderESP() {
        const game = getGameObjects();
        if (!ESP_CONFIG.enabled || !game.player || !game.player.alive || !game.inGame) return;

        const { player, players, ais, mainContext, camX, camY, camScale } = game;
        
        // Debug rendering performance
        renderCount++;
        const now = Date.now();
        if (now - lastRenderTime > 2000) {
            console.log(`[UNO ESP] Rendering at ${renderCount / 2} FPS`);
            renderCount = 0;
            lastRenderTime = now;
            
            // Log data in debug mode
            if (debugMode) {
                logPlayerPositions();
            }
        }
        
        mainContext.save();
        mainContext.lineWidth = ESP_CONFIG.lineWidth;
        
        // Draw lines to players
        let drawnLines = 0;
        for (let i = 0; i < players.length; i++) {
            const target = players[i];
            if (!target || !target.active || !target.alive || target.sid === player.sid) continue;
            
            // Calculate coordinates
            const playerX = player.x2 !== undefined ? player.x2 : player.x;
            const playerY = player.y2 !== undefined ? player.y2 : player.y;
            const targetX = target.x2 !== undefined ? target.x2 : target.x;
            const targetY = target.y2 !== undefined ? target.y2 : target.y;
            
            // Calculate distance
            const distance = Math.hypot(targetX - playerX, targetY - playerY);
            if (distance > ESP_CONFIG.renderDistance) continue;
            
            // Calculate screen positions
            const playerScreenX = (playerX - camX) * camScale;
            const playerScreenY = (playerY - camY) * camScale;
            const targetScreenX = (targetX - camX) * camScale;
            const targetScreenY = (targetY - camY) * camScale;
            
            // Determine if target is dangerous (close enough)
            const isDangerous = distance < ESP_CONFIG.dangerThreshold;
            
            // Determine color based on team relationship
            const isAlly = isTeammate(player, target);
            const colorKey = isAlly ? "ally" : (isDangerous ? "danger" : "enemy");
            const lineColor = ESP_CONFIG.colors[colorKey];
            
            // Draw line from player to target
            mainContext.beginPath();
            mainContext.strokeStyle = lineColor;
            mainContext.lineWidth = ESP_CONFIG.lineWidth * (isDangerous ? 1.5 : 1);
            mainContext.moveTo(playerScreenX, playerScreenY);
            mainContext.lineTo(targetScreenX, targetScreenY);
            mainContext.stroke();
            
            drawnLines++;
            
            // Draw small dot at target position
            mainContext.beginPath();
            mainContext.fillStyle = lineColor;
            mainContext.arc(targetScreenX, targetScreenY, ESP_CONFIG.dotSize, 0, Math.PI * 2);
            mainContext.fill();
            
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
        
        // Log how many lines were drawn in this frame
        if (debugMode && drawnLines > 0) {
            console.log(`[UNO ESP] Drew ${drawnLines} lines to players`);
        }
        
        // Draw lines to AI enemies
        for (let i = 0; i < ais.length; i++) {
            const ai = ais[i];
            if (!ai || !ai.active || !ai.alive) continue;
            
            // Calculate coordinates
            const playerX = player.x2 !== undefined ? player.x2 : player.x;
            const playerY = player.y2 !== undefined ? player.y2 : player.y;
            const aiX = ai.x2 !== undefined ? ai.x2 : ai.x;
            const aiY = ai.y2 !== undefined ? ai.y2 : ai.y;
            
            // Calculate screen positions
            const playerScreenX = (playerX - camX) * camScale;
            const playerScreenY = (playerY - camY) * camScale;
            const aiScreenX = (aiX - camX) * camScale;
            const aiScreenY = (aiY - camY) * camScale;
            
            // Calculate distance
            const distance = Math.hypot(aiX - playerX, aiY - playerY);
            if (distance > ESP_CONFIG.renderDistance) continue;
            
            // AI enemies are always drawn in yellow
            const lineColor = ESP_CONFIG.colors.ai;
            
            // Draw line from player to AI
            mainContext.beginPath();
            mainContext.strokeStyle = lineColor;
            mainContext.lineWidth = ESP_CONFIG.lineWidth;
            mainContext.moveTo(playerScreenX, playerScreenY);
            mainContext.lineTo(aiScreenX, aiScreenY);
            mainContext.stroke();
            
            // Draw small dot at AI position
            mainContext.beginPath();
            mainContext.fillStyle = lineColor;
            mainContext.arc(aiScreenX, aiScreenY, ESP_CONFIG.dotSize, 0, Math.PI * 2);
            mainContext.fill();
            
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
        } else if (event.key === 'd' && event.ctrlKey) {
            // Ctrl+D toggles debug mode
            debugMode = !debugMode;
            console.log(`[UNO ESP] Debug mode ${debugMode ? 'enabled' : 'disabled'}`);
        }
    }

    // Display status message using game's built-in function
    function showStatusMessage() {
        const game = getGameObjects();
        if (game.player && game.player.alive && window.ShowSettingTextGreen) {
            window.ShowSettingTextGreen(2, ESP_CONFIG.enabled ? "ESP Enabled" : "ESP Disabled");
        } else {
            console.log(`[UNO ESP] ESP ${ESP_CONFIG.enabled ? 'enabled' : 'disabled'}`);
        }
    }
    
    // Alternative rendering method using requestAnimationFrame
    function setupDirectRendering() {
        function renderLoop() {
            try {
                renderESP();
            } catch (e) {
                console.error("[UNO ESP] Render error:", e);
            }
            requestAnimationFrame(renderLoop);
        }
        
        requestAnimationFrame(renderLoop);
    }
    
    // Initialize the ESP system
    function initESP() {
        const game = getGameObjects();
        if (!game.mainContext) {
            console.log("[UNO ESP] Game not ready yet, retrying in 1 second");
            setTimeout(initESP, 1000); // Retry until game elements are ready
            return;
        }
        
        console.log('[UNO ESP] ESP module initialized!');
        
        // Add event listener for key controls
        document.addEventListener('keydown', handleKeyControls);
        
        // Try multiple rendering methods for compatibility

        // Method 1: Hook into game's render function if available
        if (window.renderer && typeof window.renderer.render === 'function') {
            const originalRender = window.renderer.render;
            window.renderer.render = function() {
                originalRender.apply(this, arguments);
                if (ESP_CONFIG.enabled || ESP_CONFIG.alwaysOn) {
                    try {
                        renderESP();
                    } catch (e) {
                        console.error("[UNO ESP] Error in render hook:", e);
                    }
                }
            };
            console.log('[UNO ESP] Hooked into game renderer');
        } else {
            console.log('[UNO ESP] Game renderer not found, using fallback methods');
            
            // Method 2: Use requestAnimationFrame
            setupDirectRendering();
            
            // Method 3: Fallback to interval (least preferred but most reliable)
            setInterval(function() {
                if (ESP_CONFIG.enabled || ESP_CONFIG.alwaysOn) {
                    const game = getGameObjects();
                    if (game.player && game.player.alive && game.inGame && game.mainContext) {
                        try {
                            renderESP();
                        } catch (e) {
                            console.error("[UNO ESP] Error in interval render:", e);
                        }
                    }
                }
            }, 1000/30); // 30fps
        }
        
        // Display initial status
        showStatusMessage();
    }
    
    // Create a global API for the ESP module
    window.unoESP = {
        config: ESP_CONFIG,
        toggle: function() {
            ESP_CONFIG.enabled = !ESP_CONFIG.enabled;
            showStatusMessage();
            return ESP_CONFIG.enabled;
        },
        render: renderESP,
        debug: function() {
            debugMode = !debugMode;
            console.log(`[UNO ESP] Debug mode ${debugMode ? 'enabled' : 'disabled'}`);
            return debugMode;
        }
    };
    
    // Start initialization
    if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(initESP, 500);
    } else {
        document.addEventListener("DOMContentLoaded", () => setTimeout(initESP, 500));
    }
})();

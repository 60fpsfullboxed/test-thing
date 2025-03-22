/**
 * ESP Module for improved enemy detection and visualization
 */

class ESP {
    constructor() {
        this.enabled = true;
        this.lineWidth = 2;
        this.enemyColor = "#ff0000";
        this.allyColor = "#00ff00";
        this.neutralColor = "#ffff00";
        this.maxRenderDistance = 10000; // Effectively unlimited
    }
    
    /**
     * Draw ESP line between two points
     */
    drawLine(ctx, x1, y1, x2, y2, color, width) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = width || this.lineWidth;
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
    
    /**
     * Draw text at a specific position
     */
    drawText(ctx, text, x, y, color) {
        ctx.fillStyle = color;
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(text, x, y);
    }
    
    /**
     * Determine if a player is an enemy
     */
    isEnemy(player, myPlayer) {
        // Team check - if teams exist and are different, they're enemies
        if (player.team !== undefined && myPlayer.team !== undefined) {
            return player.team !== myPlayer.team;
        }
        
        // If no team system or same team, consider non-allies as enemies
        return !this.isAlly(player, myPlayer);
    }
    
    /**
     * Determine if a player is an ally
     */
    isAlly(player, myPlayer) {
        // Same team
        if (player.team !== undefined && myPlayer.team !== undefined) {
            return player.team === myPlayer.team;
        }
        
        // Check for clan/alliance
        return player.clan === myPlayer.clan && player.clan !== undefined;
    }
    
    /**
     * Draw ESP for a specific player
     */
    drawPlayerESP(ctx, player, myPlayer, camX, camY) {
        if (!player || !player.x || !player.y || player.id === myPlayer.id) return;
        
        // Calculate screen positions
        const x1 = myPlayer.x - camX;
        const y1 = myPlayer.y - camY;
        const x2 = player.x - camX;
        const y2 = player.y - camY;
        
        // Calculate distance
        const distance = Math.sqrt(Math.pow(player.x - myPlayer.x, 2) + Math.pow(player.y - myPlayer.y, 2));
        
        // Determine color based on relationship
        let color;
        if (this.isEnemy(player, myPlayer)) {
            color = this.enemyColor;
        } else if (this.isAlly(player, myPlayer)) {
            color = this.allyColor;
        } else {
            color = this.neutralColor;
        }
        
        // Draw line
        this.drawLine(ctx, x1, y1, x2, y2, color, this.lineWidth);
        
        // Draw distance text
        this.drawText(ctx, Math.floor(distance) + "m", (x1 + x2) / 2, (y1 + y2) / 2 - 10, color);
        
        // Draw name if available
        if (player.name) {
            this.drawText(ctx, player.name, x2, y2 - 20, color);
        }
    }
    
    /**
     * Main render function to draw ESP for all players
     */
    render(ctx, players, myPlayer, camX, camY) {
        if (!this.enabled || !myPlayer || !players || !players.length) return;
        
        // Save context state
        ctx.save();
        
        // Draw ESP for all players
        for (let i = 0; i < players.length; i++) {
            this.drawPlayerESP(ctx, players[i], myPlayer, camX, camY);
        }
        
        // Restore context state
        ctx.restore();
    }
}

// Export the ESP class
window.ESP = ESP;

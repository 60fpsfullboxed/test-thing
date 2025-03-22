/**
 * Advanced ESP Module for improved enemy detection and visualization
 * Always enabled for maximum advantage
 */

class ESP {
    constructor() {
        // Force enabled, cannot be disabled
        this.enabled = true;
        this.lineWidth = 2;
        this.enemyColor = "#ff0000";
        this.allyColor = "#00ff00";
        this.neutralColor = "#ffff00";
        this.maxRenderDistance = 10000;
        this.boxSize = 20; // Size of boxes around players
        this.showHealthBars = true;
        this.proximityThreshold = 300; // Distance at which to highlight nearby enemies
        this.proximityColor = "#ff00ff"; // Bright magenta for close enemies
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
        // Add shadow for better visibility
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        ctx.fillStyle = color;
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(text, x, y);
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
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
     * Draw a box around a player
     */
    drawBox(ctx, x, y, size, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x - size/2, y - size/2, size, size);
    }
    
    /**
     * Draw health bar if health data is available
     */
    drawHealthBar(ctx, player, x, y, width) {
        if (player.health === undefined || player.maxHealth === undefined) return;
        
        const healthPercent = player.health / player.maxHealth;
        const barWidth = width || 40;
        const barHeight = 4;
        const barX = x - barWidth/2;
        const barY = y + 25;
        
        // Background
        ctx.fillStyle = "#000000";
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Health fill
        let fillColor = "#00ff00"; // Green for high health
        if (healthPercent < 0.7) fillColor = "#ffff00"; // Yellow for medium health
        if (healthPercent < 0.3) fillColor = "#ff0000"; // Red for low health
        
        ctx.fillStyle = fillColor;
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
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
        
        // Skip if beyond render distance
        if (distance > this.maxRenderDistance) return;
        
        // Determine color based on relationship and proximity
        let color;
        const isClose = distance < this.proximityThreshold;
        
        if (this.isEnemy(player, myPlayer)) {
            color = isClose ? this.proximityColor : this.enemyColor;
        } else if (this.isAlly(player, myPlayer)) {
            color = this.allyColor;
        } else {
            color = this.neutralColor;
        }
        
        // Draw line with adaptive width based on distance
        const lineWidth = isClose ? this.lineWidth * 2 : this.lineWidth;
        this.drawLine(ctx, x1, y1, x2, y2, color, lineWidth);
        
        // Draw box around player
        this.drawBox(ctx, x2, y2, this.boxSize + (isClose ? 5 : 0), color);
        
        // Draw distance text with additional info
        let infoText = Math.floor(distance) + "m";
        if (isClose) infoText += " [CLOSE!]";
        this.drawText(ctx, infoText, (x1 + x2) / 2, (y1 + y2) / 2 - 10, color);
        
        // Draw name if available
        if (player.name) {
            let nameText = player.name;
            if (player.level) nameText += ` [Lvl ${player.level}]`;
            this.drawText(ctx, nameText, x2, y2 - 20, color);
        }
        
        // Draw health bar if enabled
        if (this.showHealthBars) {
            this.drawHealthBar(ctx, player, x2, y2, 40);
        }
    }
    
    /**
     * Main render function to draw ESP for all players
     * Always runs regardless of enabled state
     */
    render(ctx, players, myPlayer, camX, camY) {
        if (!myPlayer || !players || !players.length) return;
        
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

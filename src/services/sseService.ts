import { Response } from 'express';

/**
 * Server-Sent Events (SSE) Service
 * Manages real-time notifications to connected clients
 */
class SSEService {
  private clients: Map<string, Response[]> = new Map();

  /**
   * Add a client connection
   */
  addClient(userId: string, res: Response): void {
    console.log(`📡 SSE client connected: ${userId}`);
    
    // Get existing connections for this user
    const userClients = this.clients.get(userId) || [];
    userClients.push(res);
    this.clients.set(userId, userClients);
    
    // Setup SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // Disable nginx buffering
    });
    
    // Send initial connection message
    this.sendToClient(res, {
      type: 'connected',
      message: 'SSE connection established',
      timestamp: new Date().toISOString()
    });
    
    // Send heartbeat every 30 seconds to keep connection alive
    const heartbeat = setInterval(() => {
      this.sendToClient(res, {
        type: 'heartbeat',
        timestamp: new Date().toISOString()
      });
    }, 30000);
    
    // Handle client disconnect
    res.on('close', () => {
      clearInterval(heartbeat);
      this.removeClient(userId, res);
      console.log(`📡 SSE client disconnected: ${userId}`);
    });
  }

  /**
   * Remove a client connection
   */
  private removeClient(userId: string, res: Response): void {
    const userClients = this.clients.get(userId);
    if (userClients) {
      const filtered = userClients.filter(client => client !== res);
      if (filtered.length > 0) {
        this.clients.set(userId, filtered);
      } else {
        this.clients.delete(userId);
      }
    }
  }

  /**
   * Send message to specific client
   */
  private sendToClient(res: Response, data: any): void {
    try {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      console.error('Error sending SSE message:', error);
    }
  }

  /**
   * Send appointment delay notification to patient
   */
  sendDelayNotification(patientId: string, data: {
    appointmentId: string;
    doctorName: string;
    originalTime: string;
    estimatedTime: string;
    delayMinutes: number;
    reason?: string;
  }): void {
    const userClients = this.clients.get(patientId);
    
    if (!userClients || userClients.length === 0) {
      console.log(`⚠️ No SSE clients connected for patient ${patientId}`);
      return;
    }
    
    console.log(`📡 Sending delay notification to ${userClients.length} client(s) for patient ${patientId}`);
    
    const message = {
      type: 'appointment-delay',
      data: {
        appointmentId: data.appointmentId,
        doctorName: data.doctorName,
        originalTime: data.originalTime,
        estimatedTime: data.estimatedTime,
        delayMinutes: data.delayMinutes,
        reason: data.reason,
        message: `${data.doctorName} is running ${data.delayMinutes} minutes late. Your new appointment time is ${data.estimatedTime}.`
      },
      timestamp: new Date().toISOString()
    };
    
    userClients.forEach(client => {
      this.sendToClient(client, message);
    });
  }

  /**
   * Send delay cleared notification
   */
  sendDelayClearedNotification(patientId: string, data: {
    appointmentId: string;
    doctorName: string;
    originalTime: string;
  }): void {
    const userClients = this.clients.get(patientId);
    
    if (!userClients || userClients.length === 0) {
      return;
    }
    
    console.log(`📡 Sending delay cleared notification to patient ${patientId}`);
    
    const message = {
      type: 'delay-cleared',
      data: {
        appointmentId: data.appointmentId,
        doctorName: data.doctorName,
        originalTime: data.originalTime,
        message: `Good news! ${data.doctorName} is back on schedule. Your appointment time is ${data.originalTime}.`
      },
      timestamp: new Date().toISOString()
    };
    
    userClients.forEach(client => {
      this.sendToClient(client, message);
    });
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    let total = 0;
    this.clients.forEach(clients => {
      total += clients.length;
    });
    return total;
  }

  /**
   * Get connected clients by user
   */
  getStats(): any {
    const stats: any = {
      totalConnections: this.getConnectedClientsCount(),
      uniqueUsers: this.clients.size,
      users: []
    };
    
    this.clients.forEach((clients, userId) => {
      stats.users.push({
        userId,
        connections: clients.length
      });
    });
    
    return stats;
  }
}

export default new SSEService();

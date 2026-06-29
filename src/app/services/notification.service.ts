import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Client, Message, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private stompClient: Client;
  private backendUrl = environment.apiUrl;
  
  private notificationSubject = new Subject<any>();
  public notifications$ = this.notificationSubject.asObservable();
  
  // Keep track of unread count if we want to show a badge
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();
  
  private currentSub: StompSubscription | null = null;

  constructor(private http: HttpClient) {
    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(`${this.backendUrl}/ws/chat`),
      reconnectDelay: 5000,
      debug: (str) => {}
    });
  }

  private connectedUserId: number | null = null;

  public connect(userId: number) {
    if (this.connectedUserId === userId && this.stompClient.connected) {
       return;
    }
    this.connectedUserId = userId;

    // Obtener las notificaciones iniciales al conectarse para tener el contador real
    this.getUserAlerts(userId).subscribe(alerts => {
      const unreadCount = alerts.filter(a => !a.leido).length;
      this.setUnreadCount(unreadCount);
    });

    this.stompClient.onConnect = () => {
      if (this.currentSub) {
        this.currentSub.unsubscribe();
      }
      this.currentSub = this.stompClient.subscribe(`/topic/alerts/${userId}`, (message: Message) => {
        if (message.body) {
          const alert = JSON.parse(message.body);
          this.notificationSubject.next(alert);
          this.incrementUnreadCount();
        }
      });
    };
    this.stompClient.activate();
  }

  public disconnect() {
    this.stompClient.deactivate();
  }

  // REST API methods
  getUserAlerts(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.backendUrl}/api/v1/alerts/user/${userId}`);
  }

  markAsRead(alertId: number): Observable<any> {
    return this.http.patch(`${this.backendUrl}/api/v1/alerts/${alertId}/read`, {});
  }

  // Helpers for unread badge
  setUnreadCount(count: number) {
    this.unreadCountSubject.next(count);
  }

  incrementUnreadCount() {
    this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
  }

  decrementUnreadCount() {
    const current = this.unreadCountSubject.value;
    if (current > 0) {
      this.unreadCountSubject.next(current - 1);
    }
  }
}
